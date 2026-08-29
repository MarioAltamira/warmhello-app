"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { legalLinks } from "@/lib/routes";
import {
  BillingCurrency,
  BillingInterval,
  DEFAULT_INTERVAL,
  pricingPlanFor,
  isBillingInterval,
  variantFor,
} from "@/lib/pricing";
import { IntervalToggle } from "@/components/interval-toggle";
import {
  CPA_AUTO_RENEW_BULLETS,
  LEGAL_DISCLAIMER_UNIVERSAL,
  CLICKWRAP_PAID_CHECKOUT_LABEL,
  PAID_RENEWAL_MEDIALINE,
  FREE_TRIAL_DOES_NOT_AUTO_CONVERT,
  TOS_VERSION_CURRENT,
  PRIVACY_VERSION_CURRENT,
} from "@/lib/constants";

type SubscribeClientProps = {
  subscriberId: string;
  currency: BillingCurrency;
};

const TICK = "✓";

export function SubscribeClient({
  subscriberId,
  currency,
}: SubscribeClientProps) {
  const [termsChecked, setTermsChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [billingInterval, setBillingInterval] = useState<BillingInterval>(DEFAULT_INTERVAL);

  const plan = useMemo(() => pricingPlanFor(currency), [currency]);

  const annualEquiv = plan.annual.equivalentMonthly;
  const monthlyAmt = plan.monthly.amount;

  const selectedVariant = variantFor(currency, billingInterval);
  const subscribeButtonLabel =
    billingInterval === "annual"
      ? `Subscribe — ${plan.currencySymbol}${plan.annual.amount.toFixed(2)} ${currency}/year`
      : `Subscribe — ${plan.currencySymbol}${plan.monthly.amount.toFixed(2)} ${currency}/month`;

  async function proceed() {
    if (!termsChecked) {
      setError(
        "Please check the box to agree to the Terms of Service and acknowledge the Privacy Policy before continuing.",
      );
      return;
    }
    setError(null);
    setLoading(true);
    const interval = isBillingInterval(billingInterval)
      ? billingInterval
      : DEFAULT_INTERVAL;
    try {
      const res = await fetch(`/api/subscribe/${subscriberId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tos_version: TOS_VERSION_CURRENT,
          privacy_version: PRIVACY_VERSION_CURRENT,
          terms_checked: true,
          billing_interval: interval,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.ok || !(body.checkoutUrl || body.url)) {
        const message =
          body.message ??
          "Something went wrong while preparing checkout. Please try again in a moment.";
        setError(message);
        return;
      }
      window.location.href = (body.checkoutUrl as string) ?? (body.url as string);
    } catch (err) {
      console.error(err);
      setError(
        "Unable to reach the billing service. Please check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="subscribe-shell">
      <div className="subscribe-layout">
        <header className="subscribe-header">
          <Link href="/" className="subscribe-brand">
            <span className="subscribe-brand-mark" aria-hidden>
              {"{ "}
              <strong>WH</strong>
              {" }"}
            </span>
            <span className="subscribe-brand-name">Warm-Hello</span>
          </Link>
          <Link href={legalLinks.privacy} className="subscribe-top-link">
            Privacy Policy
          </Link>
        </header>

        <section className="subscribe-grid">
          <div className="subscribe-summary card">
            <p className="eyebrow" style={{ marginTop: 0, marginBottom: 6 }}>
              Almost Done
            </p>
            <h1 className="subscribe-title">Review & confirm</h1>
            <p className="subscribe-lede">
              Warm-Hello will send a gentle one-tap daily SMS check-in to your
              loved one every morning and alert your family if two consecutive
              checks are missed.
            </p>

            <div className="subscribe-summary-items">
              <div>
                <span>Seniors receiving daily check-ins</span>
                <strong>1 adult</strong>
              </div>
              <div>
                <span>Senior contact number</span>
                <strong>Configured in dashboard</strong>
              </div>
              <div>
                <span>Family account email</span>
                <strong>Your account email</strong>
              </div>
              <div>
                <span>Family contacts</span>
                <strong>Up to 2 trusted escalation contacts</strong>
              </div>
              <div>
                <span>Support channel</span>
                <strong>care@warm-hello.com</strong>
              </div>
              <div>
                <span>Monthly SMS escalation alerts</span>
                <strong>Included</strong>
              </div>
            </div>

            <div
              style={{
                marginTop: 24,
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 13,
                      color: "var(--muted)",
                      textTransform: "uppercase",
                      letterSpacing: 0.6,
                      fontWeight: 700,
                    }}
                  >
                    {plan.marketing.billingFrequencyLabel}
                  </p>
                  <p style={{ margin: "2px 0 0", fontWeight: 600 }}>
                    {billingInterval === "annual"
                      ? plan.annual.billedAnnuallyLabel
                      : `Billed monthly at ${plan.monthly.displayLabel}`}
                  </p>
                </div>
                <IntervalToggle
                  value={billingInterval}
                  onChange={setBillingInterval}
                  compact
                />
              </div>

              <div
                className="subscribe-plan-compare"
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(240px, 300px) minmax(240px, 300px)",
                  justifyContent: "center",
                  gap: 10,
                  marginTop: 4,
                }}
              >
                <div
                  className={`subscribe-plan-chip ${billingInterval === "monthly" ? "is-selected" : ""}`}
                  style={{
                    padding: 10,
                    borderRadius: 12,
                    border:
                      billingInterval === "monthly"
                        ? "3px solid color-mix(in oklab, #10b981 88%, white 12%)"
                        : "2px solid var(--border)",
                    background:
                      billingInterval === "monthly"
                        ? "color-mix(in oklab, #60a5fa 10%, var(--surface))"
                        : "var(--surface-elevated)",
                    cursor: "pointer",
                    transition: "border-color 160ms ease, background-color 160ms ease, transform 160ms ease",
                  }}
                  onClick={() => setBillingInterval("monthly")}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setBillingInterval("monthly");
                    }
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: 0.4,
                      textTransform: "uppercase",
                      color: "var(--muted)",
                    }}
                  >
                    Monthly Standard
                  </p>
                  <p style={{ margin: "4px 0 0", fontSize: 18, fontWeight: 800 }}>
                    {plan.currencySymbol}
                    {monthlyAmt.toFixed(2)}
                    <span style={{ fontSize: 13, fontWeight: 500, color: "var(--muted)" }}>
                      /mo
                    </span>
                  </p>
                  <p
                    style={{
                      margin: "6px 0 0",
                      fontSize: 12,
                      color: "var(--muted)",
                    }}
                  >
                    Flexible billing. Cancel anytime.
                  </p>
                </div>

                <div
                  className={`subscribe-plan-chip ${billingInterval === "annual" ? "is-selected" : ""}`}
                  style={{
                    position: "relative",
                    padding: 10,
                    borderRadius: 12,
                    border:
                      billingInterval === "annual"
                        ? "3px solid color-mix(in oklab, #10b981 88%, white 12%)"
                        : "2px solid var(--border)",
                    background:
                      billingInterval === "annual"
                        ? "color-mix(in oklab, #60a5fa 10%, var(--surface))"
                        : "var(--surface-elevated)",
                    cursor: "pointer",
                    transition: "border-color 160ms ease, background-color 160ms ease, transform 160ms ease",
                  }}
                  onClick={() => setBillingInterval("annual")}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setBillingInterval("annual");
                    }
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      top: -10,
                      right: 10,
                      padding: "3px 9px",
                      borderRadius: 999,
                      fontSize: 10,
                      fontWeight: 800,
                      letterSpacing: 0.3,
                      textTransform: "uppercase",
                      background: billingInterval === "annual" ? "#059669" : "color-mix(in oklab, #10b981 18%, transparent)",
                      color: billingInterval === "annual" ? "#ffffff" : "#10b981",
                    }}
                  >
                    Save ~20%
                  </span>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: 0.4,
                      textTransform: "uppercase",
                      color: "var(--muted)",
                    }}
                  >
                    Annual Peace of Mind
                  </p>
                  <p style={{ margin: "4px 0 0", fontSize: 18, fontWeight: 800 }}>
                    {plan.currencySymbol}
                    {annualEquiv.toFixed(2)}
                    <span style={{ fontSize: 13, fontWeight: 500, color: "var(--muted)" }}>
                      /mo equiv
                    </span>
                  </p>
                  <p
                    style={{
                      margin: "6px 0 0",
                      fontSize: 12,
                      color: "var(--muted)",
                    }}
                  >
                    {plan.annual.billedAnnuallyLabel}
                  </p>
                </div>
              </div>

              <div className="subscribe-cost">
                <span>Today</span>
                <strong>Free during 7-day trial</strong>
              </div>
              <div className="subscribe-cost">
                <span>{plan.marketing.billingFrequencyLabel}</span>
                <strong>
                  {billingInterval === "annual"
                    ? plan.annual.displayLabel
                    : plan.monthly.displayLabel}
                </strong>
              </div>
              <div className="subscribe-cost">
                <span>
                  {billingInterval === "annual"
                    ? "Daily equivalent"
                    : "Daily equivalent (approx.)"}
                </span>
                <strong>
                  {plan.currencySymbol}
                  {(
                    billingInterval === "annual"
                      ? plan.annual.dailyAmount
                      : plan.monthly.amount / 30
                  ).toFixed(2)}
                  /day
                </strong>
              </div>

            </div>

            <ul className="check-list subscribe-check-list">
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
            </ul>
          </div>

          <div className="subscribe-cta card">
            <h2 className="subscribe-cta-title">Choose a plan to continue</h2>
            <p className="subscribe-cta-lede">
              Your free trial has ended. To continue using Warm-Hello, actively
              select a plan and complete checkout below. No charge is made until
              you confirm purchase on the next screen.
            </p>

            <div
              className="subscribe-renewal-mediabar"
              style={{
                margin: "4px 0 18px",
                padding: "14px 16px",
                borderRadius: 12,
                border: "2px solid color-mix(in oklab, var(--accent) 40%, var(--border))",
                background: "color-mix(in oklab, var(--accent) 7%, var(--surface))",
                fontSize: 14,
                lineHeight: 1.55,
              }}
            >
              <strong>{PAID_RENEWAL_MEDIALINE}</strong>
              <div style={{ marginTop: 6, color: "var(--muted)" }}>
                {FREE_TRIAL_DOES_NOT_AUTO_CONVERT}
              </div>
            </div>

            <label
              className="consent-row"
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 16,
                padding: "16px 18px",
                borderRadius: 12,
                border: termsChecked
                  ? "2px solid color-mix(in oklab, var(--accent) 55%, transparent)"
                  : "2px solid var(--border)",
                background: termsChecked
                  ? "color-mix(in oklab, var(--accent) 6%, var(--surface))"
                  : "var(--surface-elevated)",
                cursor: "pointer",
                userSelect: "none",
              }}
            >
              <input
                type="checkbox"
                checked={termsChecked}
                onChange={(event) => setTermsChecked(event.target.checked)}
                aria-label={CLICKWRAP_PAID_CHECKOUT_LABEL}
                style={{
                  width: 26,
                  height: 26,
                  minWidth: 26,
                  minHeight: 26,
                  marginTop: 2,
                  accentColor: "var(--accent)",
                  cursor: "pointer",
                }}
              />
              <span
                style={{
                  fontSize: 15,
                  lineHeight: 1.5,
                  color: "var(--text)",
                  fontWeight: 500,
                }}
              >
                {CLICKWRAP_PAID_CHECKOUT_LABEL}
                <br />
                <span style={{ color: "var(--muted)", fontSize: 13 }}>
                  (
                  <Link href={legalLinks.terms} target="_blank" rel="noreferrer">
                    Terms of Service
                  </Link>{" "}
                  ·{" "}
                  <Link href={legalLinks.privacy} target="_blank" rel="noreferrer">
                    Privacy Policy
                  </Link>
                  )
                </span>
              </span>
            </label>

            <button
              type="button"
              className="button primary subscribe-proceed-button"
              disabled={loading || !termsChecked}
              onClick={proceed}
              style={{
                fontSize: 17,
                fontWeight: 800,
                padding: "18px 22px",
                letterSpacing: 0.2,
                wordBreak: "break-word",
              }}
            >
              {loading ? "Preparing checkout…" : subscribeButtonLabel}
            </button>

            <p
              className="subscribe-billing-disclosure"
              style={{
                marginTop: 14,
                marginBottom: 0,
                padding: "12px 14px",
                borderRadius: 10,
                border: "1px solid var(--border)",
                background: "rgba(15, 23, 42, 0.25)",
                fontSize: 13,
                lineHeight: 1.6,
                color: "var(--muted)",
                textAlign: "left",
              }}
            >
              By selecting{" "}
              <strong style={{ color: "var(--text)" }}>Subscribe</strong>, you agree to the{" "}
              <Link href={legalLinks.terms} target="_blank" rel="noreferrer" className="inline-link">
                Terms of Service
              </Link>{" "}
              and acknowledge the{" "}
              <Link href={legalLinks.privacy} target="_blank" rel="noreferrer" className="inline-link">
                Privacy Policy
              </Link>
              . This is a recurring subscription that automatically renews each billing period until cancelled. Your selected subscription price{" "}
              <strong style={{ color: "var(--text)" }}>plus applicable taxes</strong> will be charged at renewal. {FREE_TRIAL_DOES_NOT_AUTO_CONVERT}
            </p>

            {error ? (
              <div className="subscribe-submit-error" role="alert">
                {error}
              </div>
            ) : null}

            <p className="subscribe-security-note">
              Secure payments and subscription management are powered by
              Stripe.
            </p>
          </div>
        </section>

        <section
          className="card subscribe-cpa-card"
          style={{
            marginTop: 24,
            textAlign: "left",
            border: "2px solid var(--accent-muted)",
            background: "rgba(250, 204, 21, 0.06)",
          }}
        >
          <p style={{ marginTop: 0 }}>
            <strong>Auto-renewal &amp; billing transparency (Ontario CPA):</strong>
          </p>
          <ul className="prompt-list" style={{ marginTop: 10, textAlign: "left" }}>
            {CPA_AUTO_RENEW_BULLETS.map((bullet, i) => (
              <li key={i}>
                <strong>{bullet}</strong>
              </li>
            ))}
          </ul>
        </section>

        <section
          className="card subscribe-legal-card"
          style={{
            marginTop: 20,
            textAlign: "left",
            border: "2px solid rgb(250, 204, 21)",
            background: "rgba(250, 204, 21, 0.10)",
          }}
        >
          <blockquote className="notice-block" style={{ marginTop: 0, marginBottom: 0 }}>
            {LEGAL_DISCLAIMER_UNIVERSAL}
          </blockquote>
          <p style={{ marginTop: 8, fontSize: 13, color: "var(--muted)" }}>
            Read the full{" "}
            <Link href={legalLinks.terms} className="inline-link">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href={legalLinks.privacy} className="inline-link">
              Privacy Policy
            </Link>
            .
          </p>
        </section>
      </div>
    </main>
  );
}

export default SubscribeClient;
