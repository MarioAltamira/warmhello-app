import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  getSubscriberSessionBootId,
  signSessionSubscriberId,
  subscriberSessionBootCookieName,
  subscriberSessionCookieName,
  subscriberSessionCookieOptions,
  subscriberSessionPresenceCookieName,
  subscriberSessionPresenceCookieOptions,
} from "@/lib/subscriber-session";
import { parseJsonBody } from "@/lib/zod-parse";
import {
  extractIpFromRequest,
  extractUserAgentFromRequest,
  recordSecurityAudit,
} from "@/lib/security-audit";
import { cookies } from "next/headers";
import {
  checkRateLimit,
  formatRetrySeconds,
} from "@/lib/rate-limit";

const bodySchema = z.object({
  email: z.string().email().optional(),
  subscriberId: z.string().min(1).optional(),
});

const EMAIL_LOGIN_DISABLED_MESSAGE =
  "Email-only login is no longer supported. Log in with your email and password, or use 'Can't log in? Email me a secure sign-in link' to set or reset your password.";

export async function POST(request: Request) {
  if (!prisma) {
    return NextResponse.json(
      { ok: false, message: "Database is not configured yet." },
      { status: 500 },
    );
  }

  const parsed = await parseJsonBody(request, bodySchema);
  if (!parsed.ok) return parsed.response;

  const ipAddress = extractIpFromRequest(request);
  const userAgent = extractUserAgentFromRequest(request);

  if (parsed.data.email) {
    await recordSecurityAudit({
      kind: "SESSION_LOGIN_EMAIL_ONLY_BLOCKED",
      email: parsed.data.email,
      subscriberId: null,
      ipAddress,
      userAgent,
    });
    return NextResponse.json(
      { ok: false, message: EMAIL_LOGIN_DISABLED_MESSAGE },
      { status: 400 },
    );
  }

  const subscriberId = parsed.data.subscriberId;
  if (!subscriberId) {
    return NextResponse.json(
      { ok: false, message: "subscriberId is required." },
      { status: 400 },
    );
  }

  const perIdLimit = checkRateLimit(
    `session:subscriberId:${subscriberId}`,
    60_000,
    5,
  );
  if (!perIdLimit.allowed) {
    await recordSecurityAudit({
      kind: "SESSION_LOGIN_RATE_LIMITED",
      subscriberId,
      ipAddress,
      userAgent,
      detail: { per: "subscriberId" },
    });
    return NextResponse.json(
      {
        ok: false,
        message: `Too many recent log-in attempts. Please wait ${formatRetrySeconds(
          perIdLimit.retryAfterMs,
        )} and try again.`,
      },
      { status: 429 },
    );
  }

  const perIpLimit = checkRateLimit(
    `session:ip:${ipAddress ?? "unknown"}`,
    60_000,
    10,
  );
  if (!perIpLimit.allowed) {
    await recordSecurityAudit({
      kind: "SESSION_LOGIN_RATE_LIMITED",
      subscriberId,
      ipAddress,
      userAgent,
      detail: { per: "ip" },
    });
    return NextResponse.json(
      {
        ok: false,
        message: `Too many recent log-in attempts from this location. Please wait ${formatRetrySeconds(
          perIpLimit.retryAfterMs,
        )} and try again.`,
      },
      { status: 429 },
    );
  }

  const subscriber = await prisma.subscriber.findUnique({
    where: { id: subscriberId },
  });

  if (!subscriber) {
    await recordSecurityAudit({
      kind: "MAGIC_LINK_FAILED_NO_SUBSCRIBER",
      subscriberId,
      ipAddress,
      userAgent,
      detail: { bySubscriberId: true },
    });
    return NextResponse.json(
      {
        ok: false,
        message: "We could not find a subscriber with that id.",
      },
      { status: 404 },
    );
  }

  if (subscriber.unsubscribedAt) {
    await recordSecurityAudit({
      kind: "SESSION_LOGIN_BLOCKED_UNSUBSCRIBED",
      subscriberId: subscriber.id,
      email: subscriber.email,
      ipAddress,
      userAgent,
    });
    return NextResponse.json(
      { ok: false, message: "Subscriber account has been removed." },
      { status: 403 },
    );
  }

  await recordSecurityAudit({
    kind: "SESSION_LOGIN_SUBSCRIBER_ID",
    subscriberId: subscriber.id,
    email: subscriber.email,
    ipAddress,
    userAgent,
    redirectTarget: "/dashboard",
  });

  const response = NextResponse.json({
    ok: true,
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

export async function DELETE(request: Request) {
  const ipAddress = extractIpFromRequest(request);
  const userAgent = extractUserAgentFromRequest(request);
  let subscriberId: string | null = null;

  try {
    const jar = await cookies();
    const signedCookie = jar.get(subscriberSessionCookieName)?.value ?? null;
    if (signedCookie) {
      const { verifySigned } = await import("@/lib/subscriber-session");
      subscriberId = verifySigned(signedCookie);
    }
  } catch {
    subscriberId = null;
  }

  if (subscriberId) {
    try {
      const sub = await prisma?.subscriber.findUnique({
        where: { id: subscriberId },
        select: { id: true, email: true },
      });
      await recordSecurityAudit({
        kind: "SESSION_LOGOUT",
        subscriberId: sub?.id,
        email: sub?.email ?? undefined,
        ipAddress,
        userAgent,
      });
    } catch {
      // ignore audit errors in logout path
    }
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(subscriberSessionCookieName, "", {
    ...subscriberSessionCookieOptions,
    maxAge: 0,
  });
  response.cookies.set(subscriberSessionBootCookieName, "", {
    ...subscriberSessionCookieOptions,
    maxAge: 0,
  });
  response.cookies.set(subscriberSessionPresenceCookieName, "", {
    ...subscriberSessionPresenceCookieOptions,
    maxAge: 0,
  });
  return response;
}
