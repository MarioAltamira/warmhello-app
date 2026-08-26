import { cookies } from "next/headers";
import {
  BillingCurrency,
  BillingInterval,
  CURRENCY_COOKIE_NAME,
  DEFAULT_CURRENCY,
  DEFAULT_INTERVAL,
  isBillingCurrency,
  isBillingInterval,
  PRICING_PLANS,
  variantFor,
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

export function getStripePriceIdFor(
  currency: BillingCurrency,
  interval: BillingInterval = DEFAULT_INTERVAL,
): string | null {
  const variant = variantFor(currency, interval);
  const value = process.env[variant.priceIdEnv];
  if (value && value.trim().length > 0) return value.trim();

  const fallbackEnv =
    interval === "annual"
      ? currency === "USD"
        ? "STRIPE_PRICE_ID_USD_ANNUAL"
        : "STRIPE_PRICE_ID_CAD_ANNUAL"
      : currency === "USD"
        ? "STRIPE_PRICE_ID_USD_MONTHLY"
        : "STRIPE_PRICE_ID_CAD_MONTHLY";
  const fallbackValue = process.env[fallbackEnv];
  if (fallbackValue && fallbackValue.trim().length > 0) return fallbackValue.trim();

  if (process.env.STRIPE_PRICE_ID?.trim()) {
    return process.env.STRIPE_PRICE_ID.trim();
  }
  return null;
}

export function isValidIntervalCombo(
  currency: BillingCurrency,
  interval: BillingInterval,
): boolean {
  return Boolean(getStripePriceIdFor(currency, interval));
}

export function coerceInterval(
  raw: unknown,
  fallback: BillingInterval = DEFAULT_INTERVAL,
): BillingInterval {
  if (isBillingInterval(raw)) return raw;
  return fallback;
}
