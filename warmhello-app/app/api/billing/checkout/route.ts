import { NextResponse } from "next/server";
import { z } from "zod";
import { createCheckoutSession } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { getSubscriberSession } from "@/lib/subscriber-session";
import { parseJsonBody } from "@/lib/zod-parse";
import { coerceInterval } from "@/lib/visitor-currency";
import { checkRateLimit, formatRetrySeconds } from "@/lib/rate-limit";
import { extractIpFromRequest } from "@/lib/security-audit";

const bodySchema = z.object({
  customerEmail: z.string().email(),
  subscriberId: z.string().min(1),
  billing_interval: z.unknown().optional(),
});

export async function POST(request: Request) {
  const { subscriberId: sessionSubscriberId, sessionExpired } = await getSubscriberSession();
  if (sessionExpired) {
    return NextResponse.json(
      { ok: false, message: "Your session expired. Please log in again." },
      { status: 401 },
    );
  }

  const ip = extractIpFromRequest(request) ?? "unknown";
  if (sessionSubscriberId) {
    const subRl = checkRateLimit(`billing:checkout:sub:${sessionSubscriberId}`, 15 * 60 * 1000, 10);
    if (!subRl.allowed) {
      return NextResponse.json(
        { ok: false, message: `Too many checkout attempts. Please try again in ${formatRetrySeconds(subRl.retryAfterMs)}.` },
        { status: 429 },
      );
    }
  }
  const ipRl = checkRateLimit(`billing:checkout:ip:${ip}`, 15 * 60 * 1000, 20);
  if (!ipRl.allowed) {
    return NextResponse.json(
      { ok: false, message: `Too many checkout attempts from this location. Please try again in ${formatRetrySeconds(ipRl.retryAfterMs)}.` },
      { status: 429 },
    );
  }

  const parsed = await parseJsonBody(request, bodySchema);
  if (!parsed.ok) return parsed.response;

  if (!sessionSubscriberId || sessionSubscriberId !== parsed.data.subscriberId) {
    return NextResponse.json(
      { ok: false, message: "You are not authorized to create a checkout for this subscriber." },
      { status: 403 },
    );
  }

  const subscriber = await prisma?.subscriber.findUnique({
    where: { id: parsed.data.subscriberId },
    select: {
      subscriptionStatus: true,
      stripeSubscriptionId: true,
      currentPeriodEndsAt: true,
    },
  });

  if (subscriber?.subscriptionStatus === "ACTIVE") {
    return NextResponse.json(
      {
        ok: false,
        alreadySubscribed: true,
        message:
          "You are already subscribed and billing is active. Monthly paid users can upgrade to Annual billing by going to Settings → Subscription → Upgrade to Annual. Other billing changes: contact sales@warm-hello.com.",
      },
      { status: 409 },
    );
  }
  if (
    subscriber?.subscriptionStatus === "CANCELED" &&
    subscriber?.currentPeriodEndsAt &&
    subscriber.currentPeriodEndsAt.getTime() > Date.now() &&
    subscriber.stripeSubscriptionId
  ) {
    return NextResponse.json(
      {
        ok: false,
        alreadySubscribed: true,
        message:
          "Your subscription is still active through the end of the current paid period. No new payment is needed right now.",
      },
      { status: 409 },
    );
  }
  if (subscriber?.subscriptionStatus === "PAST_DUE") {
    return NextResponse.json(
      {
        ok: false,
        alreadySubscribed: true,
        message:
          "Your account currently shows an unpaid invoice. Please contact sales@warm-hello.com to resolve this before starting a new subscription so you are not double-billed.",
      },
      { status: 409 },
    );
  }

  const billingInterval = coerceInterval(parsed.data.billing_interval);

  const result = await createCheckoutSession({
    subscriberId: parsed.data.subscriberId,
    billingInterval,
  });

  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json(result);
}
