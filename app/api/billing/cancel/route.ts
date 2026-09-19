import { NextResponse } from "next/server";
import { z } from "zod";
import { cancelSubscriptionAtPeriodEnd } from "@/lib/stripe";
import { getSubscriberSession } from "@/lib/subscriber-session";
import { prisma } from "@/lib/prisma";
import { sendSubscriptionCancelledAtPeriodEndEmail } from "@/lib/trial-emails";
import { checkRateLimit, formatRetrySeconds } from "@/lib/rate-limit";
import { extractIpFromRequest } from "@/lib/security-audit";
import { parseJsonBody } from "@/lib/zod-parse";

const bodySchema = z.object({
  subscriberId: z.string().min(1),
});

export async function POST(request: Request) {
  const { subscriberId } = await getSubscriberSession();
  if (!subscriberId) {
    return NextResponse.json(
      { ok: false, message: "You must be signed in to cancel your subscription." },
      { status: 401 },
    );
  }

  const ip = extractIpFromRequest(request) ?? "unknown";
  const subRl = checkRateLimit(`billing:cancel:sub:${subscriberId}`, 15 * 60 * 1000, 10);
  if (!subRl.allowed) {
    return NextResponse.json(
      { ok: false, message: `Too many cancellation attempts. Please try again in ${formatRetrySeconds(subRl.retryAfterMs)}.` },
      { status: 429 },
    );
  }
  const ipRl = checkRateLimit(`billing:cancel:ip:${ip}`, 15 * 60 * 1000, 20);
  if (!ipRl.allowed) {
    return NextResponse.json(
      { ok: false, message: `Too many cancellation attempts from this location. Please try again in ${formatRetrySeconds(ipRl.retryAfterMs)}.` },
      { status: 429 },
    );
  }

  const parsed = await parseJsonBody(request, bodySchema);
  if (!parsed.ok) return parsed.response;

  if (parsed.data.subscriberId !== subscriberId) {
    return NextResponse.json(
      { ok: false, message: "You can only cancel your own subscription." },
      { status: 403 },
    );
  }

  const result = await cancelSubscriptionAtPeriodEnd({ subscriberId });
  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }

  try {
    if (prisma) {
      const subscriber = await prisma.subscriber.findUnique({
        where: { id: subscriberId },
        select: {
          id: true,
          email: true,
          fullName: true,
          currentPeriodEndsAt: true,
        },
      });
      if (subscriber) {
        const now = new Date();
        const cancellationDate = subscriber.currentPeriodEndsAt ?? undefined;
        await prisma.subscriber
          .update({
            where: { id: subscriber.id },
            data: {
              cancellationStatus: "PENDING_AT_PERIOD_END",
              cancellationRequestedAt: now,
              cancellationDate,
            },
          })
          .catch((err) => {
            console.error("[billing/cancel] Failed to update subscriber cancellation status:", err);
            return null;
          });
        await sendSubscriptionCancelledAtPeriodEndEmail(subscriber.id).catch((err) => {
          console.error("[billing/cancel] Failed to send cancellation email:", err);
          return null;
        });
      }
    }
  } catch (err) {
    console.warn("[billing/cancel] Unexpected error while recording cancellation follow-up:", err);
  }

  return NextResponse.json({
    ok: true,
    message:
      result.message ??
      "Auto-renewal is now OFF. Your subscription remains active until the end of your current billing period, and no future renewal charges will be made.",
  });
}
