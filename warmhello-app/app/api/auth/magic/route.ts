import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { parseJsonBody } from "@/lib/zod-parse";
import {
  createNonce,
  extractIpFromRequest,
  extractUserAgentFromRequest,
  recordSecurityAudit,
  verifyMagicLinkToken,
} from "@/lib/security-audit";
import {
  getSubscriberSessionBootId,
  signSessionSubscriberId,
  subscriberSessionBootCookieName,
  subscriberSessionCookieName,
  subscriberSessionCookieOptions,
  subscriberSessionPresenceCookieName,
  subscriberSessionPresenceCookieOptions,
} from "@/lib/subscriber-session";

const bodySchema = z.object({
  token: z.string().min(1),
});

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!prisma) {
    return NextResponse.json(
      { ok: false, status: "error", message: "Database is not configured yet." },
      { status: 500 },
    );
  }

  const parsed = await parseJsonBody(request, bodySchema);
  if (!parsed.ok) return parsed.response;

  const token = parsed.data.token;
  const ipAddress = extractIpFromRequest(request);
  const userAgent = extractUserAgentFromRequest(request);

  const verify = verifyMagicLinkToken(token);
  if (!verify.ok) {
    await recordSecurityAudit({
      kind: verify.reason,
      subscriberId: null,
      email: null,
      ipAddress,
      userAgent,
      detail: {
        failureReason: verify.reason,
        tokenLen: token.length,
      },
    });
    const msg =
      verify.reason === "MAGIC_LINK_EXPIRED"
        ? "This log-in link has expired. Please request a new one."
        : "This log-in link is no longer valid. Please request a new one.";
    return NextResponse.json({
      ok: false,
      status: verify.reason === "MAGIC_LINK_EXPIRED" ? "expired" : "invalid",
      message: msg,
    });
  }

  const { payload } = verify;

  const subscriber = await prisma.subscriber.findUnique({
    where: { id: payload.subscriberId },
    select: {
      id: true,
      email: true,
      fullName: true,
      magicLinkNonce: true,
      subscriptionStatus: true,
      unsubscribedAt: true,
    },
  });

  if (!subscriber || subscriber.unsubscribedAt) {
    await recordSecurityAudit({
      kind: "MAGIC_LINK_FAILED_NO_SUBSCRIBER",
      subscriberId: payload.subscriberId,
      tokenJti: payload.jti,
      magicLinkNonce: payload.nonce ?? undefined,
      ipAddress,
      userAgent,
    });
    return NextResponse.json({
      ok: false,
      status: "invalid",
      message: "This log-in link is no longer valid. Please request a new one.",
    });
  }

  if ((subscriber.magicLinkNonce ?? null) !== (payload.nonce ?? null)) {
    await recordSecurityAudit({
      kind: "MAGIC_LINK_REUSE_ATTEMPT",
      subscriberId: subscriber.id,
      email: subscriber.email,
      tokenJti: payload.jti,
      magicLinkNonce: payload.nonce ?? undefined,
      ipAddress,
      userAgent,
      detail: {
        tokenNonce: payload.nonce ?? null,
        currentNonce: subscriber.magicLinkNonce ?? null,
      },
    });
    return NextResponse.json({
      ok: false,
      status: "reused",
      message:
        "This log-in link has already been used once. Please request a new link.",
    });
  }

  const newNonce = createNonce();
  const now = new Date();

  const [_updated] = await Promise.all([
    prisma.subscriber.update({
      where: { id: subscriber.id },
      data: {
        magicLinkNonce: newNonce,
        magicLinkNonceRotatedAt: now,
      },
      select: { id: true },
    }),
    recordSecurityAudit({
      kind: "MAGIC_LINK_COMPLETED",
      subscriberId: subscriber.id,
      email: subscriber.email,
      tokenJti: payload.jti,
      magicLinkNonce: newNonce,
      ipAddress,
      userAgent,
      redirectTarget: "/dashboard",
    }),
    recordSecurityAudit({
      kind: "SESSION_LOGIN_MAGIC_LINK",
      subscriberId: subscriber.id,
      email: subscriber.email,
      tokenJti: payload.jti,
      ipAddress,
      userAgent,
      redirectTarget: "/dashboard",
    }),
  ]);

  const response = NextResponse.json({
    ok: true,
    status: "ok",
    redirect: "/dashboard",
    subscriber: {
      id: subscriber.id,
      email: subscriber.email,
      fullName: subscriber.fullName,
    },
  });

  response.cookies.set(
    subscriberSessionCookieName,
    signSessionSubscriberId(subscriber.id),
    subscriberSessionCookieOptions,
  );
  response.cookies.set(
    subscriberSessionBootCookieName,
    getSubscriberSessionBootId(),
    subscriberSessionCookieOptions,
  );
  response.cookies.set(
    subscriberSessionPresenceCookieName,
    "1",
    subscriberSessionPresenceCookieOptions,
  );

  return response;
}
