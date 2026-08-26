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
  const sanitize = (raw: unknown): string | null => {
    if (typeof raw !== "string") return null;
    let v = raw.replace(/^\uFEFF/, "").trim();
    for (let i = 0; i < 4; i += 1) {
      if (v.length >= 2) {
        const first = v[0];
        const last = v[v.length - 1];
        if (
          (first === "`" && last === "`") ||
          (first === '"' && last === '"') ||
          (first === "'" && last === "'")
        ) {
          v = v.slice(1, -1).trim();
          continue;
        }
      }
      break;
    }
    return v.length > 0 ? v : null;
  };

  const variant = variantFor(currency, interval);
  const value = sanitize(process.env[variant.priceIdEnv]);
  if (value) return value;

  const fallbackEnv =
    interval === "annual"
      ? currency === "USD"
        ? "STRIPE_PRICE_ID_USD_ANNUAL"
        : "STRIPE_PRICE_ID_CAD_ANNUAL"
      : currency === "USD"
        ? "STRIPE_PRICE_ID_USD_MONTHLY"
        : "STRIPE_PRICE_ID_CAD_MONTHLY";
  const fallbackValue = sanitize(process.env[fallbackEnv]);
  if (fallbackValue) return fallbackValue;

  const legacy = sanitize(process.env.STRIPE_PRICE_ID);
  if (legacy) return legacy;
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
