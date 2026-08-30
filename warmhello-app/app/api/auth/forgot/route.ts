import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { parseJsonBody } from "@/lib/zod-parse";
import {
  createJti,
  extractIpFromRequest,
  extractUserAgentFromRequest,
  recordSecurityAudit,
  signMagicLinkToken,
} from "@/lib/security-audit";
import { sendMagicLoginLinkEmail } from "@/lib/trial-emails";
import { env } from "@/lib/env";

const MAGIC_LINK_EXPIRES_MINUTES = 30;

function formatExpiresLabel(date: Date): string {
  try {
    return date.toLocaleString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "shortGeneric",
    }) + " local time";
  } catch {
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())} local time`;
  }
}

const bodySchema = z.object({
  email: z.string().email().max(254),
});

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!prisma) {
    return NextResponse.json(
      { ok: false, message: "Database is not configured yet." },
      { status: 500 },
    );
  }

  const parsed = await parseJsonBody(request, bodySchema);
  if (!parsed.ok) return parsed.response;

  const email = parsed.data.email.trim().toLowerCase();
  const ipAddress = extractIpFromRequest(request);
  const userAgent = extractUserAgentFromRequest(request);

  const subscriber = await prisma.subscriber.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      fullName: true,
      magicLinkNonce: true,
      magicLinkNonceRotatedAt: true,
      unsubscribedAt: true,
    },
  });

  await recordSecurityAudit({
    kind: subscriber ? "MAGIC_LINK_REQUESTED" : "MAGIC_LINK_FAILED_NO_SUBSCRIBER",
    subscriberId: subscriber?.id ?? null,
    email,
    ipAddress,
    userAgent,
    detail: {
      emailProvided: email,
      foundSubscriber: Boolean(subscriber),
    },
  });

  if (!subscriber) {
    return NextResponse.json({
      ok: true,
      message:
        "If that email is registered with Warm-Hello, check your inbox for a secure log-in link.",
    });
  }

  if (subscriber.unsubscribedAt) {
    return NextResponse.json({
      ok: true,
      message:
        "If that email is registered with Warm-Hello, check your inbox for a secure log-in link.",
    });
  }

  const jti = createJti();
  const nowSec = Math.floor(Date.now() / 1000);
  const expSec = nowSec + MAGIC_LINK_EXPIRES_MINUTES * 60;
  const expiresAt = new Date(expSec * 1000);
  const expiresAtLabel = formatExpiresLabel(expiresAt);

  const token = signMagicLinkToken({
    subscriberId: subscriber.id,
    jti,
    nonce: subscriber.magicLinkNonce ?? null,
    exp: expSec,
  });

  const magicLink = `${env.APP_URL}/auth/magic?token=${encodeURIComponent(token)}`;

  await recordSecurityAudit({
    kind: "MAGIC_LINK_SENT",
    subscriberId: subscriber.id,
    email,
    ipAddress,
    userAgent,
    tokenJti: jti,
    tokenExpiresAt: expiresAt,
    magicLinkNonce: subscriber.magicLinkNonce ?? undefined,
    detail: {
      expiresAt: expiresAt.toISOString(),
    },
  });

  try {
    await sendMagicLoginLinkEmail({
      toEmail: subscriber.email,
      subscriberFullName: subscriber.fullName || null,
      subscriberId: subscriber.id,
      magicLink,
      expiresAtLabel,
      ipAddress,
    });
  } catch (err) {
    console.error("[api/auth/forgot] sendMagicLoginLinkEmail failed:", err);
  }

  return NextResponse.json({
    ok: true,
    message:
      "If that email is registered with Warm-Hello, check your inbox for a secure log-in link.",
  });
}
