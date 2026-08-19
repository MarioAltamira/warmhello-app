import { cookies } from "next/headers";
import {
  BillingCurrency,
  CURRENCY_COOKIE_NAME,
  DEFAULT_CURRENCY,
  isBillingCurrency,
  PRICING_PLANS,
} from "@/lib/pricing";
import { prisma } from "@/lib/prisma";

export type VisitorCurrencySource =
  | "subscriber_billing_currency"
  | "explicit_visitor_cookie"
  | "default";

export type ResolvedCurrency = {
  currency: BillingCurrency;
  source: VisitorCurrencySource;
  fromSubscriber: boolean;
};

export function resolveVisitorCurrencyFromRequest(options?: {
  subscriberBillingCurrency?: BillingCurrency | null;
  explicitCookie?: BillingCurrency | null;
}): ResolvedCurrency {
  if (options?.subscriberBillingCurrency && isBillingCurrency(options.subscriberBillingCurrency)) {
    return {
      currency: options.subscriberBillingCurrency,
      source: "subscriber_billing_currency",
      fromSubscriber: true,
    };
  }

  if (options?.explicitCookie && isBillingCurrency(options.explicitCookie)) {
    return {
      currency: options.explicitCookie,
      source: "explicit_visitor_cookie",
      fromSubscriber: false,
    };
  }

  return { currency: DEFAULT_CURRENCY, source: "default", fromSubscriber: false };
}

export async function resolveCurrencyForCurrentVisitor(options?: {
  subscriberId?: string | null;
}): Promise<ResolvedCurrency> {
  let subscriberBillingCurrency: BillingCurrency | null = null;
  if (options?.subscriberId && prisma) {
    try {
      const row = await prisma.subscriber.findUnique({
        where: { id: options.subscriberId },
        select: { billingCurrency: true },
      });
      if (row?.billingCurrency && isBillingCurrency(row.billingCurrency)) {
        subscriberBillingCurrency = row.billingCurrency;
        return {
          currency: subscriberBillingCurrency,
          source: "subscriber_billing_currency",
          fromSubscriber: true,
        };
      }
    } catch {
      // ignore
    }
  }

  const cookieStore = await cookies();
  const rawCookie = cookieStore.get(CURRENCY_COOKIE_NAME)?.value ?? null;
  const explicitCookie = isBillingCurrency(rawCookie) ? rawCookie : null;

  return resolveVisitorCurrencyFromRequest({
    subscriberBillingCurrency,
    explicitCookie,
  });
}

export function getStripePriceIdFor(currency: BillingCurrency): string | null {
  const plan = PRICING_PLANS[currency];
  const value = process.env[plan.priceIdEnv];
  if (value && value.trim().length > 0) return value.trim();
  if (currency === "USD" && process.env.STRIPE_PRICE_ID?.trim()) {
    return process.env.STRIPE_PRICE_ID.trim();
  }
  return null;
}
