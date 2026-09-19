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

const TICK = "✓";
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

  return (
    <div className="pricing-dual-section" style={{ maxWidth: 780, margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 14,
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 28,
          padding: "14px 22px",
          borderRadius: 14,
          background: "var(--surface-elevated)",
          border: "1px solid var(--border)",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: 28,
            lineHeight: 1.15,
            fontWeight: 800,
            letterSpacing: -0.01,
            color: "var(--text)",
          }}
        >
          Select your Plan.
        </h2>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 14,
            alignItems: "center",
            justifyContent: "flex-end",
          }}
        >
          <IntervalToggle value={billingInterval} onChange={setBillingInterval} />
          <div
            style={{
              width: 1,
              height: 28,
              background: "var(--border)",
              margin: "0 6px",
            }}
          />
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
        style={{
          width: "100%",
          borderCollapse: "separate",
          borderSpacing: 0,
          borderRadius: 16,
          overflow: "hidden",
          border: "1px solid var(--border)",
          background: "var(--surface-elevated)",
        }}
      >
        <div role="rowgroup">
          <div role="row" style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr 1fr" }}>
            <div
              role="columnheader"
              style={{
                padding: "16px 18px",
                fontWeight: 800,
                fontSize: 14,
                letterSpacing: 0.2,
                textTransform: "uppercase",
                color: "var(--muted)",
                background: "var(--surface)",
                borderBottom: "1px solid var(--border)",
              }}
            >
              Country
            </div>
            <div
              role="columnheader"
              style={{
                padding: "16px 18px",
                textAlign: "center",
                fontWeight: 800,
                fontSize: 14,
                letterSpacing: 0.2,
                textTransform: "uppercase",
                color: "var(--muted)",
                background: "var(--surface)",
                borderBottom: "1px solid var(--border)",
                borderLeft: "1px solid var(--border)",
              }}
            >
              Monthly
            </div>
            <div
              role="columnheader"
              style={{
                padding: "16px 18px",
                textAlign: "center",
                fontWeight: 800,
                fontSize: 14,
                letterSpacing: 0.2,
                textTransform: "uppercase",
                color: "var(--accent)",
                background: "var(--surface)",
                borderBottom: "1px solid var(--border)",
                borderLeft: "1px solid var(--border)",
              }}
            >
              Annual
              <div
                style={{
                  fontSize: 10,
                  marginTop: 4,
                  fontWeight: 700,
                  letterSpacing: 0.3,
                  color: "var(--accent)",
                }}
              >
                RECOMMENDED · SAVE ~20%
              </div>
            </div>
          </div>
        </div>

        <div role="rowgroup">
          <div role="row" style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr 1fr" }}>
            <div
              role="cell"
              style={{
                padding: "22px 18px",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span style={{ fontSize: 28, lineHeight: 1 }} aria-hidden>
                🇺🇸
              </span>
              <div>
                <div style={{ fontWeight: 800, fontSize: 18 }}>United States</div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>USD billing</div>
              </div>
            </div>
            <div
              role="cell"
              style={{
                padding: "22px 18px",
                textAlign: "center",
                borderBottom: "1px solid var(--border)",
                borderLeft: "1px solid var(--border)",
                borderRight: "1px solid var(--border)",
              }}
            >
              <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.5 }}>
                {usd.currencySymbol}
                {usd.monthly.amount.toFixed(2)}
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
                USD / month
              </div>
            </div>
            <div
              role="cell"
              style={{
                padding: "22px 18px",
                textAlign: "center",
                borderBottom: "1px solid var(--border)",
                background:
                  "color-mix(in oklab, var(--accent) 7%, var(--surface-elevated))",
              }}
            >
              <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.5 }}>
                {usd.currencySymbol}
                {usd.annual.totalPerYear.toFixed(0)}
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
                USD / year · {usd.currencySymbol}
                {usd.annual.equivalentMonthly.toFixed(2)}/mo equiv
              </div>
            </div>
          </div>

          <div role="row" style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr 1fr" }}>
            <div
              role="cell"
              style={{
                padding: "22px 18px",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span style={{ fontSize: 28, lineHeight: 1 }} aria-hidden>
                🇨🇦
              </span>
              <div>
                <div style={{ fontWeight: 800, fontSize: 18 }}>Canada</div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>CAD billing</div>
              </div>
            </div>
            <div
              role="cell"
              style={{
                padding: "22px 18px",
                textAlign: "center",
                borderLeft: "1px solid var(--border)",
                borderRight: "1px solid var(--border)",
              }}
            >
              <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.5 }}>
                {cad.currencySymbol}
                {cad.monthly.amount.toFixed(2)}
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
                CAD / month
              </div>
            </div>
            <div
              role="cell"
              style={{
                padding: "22px 18px",
                textAlign: "center",
                background:
                  "color-mix(in oklab, var(--accent) 7%, var(--surface-elevated))",
              }}
            >
              <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.5 }}>
                {cad.currencySymbol}
                {cad.annual.totalPerYear.toFixed(0)}
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
                CAD / year · {cad.currencySymbol}
                {cad.annual.equivalentMonthly.toFixed(2)}/mo equiv
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: 28,
          padding: "20px 22px",
          borderRadius: 14,
          background: "var(--surface)",
          border: "1px solid var(--border)",
          textAlign: "center",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 15,
            fontWeight: 700,
            color: "var(--text)",
            lineHeight: 1.45,
          }}
        >
          {FREE_TRIAL_LINE}
        </p>
        <p
          style={{
            margin: "10px 0 0",
            fontSize: 14,
            color: "var(--muted)",
            lineHeight: 1.5,
          }}
        >
          {AUTO_RENEW_LINE}
        </p>
      </div>

      <div
        style={{
          marginTop: 28,
          padding: "24px 22px",
          borderRadius: 14,
          background: "var(--surface-elevated)",
          border: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                letterSpacing: 0.4,
                textTransform: "uppercase",
                color: "var(--muted)",
                fontWeight: 700,
                marginBottom: 4,
              }}
            >
              Your current selection
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.2 }}>
              {currency === "USD" ? "🇺🇸 United States" : "🇨🇦 Canada"} ·{" "}
              {billingInterval === "annual" ? "Annual" : "Monthly"}
            </div>
            <div style={{ marginTop: 4, fontSize: 14, color: "var(--muted)" }}>
              {billingInterval === "annual"
                ? `${plan.currencySymbol}${plan.annual.totalPerYear.toFixed(0)} ${currency}/year · approx. ${plan.currencySymbol}${plan.annual.equivalentMonthly.toFixed(2)}/month`
                : `${plan.currencySymbol}${plan.monthly.amount.toFixed(2)} ${currency}/month`}
            </div>
          </div>
          <div style={{ minWidth: 240 }}>
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

        <ul
          className="check-list"
          style={{
            marginTop: 0,
            marginBottom: 0,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "8px 14px",
          }}
        >
          <li>
            <span aria-hidden style={{ marginRight: 8, color: "var(--accent)" }}>
              {TICK}
            </span>
            {plan.marketing.featureBulletContacts}
          </li>
          <li>
            <span aria-hidden style={{ marginRight: 8, color: "var(--accent)" }}>
              {TICK}
            </span>
            {plan.marketing.featureBulletStandardSenior}
          </li>
          <li>
            <span aria-hidden style={{ marginRight: 8, color: "var(--accent)" }}>
              {TICK}
            </span>
            {plan.marketing.featureBulletPeaceOfMind}
          </li>
          <li>
            <span aria-hidden style={{ marginRight: 8, color: "var(--accent)" }}>
              {TICK}
            </span>
            {plan.marketing.featureBulletSavings}
          </li>
        </ul>
      </div>

      <p
        style={{
          marginTop: 24,
          fontSize: 14,
          color: "var(--muted)",
          textAlign: "center",
          marginBottom: 0,
        }}
      >
        {plan.marketing.peaceOfMindAnnual}
      </p>
    </div>
  );
}

export default LandingPricingSection;
