export type BillingCurrency = "USD" | "CAD";
export type BillingInterval = "monthly" | "annual";

export type PricingPlanVariant = {
  amount: number;
  priceIdEnv: string;
  displayLabel: string;
  ctaLabel: string;
  buttonLabel: string;
  microCopy: string;
};

export type PricingPlan = {
  currency: BillingCurrency;
  currencySymbol: string;
  countryHint: string;
  monthly: PricingPlanVariant;
  annual: PricingPlanVariant & {
    equivalentMonthly: number;
    dailyAmount: number;
    totalPerYear: number;
    savingsPercent: number;
    annualBadge: string;
    billedAnnuallyLabel: string;
  };
  marketing: {
    peaceOfMindAnnual: string;
    billingFrequencyLabel: string;
    featureBulletStandardSenior: string;
    featureBulletContacts: string;
    featureBulletPeaceOfMind: string;
    featureBulletSavings: string;
    peaceOfMind: string;
    dailyCard: string;
    yearlyCard: string;
    monthlyCard: string;
  };
  monthlyLabel: string;
  dailyLabel: string;
  yearlyLabel: string;
  monthlyAmount: number;
  dailyAmount: number;
  yearlyAmount: number;
  annualBadge: string;
};

const USD: PricingPlan = {
  currency: "USD",
  currencySymbol: "$",
  countryHint: "US",
  monthly: {
    amount: 14.99,
    priceIdEnv: "STRIPE_PRICE_ID_USD_MONTHLY",
    displayLabel: "USD $14.99 per month",
    ctaLabel: "Start Monthly Plan — $14.99/mo",
    buttonLabel: "Start Monthly Plan",
    microCopy: "Flexible billing. Switch to annual anytime.",
  },
  annual: {
    amount: 144,
    equivalentMonthly: 11.99,
    dailyAmount: 0.39,
    totalPerYear: 144,
    savingsPercent: 20,
    priceIdEnv: "STRIPE_PRICE_ID_USD_ANNUAL",
    displayLabel: "USD $144.00 per year (approx. $11.99/month)",
    ctaLabel: "Start Annual Plan — $144/yr",
    buttonLabel: "Start Annual Plan",
    microCopy: "Works out to ~$0.39 USD/day. 30-day money-back guarantee.",
    annualBadge: "SAVE ~20% · UNDER $0.50/DAY",
    billedAnnuallyLabel: "Billed annually at $144 USD/yr",
  },
  marketing: {
    peaceOfMindAnnual:
      "Peace of mind for less than $0.50 a day — eliminate the daily \"what-if\" anxiety and know within hours, not days, if something is wrong.",
    billingFrequencyLabel: "After trial ends",
    featureBulletStandardSenior: "1 senior + 2 emergency contacts",
    featureBulletContacts: "Daily automated SMS + escalation chain",
    featureBulletPeaceOfMind: "Less than $0.50/day for complete daily peace of mind",
    featureBulletSavings: "Save ~20% compared to monthly billing",
    peaceOfMind:
      "Peace of mind for less than $0.50 a day — eliminate the daily \"what-if\" anxiety and know within hours, not days, if something is wrong.",
    dailyCard:
      "<strong>$0.39 USD</strong> / day &middot; billed $144 USD/yr (save ~20% vs monthly)",
    yearlyCard:
      "Yearly equivalent: $144 USD — one flat annual commitment, no extra fees, cancel or pause anytime.",
    monthlyCard:
      "Monthly: $14.99 USD. Flexible billing. Switch to annual anytime to save.",
  },
  monthlyLabel: "$14.99 USD per month",
  dailyLabel: "$0.39 USD per day",
  yearlyLabel: "$144.00 USD per year",
  monthlyAmount: 14.99,
  dailyAmount: 0.39,
  yearlyAmount: 144,
  annualBadge: "SAVE ~20% · UNDER $0.50/DAY",
};

const CAD: PricingPlan = {
  currency: "CAD",
  currencySymbol: "$",
  countryHint: "CA",
  monthly: {
    amount: 19.99,
    priceIdEnv: "STRIPE_PRICE_ID_CAD_MONTHLY",
    displayLabel: "CAD $19.99 per month",
    ctaLabel: "Start Monthly Plan — $19.99/mo",
    buttonLabel: "Start Monthly Plan",
    microCopy: "Flexible billing. Switch to annual anytime.",
  },
  annual: {
    amount: 180,
    equivalentMonthly: 14.99,
    dailyAmount: 0.49,
    totalPerYear: 180,
    savingsPercent: 20,
    priceIdEnv: "STRIPE_PRICE_ID_CAD_ANNUAL",
    displayLabel: "CAD $180.00 per year (approx. $14.99/month)",
    ctaLabel: "Start Annual Plan — $180/yr",
    buttonLabel: "Start Annual Plan",
    microCopy: "Works out to ~$0.49 CAD/day. 30-day money-back guarantee.",
    annualBadge: "SAVE ~20% · UNDER $0.50/DAY",
    billedAnnuallyLabel: "Billed annually at $180 CAD/yr",
  },
  marketing: {
    peaceOfMindAnnual:
      "Peace of mind for less than $0.50 a day — eliminate the daily \"what-if\" anxiety and know within hours, not days, if something is wrong.",
    billingFrequencyLabel: "After trial ends",
    featureBulletStandardSenior: "1 senior + 2 emergency contacts",
    featureBulletContacts: "Daily automated SMS + escalation chain",
    featureBulletPeaceOfMind: "Less than $0.50/day for complete daily peace of mind",
    featureBulletSavings: "Save ~20% compared to monthly billing",
    peaceOfMind:
      "Peace of mind for less than $0.50 a day — eliminate the daily \"what-if\" anxiety and know within hours, not days, if something is wrong.",
    dailyCard:
      "<strong>$0.49 CAD</strong> / day &middot; billed $180 CAD/yr (save ~20% vs monthly)",
    yearlyCard:
      "Yearly equivalent: $180 CAD — one flat annual commitment, no extra fees, cancel or pause anytime.",
    monthlyCard:
      "Monthly: $19.99 CAD. Flexible billing. Switch to annual anytime to save.",
  },
  monthlyLabel: "$19.99 CAD per month",
  dailyLabel: "$0.49 CAD per day",
  yearlyLabel: "$180.00 CAD per year",
  monthlyAmount: 19.99,
  dailyAmount: 0.49,
  yearlyAmount: 180,
  annualBadge: "SAVE ~20% · UNDER $0.50/DAY",
};

export const PRICING_PLANS: Record<BillingCurrency, PricingPlan> = { USD, CAD };
export const DEFAULT_CURRENCY: BillingCurrency = "USD";
export const DEFAULT_INTERVAL: BillingInterval = "annual";

export const CURRENCY_COOKIE_NAME = "wh_billing_currency";
export const CURRENCY_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export const CURRENCY_SWITCH_OPTIONS: Array<{
  value: BillingCurrency;
  label: string;
  flag: string;
}> = [
  { value: "USD", label: "USD · United States", flag: "🇺🇸" },
  { value: "CAD", label: "CAD · Canada", flag: "🇨🇦" },
];

export const INTERVAL_SWITCH_OPTIONS: Array<{
  value: BillingInterval;
  label: string;
}> = [
  { value: "monthly", label: "Monthly" },
  { value: "annual", label: "Yearly" },
];

export function isBillingCurrency(value: unknown): value is BillingCurrency {
  return value === "USD" || value === "CAD";
}

export function isBillingInterval(value: unknown): value is BillingInterval {
  return value === "monthly" || value === "annual";
}

export function pricingPlanFor(currency: BillingCurrency): PricingPlan {
  return PRICING_PLANS[currency];
}

export function variantFor(
  currency: BillingCurrency,
  interval: BillingInterval,
): PricingPlanVariant {
  const plan = pricingPlanFor(currency);
  return interval === "annual" ? plan.annual : plan.monthly;
}

export function expectedLabelFor(
  currency: BillingCurrency,
  interval: BillingInterval = DEFAULT_INTERVAL,
) {
  return variantFor(currency, interval).displayLabel;
}

export function expectedMonthlyLabelFor(currency: BillingCurrency) {
  return expectedLabelFor(currency, "monthly");
}

export function savingsPercentFor(currency: BillingCurrency): number {
  return pricingPlanFor(currency).annual.savingsPercent;
}
