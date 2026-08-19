export type BillingCurrency = "USD" | "CAD";

export type PricingPlan = {
  currency: BillingCurrency;
  monthlyAmount: number;
  yearlyAmount: number;
  dailyAmount: number;
  priceIdEnv: string;
  countryHint: string;
  currencySymbol: string;
  monthlyLabel: string;
  yearlyLabel: string;
  dailyLabel: string;
  marketing: {
    dailyCard: string;
    yearlyCard: string;
    monthlyCard: string;
    peaceOfMind: string;
  };
};

const USD: PricingPlan = {
  currency: "USD",
  monthlyAmount: 5,
  yearlyAmount: 60,
  dailyAmount: 0.16,
  priceIdEnv: "STRIPE_PRICE_ID_USD",
  countryHint: "US",
  currencySymbol: "$",
  monthlyLabel: "USD $5.00 per month",
  yearlyLabel: "USD $60.00 per year",
  dailyLabel: "USD $0.16 per day",
  marketing: {
    dailyCard: `$0.16 <span class="pricing-amount-label">/ day</span>`,
    yearlyCard: "(Billed at $60 annually - $5/month)",
    monthlyCard: `$5 USD <span class="pricing-amount-label">/ month</span>`,
    peaceOfMind:
      "That is just $0.16 a day to eliminate the daily \"what-if\" anxiety and make sure you know within hours, not days, if something is wrong.",
  },
};

const CAD: PricingPlan = {
  currency: "CAD",
  monthlyAmount: 6,
  yearlyAmount: 72,
  dailyAmount: 0.2,
  priceIdEnv: "STRIPE_PRICE_ID_CAD",
  countryHint: "CA",
  currencySymbol: "$",
  monthlyLabel: "CAD $6.00 per month",
  yearlyLabel: "CAD $72.00 per year",
  dailyLabel: "CAD $0.20 per day",
  marketing: {
    dailyCard: `$0.20 <span class="pricing-amount-label">/ day</span>`,
    yearlyCard: "(Billed at $72 annually - $6/month)",
    monthlyCard: `$6 CAD <span class="pricing-amount-label">/ month</span>`,
    peaceOfMind:
      "That is just $0.20 a day to eliminate the daily \"what-if\" anxiety and make sure you know within hours, not days, if something is wrong.",
  },
};

export const PRICING_PLANS: Record<BillingCurrency, PricingPlan> = { USD, CAD };
export const DEFAULT_CURRENCY: BillingCurrency = "USD";

export const CURRENCY_COOKIE_NAME = "wh_billing_currency";
export const CURRENCY_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export const CURRENCY_SWITCH_OPTIONS: Array<{
  value: BillingCurrency;
  label: string;
  flag: string;
}> = [
  { value: "USD", label: "USD · United States", flag: "🇺🇸" },
  { value: "CAD", label: "CAD · Canada", flag: "🇨🇦" },
];

export function isBillingCurrency(value: unknown): value is BillingCurrency {
  return value === "USD" || value === "CAD";
}

export function pricingPlanFor(currency: BillingCurrency): PricingPlan {
  return PRICING_PLANS[currency];
}

export function expectedMonthlyLabelFor(currency: BillingCurrency) {
  return pricingPlanFor(currency).monthlyLabel;
}
