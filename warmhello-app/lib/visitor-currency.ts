import { cookies, headers } from "next/headers";
import {
  BillingCurrency,
  CURRENCY_COOKIE_NAME,
  DEFAULT_CURRENCY,
  isBillingCurrency,
  PRICING_PLANS,
} from "@/lib/pricing";
import { prisma } from "@/lib/prisma";

function currencyFromCountryCode(country: string | null | undefined): BillingCurrency | null {
  if (!country) return null;
  const code = country.trim().toUpperCase();
  if (code === "CA") return "CAD";
  if (code === "US") return "USD";
  return null;
}

export type VisitorCurrencySource =
  | "subscriber_billing_currency"
  | "explicit_visitor_cookie"
  | "cf_ip_country"
  | "accept_language_header"
  | "default";

export type ResolvedCurrency = {
  currency: BillingCurrency;
  source: VisitorCurrencySource;
  fromSubscriber: boolean;
};

export function resolveVisitorCurrencyFromRequest(options?: {
  subscriberBillingCurrency?: BillingCurrency | null;
  explicitCookie?: BillingCurrency | null;
  acceptLanguage?: string | null;
  cfIpCountry?: string | null;
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

  const fromCountry = currencyFromCountryCode(options?.cfIpCountry);
  if (fromCountry) {
    return { currency: fromCountry, source: "cf_ip_country", fromSubscriber: false };
  }

  const acceptLang = options?.acceptLanguage ?? "";
  const normalized = acceptLang.toLowerCase();
  if (normalized.includes("-ca") || normalized.startsWith("ca") || normalized.includes("fr-ca") || normalized.includes("en-ca")) {
    return { currency: "CAD", source: "accept_language_header", fromSubscriber: false };
  }

  if (normalized.includes("-us") || normalized.startsWith("en-us")) {
    return { currency: "USD", source: "accept_language_header", fromSubscriber: false };
  }

  return { currency: DEFAULT_CURRENCY, source: "default", fromSubscriber: false };
}

export async function resolveCurrencyForCurrentVisitor(options?: {
  subscriberId?: string | null;
}): Promise<ResolvedCurrency> {
  const headerStore = await headers();
  const cookieStore = await cookies();

  const cfIpCountry = headerStore.get("cf-ipcountry") ?? headerStore.get("CF-IPCountry") ?? null;
  const acceptLanguage = headerStore.get("accept-language") ?? null;

  const rawCookie = cookieStore.get(CURRENCY_COOKIE_NAME)?.value ?? null;
  const explicitCookie = isBillingCurrency(rawCookie) ? rawCookie : null;

  let subscriberBillingCurrency: BillingCurrency | null = null;
  if (options?.subscriberId && prisma) {
    try {
      const row = await prisma.subscriber.findUnique({
        where: { id: options.subscriberId },
        select: { billingCurrency: true },
      });
      if (row?.billingCurrency && isBillingCurrency(row.billingCurrency)) {
        subscriberBillingCurrency = row.billingCurrency;
      }
    } catch {
      // ignore
    }
  }

  return resolveVisitorCurrencyFromRequest({
    subscriberBillingCurrency,
    explicitCookie,
    acceptLanguage,
    cfIpCountry,
  });
}

export function getStripePriceIdFor(currency: BillingCurrency): string | null {
  const plan = PRICING_PLANS[currency];
  const value = process.env[plan.priceIdEnv];
  if (value && value.trim().length > 0) return value.trim();
  // Legacy fallback: single STRIPE_PRICE_ID if set and matches currency country default (USD)
  if (currency === "USD" && process.env.STRIPE_PRICE_ID?.trim()) {
    return process.env.STRIPE_PRICE_ID.trim();
  }
  return null;
}
