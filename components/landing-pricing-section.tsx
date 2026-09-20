"use client";

import { useMemo, useState } from "react";
import CurrencyToggle from "@/components/currency-toggle";
import { IntervalToggle } from "@/components/interval-toggle";
import { SmartBuyNowButton } from "@/components/smart-buy-now-button";
import {
  BillingCurrency,
  BillingInterval,
  DEFAULT_INTERVAL,
  pricingPlanFor,
  isBillingCurrency,
} from "@/lib/pricing";

type Props = {
  initialCurrency: BillingCurrency;
};

const FREE_TRIAL_LINE = "7-day free trial. No automatic conversion to a paid subscription.";
const AUTO_RENEW_LINE =
  "Paid subscriptions automatically renew unless cancelled before the next renewal date.";

export function LandingPricingSection({ initialCurrency }: Props) {
  const [currency, setCurrency] = useState<BillingCurrency>(initialCurrency);
  const [billingInterval, setBillingInterval] =
    useState<BillingInterval>(DEFAULT_INTERVAL);

  const plan = useMemo(() => pricingPlanFor(currency), [currency]);

  const handleCurrencyChange = (next: BillingCurrency) => {
    if (!isBillingCurrency(next)) return;
    setCurrency(next);
  };

  const usd = pricingPlanFor("USD");
  const cad = pricingPlanFor("CAD");

  function renderCountryRow(
    countryFlag: string,
    countryName: string,
    countryNote: string,
    pricing: typeof usd,
    isLast = false,
  ) {
    const monthlyCellClass = "landing-pricing-cell landing-pricing-amount";
    const annualCellClass =
      "landing-pricing-cell landing-pricing-amount landing-pricing-amount-highlight";
    return (
      <div role="row" className="landing-pricing-row" key={countryName}>
        <div role="cell" className="landing-pricing-cell">
          <div className="landing-pricing-country">
            <span className="landing-pricing-country-flag" aria-hidden>
              {countryFlag}
            </span>
            <div>
              <div className="landing-pricing-country-title">{countryName}</div>
              <div className="landing-pricing-country-note">{countryNote}</div>
            </div>
          </div>
        </div>
        <div role="cell" className={monthlyCellClass}>
          <div className="landing-pricing-amount-value">
            {pricing.currencySymbol}
            {pricing.monthly.amount.toFixed(2)}
          </div>
          <div className="landing-pricing-amount-label">
            {pricing.currency} / month
          </div>
        </div>
        <div role="cell" className={annualCellClass}>
          <div className="landing-pricing-amount-value">
            {pricing.currencySymbol}
            {pricing.annual.totalPerYear.toFixed(0)}
          </div>
          <div className="landing-pricing-amount-label">
            {pricing.currency} / year · {pricing.currencySymbol}
            {pricing.annual.equivalentMonthly.toFixed(2)}/mo equiv
          </div>
        </div>
        {isLast ? null : null}
      </div>
    );
  }

  return (
    <div className="pricing-dual-section" style={{ maxWidth: 780, margin: "0 auto" }}>
      <div className="landing-pricing-toolbar">
        <h2>Select your Plan.</h2>
        <div className="landing-pricing-toolbar-actions">
          <IntervalToggle value={billingInterval} onChange={setBillingInterval} />
          <span className="landing-pricing-toolbar-divider" aria-hidden />
          <CurrencyToggle
            initial={currency}
            compact
            onChanged={handleCurrencyChange}
          />
        </div>
      </div>

      <div
        role="table"
        aria-label="Warm-Hello pricing by country and billing interval"
        className="landing-pricing-table"
      >
        <div role="rowgroup">
          <div role="row" className="landing-pricing-row">
            <div
              role="columnheader"
              className="landing-pricing-cell landing-pricing-head"
            >
              Country
            </div>
            <div
              role="columnheader"
              className="landing-pricing-cell landing-pricing-head"
              style={{ textAlign: "center" }}
            >
              Monthly
            </div>
            <div
              role="columnheader"
              className="landing-pricing-cell landing-pricing-head landing-pricing-head-annual"
              style={{ textAlign: "center" }}
            >
              Annual
              <div className="landing-pricing-head-badge">
                RECOMMENDED · SAVE ~20%
              </div>
            </div>
          </div>
        </div>

        <div role="rowgroup">
          {renderCountryRow("🇺🇸", "United States", "USD billing", usd, false)}
          {renderCountryRow("🇨🇦", "Canada", "CAD billing", cad, true)}
        </div>
      </div>

      <div className="landing-pricing-free-trial">
        <p>{FREE_TRIAL_LINE}</p>
        <p>{AUTO_RENEW_LINE}</p>
      </div>

      <div className="landing-pricing-selection">
        <div className="landing-pricing-selection-head">
          <div>
            <div className="landing-pricing-selection-kicker">
              Your current selection
            </div>
            <div className="landing-pricing-selection-title">
              {currency === "USD" ? "🇺🇸 United States" : "🇨🇦 Canada"} ·{" "}
              {billingInterval === "annual" ? "Annual" : "Monthly"}
            </div>
            <div className="landing-pricing-selection-note">
              {billingInterval === "annual"
                ? `${plan.currencySymbol}${plan.annual.totalPerYear.toFixed(0)} ${currency}/year · approx. ${plan.currencySymbol}${plan.annual.equivalentMonthly.toFixed(2)}/month`
                : `${plan.currencySymbol}${plan.monthly.amount.toFixed(2)} ${currency}/month`}
            </div>
          </div>
          <div className="landing-pricing-selection-cta">
            <SmartBuyNowButton
              className="button primary pricing-cta"
              label={
                billingInterval === "annual"
                  ? plan.annual.ctaLabel
                  : plan.monthly.ctaLabel
              }
            />
          </div>
        </div>

        <ul className="landing-pricing-features">
          <li>{plan.marketing.featureBulletContacts}</li>
          <li>{plan.marketing.featureBulletStandardSenior}</li>
          <li>{plan.marketing.featureBulletPeaceOfMind}</li>
          <li>{plan.marketing.featureBulletSavings}</li>
        </ul>
      </div>

      <p className="landing-pricing-peace">
        {plan.marketing.peaceOfMindAnnual}
      </p>
    </div>
  );
}

export default LandingPricingSection;
