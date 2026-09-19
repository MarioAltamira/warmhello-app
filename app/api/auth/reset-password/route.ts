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
  validatePasswordStrength,
  hashPassword,
} from "@/lib/password";
import { sendPasswordSetResetAuditEmail } from "@/lib/trial-emails";
import {
  checkRateLimit,
  formatRetrySeconds,
} from "@/lib/rate-limit";

const bodySchema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(1).max(128),
    confirmPassword: z.string().min(1).max(128),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
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

  const { token, password } = parsed.data;
  const ipAddress = extractIpFromRequest(request);
  const userAgent = extractUserAgentFromRequest(request);

  const globalLimit = checkRateLimit(
    `reset-password:global`,
    60_000,
    20,
  );
  if (!globalLimit.allowed) {
    await recordSecurityAudit({
      kind: "MAGIC_LINK_RATE_LIMITED",
      subscriberId: null,
      email: null,
      ipAddress,
      userAgent,
      detail: { route: "reset-password", per: "global" },
    });
    return NextResponse.json(
      {
        ok: false,
        message: `Too many password reset attempts system-wide. Please wait ${formatRetrySeconds(
          globalLimit.retryAfterMs,
        )} and try again.`,
      },
      { status: 429 },
    );
  }

  const perIpLimit = checkRateLimit(
    `reset-password:ip:${ipAddress ?? "unknown"}`,
    15 * 60_000,
    15,
  );
  if (!perIpLimit.allowed) {
    await recordSecurityAudit({
      kind: "MAGIC_LINK_RATE_LIMITED",
      subscriberId: null,
      email: null,
      ipAddress,
      userAgent,
      detail: { route: "reset-password", per: "ip" },
    });
    return NextResponse.json(
      {
        ok: false,
        message: `Too many password reset attempts from this location. Please wait ${formatRetrySeconds(
          perIpLimit.retryAfterMs,
        )} and try again.`,
      },
      { status: 429 },
    );
  }

  const perTokenLimit = checkRateLimit(
    `reset-password:token:${token}`,
    15 * 60_000,
    5,
  );
  if (!perTokenLimit.allowed) {
    await recordSecurityAudit({
      kind: "MAGIC_LINK_RATE_LIMITED",
      subscriberId: null,
      email: null,
      ipAddress,
      userAgent,
      detail: { route: "reset-password", per: "token" },
    });
    return NextResponse.json(
      {
        ok: false,
        message: `Too many attempts with this reset link. Please wait ${formatRetrySeconds(
          perTokenLimit.retryAfterMs,
        )} and try again.`,
      },
      { status: 429 },
    );
  }

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
        context: "reset-password",
      },
    });
    const msg =
      verify.reason === "MAGIC_LINK_EXPIRED"
        ? "This password reset link has expired. Please request a new one."
        : "This password reset link is no longer valid. Please request a new one.";
    return NextResponse.json(
      {
        ok: false,
        status:
          verify.reason === "MAGIC_LINK_EXPIRED" ? "expired" : "invalid",
        message: msg,
      },
      { status: 400 },
    );
  }

  const { payload } = verify;

  const subscriber = await prisma.subscriber.findUnique({
    where: { id: payload.subscriberId },
    select: {
      id: true,
      email: true,
      fullName: true,
      magicLinkNonce: true,
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
      detail: { context: "reset-password" },
    });
    return NextResponse.json(
      {
        ok: false,
        status: "invalid",
        message:
          "This password reset link is no longer valid. Please request a new one.",
      },
      { status: 400 },
    );
  }

  if (
    (subscriber.magicLinkNonce ?? null) !==
    (payload.nonce ?? null)
  ) {
    await recordSecurityAudit({
      kind: "MAGIC_LINK_REUSE_ATTEMPT",
      subscriberId: subscriber.id,
      email: subscriber.email,
      tokenJti: payload.jti,
      magicLinkNonce: payload.nonce ?? undefined,
      ipAddress,
      userAgent,
      detail: {
        context: "reset-password",
        tokenNonce: payload.nonce ?? null,
        currentNonce: subscriber.magicLinkNonce ?? null,
      },
    });
    return NextResponse.json(
      {
        ok: false,
        status: "reused",
        message:
          "This password reset link has already been used. To protect your account, each link works only once — please request a new one.",
      },
      { status: 400 },
    );
  }

  const strength = validatePasswordStrength(password);
  if (!strength.valid) {
    return NextResponse.json(
      {
        ok: false,
        status: "invalid_password",
        field: "password",
        message: strength.error ?? "Invalid password.",
      },
      { status: 400 },
    );
  }

  let passwordHash: string;
  try {
    passwordHash = await hashPassword(password);
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        status: "invalid_password",
        field: "password",
        message:
          err instanceof Error && err.message
            ? err.message
            : "Invalid password.",
      },
      { status: 400 },
    );
  }

  const newNonce = createNonce();
  const now = new Date();

  await Promise.all([
    prisma.subscriber.update({
      where: { id: subscriber.id },
      data: {
        passwordHash,
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
      redirectTarget: "/auth?mode=login",
      detail: { context: "reset-password" },
    }),
    recordSecurityAudit({
      kind: "PASSWORD_SET_RESET",
      subscriberId: subscriber.id,
      email: subscriber.email,
      ipAddress,
      userAgent,
      detail: { viaTokenJti: payload.jti, context: "forgot-link" },
    }),
  ]);

  try {
    await sendPasswordSetResetAuditEmail({
      toEmail: subscriber.email,
      subscriberFullName: subscriber.fullName || null,
      subscriberId: subscriber.id,
      ipAddress,
      whenLabel: now,
    });
  } catch (err) {
    console.error(
      "[api/auth/reset-password] sendPasswordSetResetAuditEmail failed:",
      err,
    );
  }

  return NextResponse.json({
    ok: true,
    status: "ok",
    redirect: "/auth?mode=login",
    message:
      "Your password has been set. You can now log in with your new password.",
  });
}
