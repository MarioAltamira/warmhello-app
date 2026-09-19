import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { parseJsonBody } from "@/lib/zod-parse";
import {
  extractIpFromRequest,
  extractUserAgentFromRequest,
  recordSecurityAudit,
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
import { verifyPassword } from "@/lib/password";
import {
  checkRateLimit,
  formatRetrySeconds,
} from "@/lib/rate-limit";

const GENERIC_LOGIN_FAILURE = "Incorrect email or password.";
const LEGACY_NULL_HASH_GUIDANCE =
  "Incorrect email or password. If you created your account before passwords were enabled, use 'Email me a secure sign-in link' to set your first password and log in.";

const bodySchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(128),
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

  const ipAddress = extractIpFromRequest(request);
  const userAgent = extractUserAgentFromRequest(request);
  const { email, password } = parsed.data;

  const perEmailLimit = checkRateLimit(
    `login:email:${email}`,
    15 * 60_000,
    5,
  );
  if (!perEmailLimit.allowed) {
    await recordSecurityAudit({
      kind: "LOGIN_PASSWORD_RATE_LIMITED",
      subscriberId: null,
      email,
      ipAddress,
      userAgent,
      detail: { per: "email" },
    });
    return NextResponse.json(
      {
        ok: false,
        message: `Too many log-in attempts for this email. Please wait ${formatRetrySeconds(
          perEmailLimit.retryAfterMs,
        )} and try again.`,
      },
      { status: 429 },
    );
  }

  const perIpLimit = checkRateLimit(
    `login:ip:${ipAddress ?? "unknown"}`,
    15 * 60_000,
    10,
  );
  if (!perIpLimit.allowed) {
    await recordSecurityAudit({
      kind: "LOGIN_PASSWORD_RATE_LIMITED",
      subscriberId: null,
      email,
      ipAddress,
      userAgent,
      detail: { per: "ip" },
    });
    return NextResponse.json(
      {
        ok: false,
        message: `Too many log-in attempts from this location. Please wait ${formatRetrySeconds(
          perIpLimit.retryAfterMs,
        )} and try again.`,
      },
      { status: 429 },
    );
  }

  const subscriber = await prisma.subscriber.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      fullName: true,
      unsubscribedAt: true,
      subscriptionStatus: true,
    },
  });

  if (!subscriber || subscriber.unsubscribedAt) {
    await verifyPassword(password, null);
    if (subscriber?.unsubscribedAt) {
      await recordSecurityAudit({
        kind: "LOGIN_PASSWORD_FAILED_UNSUBSCRIBED",
        subscriberId: subscriber.id,
        email,
        ipAddress,
        userAgent,
      });
    } else {
      await recordSecurityAudit({
        kind: "LOGIN_PASSWORD_FAILED_NO_SUBSCRIBER",
        subscriberId: null,
        email,
        ipAddress,
        userAgent,
      });
    }
    return NextResponse.json(
      { ok: false, message: GENERIC_LOGIN_FAILURE },
      { status: 401 },
    );
  }

  if (!subscriber.passwordHash) {
    await verifyPassword(password, null);
    await recordSecurityAudit({
      kind: "LOGIN_PASSWORD_FAILED_LEGACY_NO_HASH",
      subscriberId: subscriber.id,
      email,
      ipAddress,
      userAgent,
    });
    return NextResponse.json(
      { ok: false, message: LEGACY_NULL_HASH_GUIDANCE },
      { status: 401 },
    );
  }

  const passwordMatches = await verifyPassword(password, subscriber.passwordHash);
  if (!passwordMatches) {
    await recordSecurityAudit({
      kind: "LOGIN_PASSWORD_FAILED_WRONG_PASSWORD",
      subscriberId: subscriber.id,
      email,
      ipAddress,
      userAgent,
    });
    return NextResponse.json(
      { ok: false, message: GENERIC_LOGIN_FAILURE },
      { status: 401 },
    );
  }

  await recordSecurityAudit({
    kind: "SESSION_LOGIN_PASSWORD",
    subscriberId: subscriber.id,
    email,
    ipAddress,
    userAgent,
    redirectTarget: "/dashboard",
  });

  const response = NextResponse.json({
    ok: true,
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
