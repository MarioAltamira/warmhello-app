import { NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import {
  isBillingCurrency,
  pricingPlanFor,
} from "@/lib/pricing";
import { getStripePriceIdFor } from "@/lib/visitor-currency";
import { getSubscriberSession } from "@/lib/subscriber-session";

const bodySchema = z.object({
  subscriberId: z.string().min(1),
  toInterval: z.literal("annual"),
});

let stripeCache: Stripe | null = null;
function getStripe(): Stripe | null {
  if (!env.STRIPE_SECRET_KEY) return null;
  if (!stripeCache) {
    stripeCache = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-08-27.basil" as any,
    });
  }
  return stripeCache;
}

export async function POST(request: Request) {
  const { subscriberId: sessionSubscriberId } = await getSubscriberSession();
  if (!sessionSubscriberId) {
    return NextResponse.json(
      { ok: false, message: "You must be signed in to upgrade your subscription." },
      { status: 401 },
    );
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: "Invalid request payload." },
      { status: 400 },
    );
  }

  if (parsed.data.subscriberId !== sessionSubscriberId) {
    return NextResponse.json(
      { ok: false, message: "You can only upgrade your own subscription." },
      { status: 403 },
    );
  }

  const subscriber = prisma
    ? await prisma.subscriber
        .findUnique({
          where: { id: sessionSubscriberId },
          select: {
            id: true,
            email: true,
            subscriptionStatus: true,
            billingInterval: true,
            billingCurrency: true,
            stripeCustomerId: true,
            stripeSubscriptionId: true,
            currentPeriodEndsAt: true,
            cancellationStatus: true,
          },
        })
        .catch(() => null)
    : null;

  if (!subscriber) {
    return NextResponse.json(
      { ok: false, message: "Subscriber record not found." },
      { status: 404 },
    );
  }

  if (subscriber.subscriptionStatus !== "ACTIVE") {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Upgrades are only available for active paid subscriptions. Please subscribe first, or if your account has an unpaid balance, reach out to sales@warm-hello.com.",
      },
      { status: 409 },
    );
  }

  const currentIntervalRaw = String(subscriber.billingInterval ?? "").toUpperCase();
  if (currentIntervalRaw !== "MONTHLY") {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Self-serve plan change is only available for monthly-to-annual upgrades. Self-serve downgrades from annual to monthly are not available; contact sales@warm-hello.com for help.",
      },
      { status: 409 },
    );
  }

  if (!subscriber.stripeSubscriptionId || !subscriber.stripeCustomerId) {
    return NextResponse.json(
      {
        ok: false,
        message: "Your subscription record could not be located remotely. Please try again or contact sales@warm-hello.com.",
      },
      { status: 424 },
    );
  }

  if (!subscriber.currentPeriodEndsAt || subscriber.currentPeriodEndsAt.getTime() <= Date.now()) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Your current paid period has ended. Re-subscribe from the dashboard or contact sales@warm-hello.com.",
      },
      { status: 409 },
    );
  }

  const currency = isBillingCurrency(subscriber.billingCurrency)
    ? subscriber.billingCurrency
    : "USD";
  const newAnnualPriceId = getStripePriceIdFor(currency, "annual");
  if (!newAnnualPriceId) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Annual plan pricing is not configured for your selected currency right now. Please try again later or contact sales@warm-hello.com.",
      },
      { status: 500 },
    );
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Our payment provider configuration is missing right now. Please try again in 60 seconds.",
      },
      { status: 500 },
    );
  }
  let subscription: Stripe.Subscription | null = null;
  try {
    subscription = await stripe.subscriptions.retrieve(subscriber.stripeSubscriptionId, {
      expand: ["latest_invoice"],
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        ok: false,
        message:
          "We could not load your subscription details from our payment provider right now. Please try again in 60 seconds.",
        debug: process.env.NODE_ENV === "development" ? msg : undefined,
      },
      { status: 502 },
    );
  }

  const currentItems = subscription.items?.data ?? [];
  if (currentItems.length !== 1) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "This subscription has multiple line items and requires manual review. Please contact sales@warm-hello.com to proceed.",
      },
      { status: 409 },
    );
  }
  const currentItem = currentItems[0];
  if (!currentItem?.id) {
    return NextResponse.json(
      {
        ok: false,
        message: "Subscription line item could not be resolved. Please try again.",
      },
      { status: 424 },
    );
  }

  let updated: Stripe.Subscription;
  try {
    updated = await stripe.subscriptions.update(subscription.id, {
      cancel_at_period_end: false,
      proration_behavior: "always_invoice",
      payment_behavior: "default_incomplete",
      items: [
        {
          id: currentItem.id,
          price: newAnnualPriceId,
          quantity: 1,
        },
      ],
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        ok: false,
        message:
          "Our payment provider could not upgrade your plan right now. Please try again in 60 seconds or contact sales@warm-hello.com.",
        debug: process.env.NODE_ENV === "development" ? msg : undefined,
      },
      { status: 502 },
    );
  }

  const updatedLatestInvoiceId =
    typeof updated.latest_invoice === "string" ? updated.latest_invoice : updated.latest_invoice?.id ?? null;
  let invoice: Stripe.Invoice | null = null;
  let amountDueCents: number = 0;
  let currencyDue: string = currency.toLowerCase();
  let hostedInvoicePayUrl: string | null = null;
  let invoicePdfUrl: string | null = null;

  if (updatedLatestInvoiceId) {
    try {
      invoice = await stripe.invoices.retrieve(updatedLatestInvoiceId);
      amountDueCents = invoice.amount_due ?? 0;
      currencyDue = invoice.currency ?? currency.toLowerCase();
      hostedInvoicePayUrl = invoice.hosted_invoice_url ?? null;
      invoicePdfUrl = invoice.invoice_pdf ?? null;
    } catch {
      invoice = null;
    }
  }

  const updatedRaw = updated as unknown as {
    status?: string;
    current_period_end?: number | null;
  };
  const requiresPayment =
    updatedRaw.status === "incomplete" ||
    updatedRaw.status === "past_due" ||
    amountDueCents > 0;

  const plan = pricingPlanFor(currency);
  const currencySymbol = currency === "USD" ? "$" : "CA$";
  const equivalentMonthly = plan.annual.equivalentMonthly.toFixed(2);
  const totalPerYear = plan.annual.totalPerYear.toFixed(2);

  function toIsoSafe(ts: number | null | undefined): string | null {
    if (!ts) return null;
    const d = new Date(ts * 1000);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString();
  }

  const nextRenewalAtIso = toIsoSafe(updatedRaw.current_period_end ?? null);
  const currentPeriodEndsAtIsoOut = nextRenewalAtIso ?? subscriber.currentPeriodEndsAt?.toISOString() ?? null;

  return NextResponse.json({
    ok: true,
    changed: "pending_payment_for_upgrade",
    subscriptionStatus: updated.status,
    requiresPayment,
    amountDue: {
      currency: currencyDue.toUpperCase() as "USD" | "CAD",
      amountCents: amountDueCents,
      amountDisplay: `${currencySymbol}${(amountDueCents / 100).toFixed(2)}`,
    },
    pricing: {
      perYearDisplay: `${currencySymbol}${totalPerYear}/yr`,
      equivalentMonthlyDisplay: `${currencySymbol}${equivalentMonthly}/mo equiv.`,
      savingsPercent: plan.annual.savingsPercent,
    },
    nextRenewalAtIso,
    currentPeriodEndsAtIso: currentPeriodEndsAtIsoOut,
    invoicePdfUrl: invoicePdfUrl,
    hostedInvoicePayUrl,
    message: requiresPayment
      ? hostedInvoicePayUrl
        ? "Your annual upgrade is ready. Please open the Stripe hosted invoice link below to complete payment and confirm the prorated annual charge."
        : "Your annual upgrade is in progress and payment is being processed. Refresh your billing status in a moment to see the updated plan."
      : "Your annual plan upgrade has been applied.",
  });
}
