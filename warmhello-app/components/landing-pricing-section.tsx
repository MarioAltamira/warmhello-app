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

export function LandingPricingSection({ initialCurrency }: Props) {
  const [currency, setCurrency] = useState<BillingCurrency>(initialCurrency);
  const [interval, setInterval] = useState<BillingInterval>(DEFAULT_INTERVAL);

  const plan = useMemo(() => pricingPlanFor(currency), [currency]);

  const handleCurrencyChange = (next: BillingCurrency) => {
    if (!isBillingCurrency(next)) return;
    setCurrency(next);
  };

  const annualEquiv = plan.annual.equivalentMonthly;
  const annualTotal = plan.annual.totalPerYear;
  const annualDaily = plan.annual.dailyAmount;
  const monthlyAmt = plan.monthly.amount;

  const annualCta = interval === "annual"
    ? plan.annual.ctaLabel
    : plan.annual.buttonLabel;
  const monthlyCta = interval === "monthly"
    ? plan.monthly.ctaLabel
    : plan.monthly.buttonLabel;

  const annualSelected = interval === "annual";
  const monthlySelected = interval === "monthly";

  return (
    <div className="pricing-dual-section">
      <div className="pricing-dual-toggles" style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 14,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 28,
      }}>
        <IntervalToggle value={interval} onChange={setInterval} />
        <div style={{ width: 1, height: 28, background: "var(--border)", margin: "0 6px" }} />
        <CurrencyToggle initial={currency} compact onChanged={handleCurrencyChange} />
      </div>

      <div
        className="pricing-dual-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: 18,
          alignItems: "stretch",
        }}
      >
        {/* Card 2: Annual Peace of Mind — highlighted / pre-selected */}
        <article
          className={`card pricing-card pricing-card-annual ${annualSelected ? "is-selected" : ""}`}
          style={{
            position: "relative",
            textAlign: "left",
            padding: 28,
            border: annualSelected
              ? "2px solid color-mix(in oklab, var(--accent) 60%, transparent)"
              : "2px solid var(--border)",
            background: annualSelected
              ? "linear-gradient(180deg, color-mix(in oklab, var(--accent) 6%, var(--surface)) 0%, var(--surface) 100%)"
              : "var(--surface)",
            order: annualSelected ? -1 : 0,
            boxShadow: annualSelected
              ? "0 20px 50px -20px color-mix(in oklab, var(--accent) 50%, transparent)"
              : "none",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <div>
              <p className="eyebrow" style={{ marginTop: 0, marginBottom: 6 }}>
                Annual Peace of Mind
              </p>
              <h3 style={{ margin: 0 }}>Recommended</h3>
            </div>
            <span
              className="pricing-savings-badge"
              style={{
                display: "inline-block",
                padding: "6px 12px",
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 0.2,
                textTransform: "uppercase",
                background: "var(--accent)",
                color: "var(--accent-contrast)",
                whiteSpace: "nowrap",
              }}
            >
              {plan.annual.annualBadge}
            </span>
          </div>

          <div style={{ marginTop: 20 }}>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 6,
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontSize: 48,
                  fontWeight: 800,
                  lineHeight: 1,
                  letterSpacing: -0.5,
                  color: "var(--text)",
                }}
              >
                {plan.currencySymbol}{annualEquiv.toFixed(2)}
              </span>
              <span style={{ fontSize: 15, fontWeight: 500, color: "var(--muted)" }}>
                / month
              </span>
            </div>
            <p style={{ marginTop: 8, fontSize: 14, color: "var(--muted)", marginBottom: 0 }}>
              {plan.annual.billedAnnuallyLabel}
            </p>
          </div>

          <ul className="check-list" style={{ marginTop: 20 }}>
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

          <div style={{ marginTop: 22 }}>
            <SmartBuyNowButton
              className="button primary pricing-cta"
              label={annualCta}
            />
            <p
              className="pricing-microcopy"
              style={{
                marginTop: 10,
                fontSize: 13,
                color: "var(--muted)",
                textAlign: "center",
                marginBottom: 0,
              }}
            >
              {plan.annual.microCopy}
            </p>
          </div>
        </article>

        {/* Card 1: Monthly Standard */}
        <article
          className={`card pricing-card pricing-card-monthly ${monthlySelected ? "is-selected" : ""}`}
          style={{
            textAlign: "left",
            padding: 28,
            border: monthlySelected
              ? "2px solid var(--accent-muted)"
              : "2px solid var(--border)",
            background: "var(--surface)",
          }}
        >
          <div>
            <p className="eyebrow" style={{ marginTop: 0, marginBottom: 6 }}>
              Monthly Standard
            </p>
            <h3 style={{ margin: 0 }}>Flexible Billing</h3>
          </div>

          <div style={{ marginTop: 20 }}>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 6,
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontSize: 48,
                  fontWeight: 800,
                  lineHeight: 1,
                  letterSpacing: -0.5,
                  color: "var(--text)",
                }}
              >
                {plan.currencySymbol}{monthlyAmt.toFixed(2)}
              </span>
              <span style={{ fontSize: 15, fontWeight: 500, color: "var(--muted)" }}>
                / month
              </span>
            </div>
            <p style={{ marginTop: 8, fontSize: 14, color: "var(--muted)", marginBottom: 0 }}>
              Billed monthly. Cancel anytime.
            </p>
          </div>

          <ul className="check-list" style={{ marginTop: 20 }}>
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
          </ul>

          <div style={{ marginTop: 22 }}>
            <SmartBuyNowButton
              className="button secondary pricing-cta"
              label={monthlyCta}
            />
            <p
              className="pricing-microcopy"
              style={{
                marginTop: 10,
                fontSize: 13,
                color: "var(--muted)",
                textAlign: "center",
                marginBottom: 0,
              }}
            >
              {plan.monthly.microCopy}
            </p>
          </div>
        </article>
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

      <div
        aria-hidden
        style={{
          display: "none",
          marginTop: 16,
          justifyContent: "center",
          fontSize: 12,
          color: "var(--muted)",
          gap: 18,
          flexWrap: "wrap",
        }}
      >
        <span>Annual total: {plan.currencySymbol}{annualTotal.toFixed(2)}</span>
        <span>Daily equiv.: {plan.currencySymbol}{annualDaily.toFixed(2)}</span>
        <span>30-day money-back guarantee</span>
      </div>
    </div>
  );
}

export default LandingPricingSection;
