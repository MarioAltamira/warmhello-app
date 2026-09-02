import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { parseJsonBody } from "@/lib/zod-parse";
import {
  extractIpFromRequest,
  extractUserAgentFromRequest,
  recordSecurityAudit,
} from "@/lib/security-audit";
import { getSubscriberSession } from "@/lib/subscriber-session";
import {
  validatePasswordStrength,
  hashPassword,
  verifyPassword,
} from "@/lib/password";
import { sendPasswordChangedAuditEmail } from "@/lib/trial-emails";

const setPasswordBody = z
  .object({
    currentPassword: z.string().max(128).optional(),
    newPassword: z.string().min(1).max(128),
    confirmPassword: z.string().min(1).max(128),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords do not match.",
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

  const { subscriberId, sessionExpired } = await getSubscriberSession();
  if (!subscriberId) {
    return NextResponse.json(
      {
        ok: false,
        message: sessionExpired
          ? "Your session expired. Please log in again to change your password."
          : "You must be logged in to change your password.",
      },
      { status: 401 },
    );
  }

  const parsed = await parseJsonBody(request, setPasswordBody);
  if (!parsed.ok) return parsed.response;

  const ipAddress = extractIpFromRequest(request);
  const userAgent = extractUserAgentFromRequest(request);
  const { newPassword, currentPassword } = parsed.data;

  const subscriber = await prisma.subscriber.findUnique({
    where: { id: subscriberId },
    select: {
      id: true,
      email: true,
      fullName: true,
      passwordHash: true,
    },
  });

  if (!subscriber) {
    return NextResponse.json(
      {
        ok: false,
        message: "Subscriber account not found.",
      },
      { status: 404 },
    );
  }

  const strength = validatePasswordStrength(newPassword);
  if (!strength.valid) {
    return NextResponse.json(
      {
        ok: false,
        field: "newPassword",
        message: strength.error ?? "Invalid new password.",
      },
      { status: 400 },
    );
  }

  const hasExistingPassword = Boolean(subscriber.passwordHash);
  if (hasExistingPassword) {
    if (!currentPassword || typeof currentPassword !== "string") {
      return NextResponse.json(
        {
          ok: false,
          field: "currentPassword",
          message: "Enter your current password before saving a new one.",
        },
        { status: 400 },
      );
    }
    const currentMatches = await verifyPassword(
      currentPassword,
      subscriber.passwordHash,
    );
    if (!currentMatches) {
      await recordSecurityAudit({
        kind: "PASSWORD_CHANGED_FAILED_WRONG_CURRENT",
        subscriberId: subscriber.id,
        email: subscriber.email,
        ipAddress,
        userAgent,
      });
      return NextResponse.json(
        {
          ok: false,
          field: "currentPassword",
          message: "Current password is incorrect.",
        },
        { status: 403 },
      );
    }
    if (currentPassword === newPassword) {
      return NextResponse.json(
        {
          ok: false,
          field: "newPassword",
          message:
            "Your new password must be different from your current password.",
        },
        { status: 400 },
      );
    }
  }

  let passwordHash: string;
  try {
    passwordHash = await hashPassword(newPassword);
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        field: "newPassword",
        message:
          err instanceof Error && err.message
            ? err.message
            : "Invalid new password.",
      },
      { status: 400 },
    );
  }

  const now = new Date();
  await Promise.all([
    prisma.subscriber.update({
      where: { id: subscriber.id },
      data: { passwordHash },
      select: { id: true },
    }),
    recordSecurityAudit({
      kind: hasExistingPassword ? "PASSWORD_CHANGED" : "PASSWORD_SET_RESET",
      subscriberId: subscriber.id,
      email: subscriber.email,
      ipAddress,
      userAgent,
      detail: {
        source: "dashboard-settings",
        hadPriorHash: hasExistingPassword,
      },
    }),
  ]);

  try {
    await sendPasswordChangedAuditEmail({
      toEmail: subscriber.email,
      subscriberFullName: subscriber.fullName || null,
      subscriberId: subscriber.id,
      ipAddress,
      whenLabel: now,
    });
  } catch (err) {
    console.error(
      "[api/auth/change-password] sendPasswordChangedAuditEmail failed:",
      err,
    );
  }

  return NextResponse.json({
    ok: true,
    message: hasExistingPassword
      ? "Your password has been changed. Use the new password the next time you log in."
      : "Your first password has been set. You can now log in with it on future visits.",
  });
}
