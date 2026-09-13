import { NextResponse } from "next/server";
import { z } from "zod";
import { createCheckoutSession } from "@/lib/stripe";
import { getSubscriberSession } from "@/lib/subscriber-session";
import { coerceInterval } from "@/lib/visitor-currency";
import { TOS_VERSION_CURRENT, PRIVACY_VERSION_CURRENT } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { pricingPlanFor } from "@/lib/pricing";
import { checkRateLimit, formatRetrySeconds } from "@/lib/rate-limit";
import { extractIpFromRequest } from "@/lib/security-audit";
import { parseJsonBody } from "@/lib/zod-parse";

const bodySchema = z.object({
  tos_version: z.string().min(1).optional(),
  privacy_version: z.string().min(1).optional(),
  terms_checked: z.boolean().optional(),
  caregiver_ack: z.boolean().optional(),
  billing_interval: z.unknown().optional(),
  offer_code: z.string().optional(),
});

function deriveClientMetadata(request: Request): { ipAddress: string | null; userAgent: string | null } {
  const headers = request.headers;
  const forwardedFor = headers.get("x-forwarded-for");
  const ipAddress =
    (forwardedFor ? forwardedFor.split(",")[0]?.trim() : null) ??
    headers.get("x-real-ip") ??
    null;
  const userAgent = headers.get("user-agent");
  return { ipAddress, userAgent };
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ subscriberId: string }> },
) {
  const { subscriberId: sessionSubscriberId, sessionExpired } = await getSubscriberSession();
  if (sessionExpired) {
    return NextResponse.json(
      { ok: false, message: "Your session expired. Please log in again." },
      { status: 401 },
    );
  }

  const ip = extractIpFromRequest(request) ?? "unknown";
  if (sessionSubscriberId) {
    const subRl = checkRateLimit(`subscribe:checkout:sub:${sessionSubscriberId}`, 15 * 60 * 1000, 10);
    if (!subRl.allowed) {
      return NextResponse.json(
        { ok: false, message: `Too many subscribe checkout attempts. Please try again in ${formatRetrySeconds(subRl.retryAfterMs)}.` },
        { status: 429 },
      );
    }
  }
  const ipRl = checkRateLimit(`subscribe:checkout:ip:${ip}`, 15 * 60 * 1000, 20);
  if (!ipRl.allowed) {
    return NextResponse.json(
      { ok: false, message: `Too many subscribe checkout attempts from this location. Please try again in ${formatRetrySeconds(ipRl.retryAfterMs)}.` },
      { status: 429 },
    );
  }

  const { subscriberId } = await params;

  if (!sessionSubscriberId || sessionSubscriberId !== subscriberId) {
    return NextResponse.json(
      {
        ok: false,
        message: "You are not authorized to start checkout for this subscriber.",
      },
      { status: 403 },
    );
  }

  const parsedBody = await parseJsonBody(request, bodySchema);
  if (!parsedBody.ok) return parsedBody.response;
  const body = parsedBody.data;

  if (!body.terms_checked) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "You must check the Terms of Service and Privacy Policy acknowledgement before proceeding to checkout.",
      },
      { status: 400 },
    );
  }

  const billingInterval = coerceInterval(body.billing_interval);

  const tosVersion = body.tos_version ?? TOS_VERSION_CURRENT;
  const privacyVersion = body.privacy_version ?? PRIVACY_VERSION_CURRENT;
  const md = deriveClientMetadata(request);

  let checkoutOk = false;
  let winbackOffer = false;
  try {
    const subscriber = await prisma?.subscriber.findUnique({
      where: { id: subscriberId },
      select: {
        billingCurrency: true,
        subscriptionStatus: true,
        stripeSubscriptionId: true,
        currentPeriodEndsAt: true,
        winbackEmailSentAt: true,
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
      winbackOffer = Boolean(body.offer_code === "winback25" && subscriber?.winbackEmailSentAt);
      if (!winbackOffer) {
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
    }

    const currency = subscriber?.billingCurrency ?? "USD";
    const plan = pricingPlanFor(currency);
    const priceAmount =
      billingInterval === "annual" ? plan.annual.amount : plan.monthly.amount;

    await prisma?.subscriber.update({
      where: { id: subscriberId },
      data: {
        tosVersion,
        privacyPolicyVersion: privacyVersion,
        tosAcceptedAt: new Date(),
      },
    });

    const auditEvents = [
      { event: "TERMS_ACCEPTED" as const },
      { event: "PRIVACY_ACKNOWLEDGED" as const },
      { event: "SUBSCRIPTION_PURCHASE" as const },
    ];
    await prisma?.legalConsentAudit.createMany({
      data: auditEvents.map((e) => ({
        subscriberId,
        ipAddress: md.ipAddress ?? undefined,
        userAgent: md.userAgent ?? undefined,
        termsVersion: tosVersion,
        privacyVersion,
        event: e.event,
        subscriptionPlan: currency,
        billingInterval,
        priceAmount,
        currency,
        seniorPhoneNumber: null,
        phoneE164: null,
        stripeSessionId: null,
        stripeSubscriptionId: null,
        createdAt: new Date(),
      })),
    });
  } catch (auditErr) {
    console.warn(
      `[subscribe] failed to persist consent audits for subscriber ${subscriberId}:`,
      auditErr instanceof Error ? auditErr.message : auditErr,
    );
  }

  checkoutOk = true;
  const result = await createCheckoutSession({
    subscriberId,
    billingInterval,
    winbackOffer,
    metadata: {
      tos_version: tosVersion,
      privacy_version: privacyVersion,
      caregiver_ack: body.terms_checked ? "1" : "0",
      terms_acknowledged_at: new Date().toISOString(),
      checkout_ip: md.ipAddress ?? "",
      checkout_user_agent: md.userAgent ?? "",
    },
  });

  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json(result);
}

