import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isBillingCurrency, pricingPlanFor } from "@/lib/pricing";
import { getSubscriberSession } from "@/lib/subscriber-session";
import { getSubscriberPlanSummary } from "@/lib/subscriber-plan";
import { protectAuthHref } from "@/lib/routes";
import { resolveCurrencyForCurrentVisitor } from "@/lib/visitor-currency";

export async function GET() {
  const session = await getSubscriberSession();

  if (!session.subscriberId) {
    const visitorCurrency = await resolveCurrencyForCurrentVisitor();
    const planCopy = pricingPlanFor(visitorCurrency.currency);
    return NextResponse.json({
      ok: true,
      loggedIn: false,
      loginHref: protectAuthHref,
      visitorCurrency: visitorCurrency.currency,
      billingPlanLabel: planCopy.monthlyLabel,
    });
  }

  if (!prisma) {
    return NextResponse.json({
      ok: false,
      loggedIn: true,
      subscriberId: session.subscriberId,
      message: "Database is not configured yet.",
    });
  }

  const subscriber = await prisma.subscriber.findUnique({
    where: { id: session.subscriberId },
    select: {
      id: true,
      subscriptionStatus: true,
      billingCurrency: true,
      created: true,
      currentPeriodEndsAt: true,
    },
  });

  if (!subscriber) {
    return NextResponse.json({
      ok: false,
      loggedIn: true,
      subscriberId: session.subscriberId,
      message: "Subscriber not found.",
      loginHref: protectAuthHref,
    });
  }

  const visitorCurrency = await resolveCurrencyForCurrentVisitor({
    subscriberId: subscriber.id,
  });
  const billingCurrency = isBillingCurrency(subscriber.billingCurrency)
    ? subscriber.billingCurrency
    : visitorCurrency.currency;
  const planCopy = pricingPlanFor(billingCurrency);

  const plan = getSubscriberPlanSummary({
    created: subscriber.created,
    subscriptionStatus: subscriber.subscriptionStatus as
      | "TRIAL"
      | "ACTIVE"
      | "PAST_DUE"
      | "CANCELED",
    currentPeriodEndsAt: subscriber.currentPeriodEndsAt,
  });

  return NextResponse.json({
    ok: true,
    loggedIn: true,
    subscriberId: subscriber.id,
    billingCurrency,
    billingPlanLabel: planCopy.monthlyLabel,
    buyNowIntent: plan.buyNowIntent,
    timeRemainingLabel: plan.timeRemainingLabel,
    allowNavigation: true,
    subscribeHref: `/subscribe/${encodeURIComponent(subscriber.id)}`,
  });
}
