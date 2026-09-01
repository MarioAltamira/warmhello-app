"use client";

import Link from "next/link";
import { useState } from "react";
import { BuyNowButton } from "@/components/buy-now-button";
import {
  FREE_TRIAL_DOES_NOT_AUTO_CONVERT,
  NON_EMERGENCY_POSITIONING_LINE,
} from "@/lib/constants";
type SubscriptionManagementCardProps = {
  subscriberId: string;
  subscriptionStatus: string;
  showBuyNow: boolean;
  customerEmail: string;
  billingCurrency?: "USD" | "CAD";
  billingPlanLabel?: string;
  buyNowIntent?: "BUY_NOW" | "POPUP_ALREADY_SUBSCRIBED" | "POPUP_HAS_TIME_REMAINING";
  timeRemainingLabel?: string | null;
  currentPeriodEndsAtIso?: string | null;
  billingInterval?: "MONTHLY" | "ANNUAL" | null;
  cancellationStatus?: "NONE" | "PENDING_AT_PERIOD_END" | "CANCELED" | null;
};

function formatPeriodEndLabel(iso: string | null | undefined, timeRemainingLabel: string | null | undefined) {
  if (timeRemainingLabel) return `${timeRemainingLabel} remaining (through end of current billing period)`;
  if (!iso) return "See Dashboard for the current period end date.";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "See Dashboard for the current period end date.";
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function SubscriptionManagementCard({
  subscriberId,
  subscriptionStatus,
  billingCurrency,
  billingPlanLabel,
  billingInterval,
  buyNowIntent,
  timeRemainingLabel,
  currentPeriodEndsAtIso,
  cancellationStatus,
}: SubscriptionManagementCardProps) {
  const [cancelStep, setCancelStep] = useState<1 | 2>(1);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const normalizedStatus = subscriptionStatus.trim().toUpperCase().replace(/\s+/g, "_");
  const isActiveOrPastDue =
    normalizedStatus === "ACTIVE" ||
    normalizedStatus === "PAST_DUE";
  const isCancelPending = cancellationStatus === "PENDING_AT_PERIOD_END";
  const canCancel = isActiveOrPastDue && !isCancelPending;

  async function handleCancel() {
    if (cancelStep === 1) {
      setCancelStep(2);
      setStatus(
        "Click again to confirm cancellation. Cancelling prevents future renewal charges; your subscription remains active until the end of the period you already paid for.",
      );
      return;
    }

    setBusy(true);
    setStatus("Cancelling auto-renewal...");
    try {
      const res = await fetch("/api/billing/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriberId }),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok || !data.ok) {
        setStatus(data.message ?? "We could not cancel your subscription right now.");
        return;
      }
      setStatus(
        data.message ??
          "Auto-renewal is now OFF. Your subscription remains active until the end of your current billing period, and no future renewal charges will be made.",
      );
      setCancelStep(1);
    } catch {
      setStatus("We could not cancel your subscription right now.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card" style={{ marginTop: 24 }} id="subscription">
      <p className="eyebrow">Account settings</p>
      <h2>Subscription</h2>
      <p className="lede">
        Manage billing, review your plan, or turn off auto-renewal here.{" "}
        <strong>Settings &rarr; Subscription &rarr; Manage Subscription.</strong>
      </p>

      <blockquote
        className="notice-block"
        style={{
          borderColor: "rgba(255,214,102,0.25)",
          background: "rgba(255,214,102,0.06)",
          marginTop: 14,
        }}
      >
        <strong>{NON_EMERGENCY_POSITIONING_LINE}</strong>
      </blockquote>

      <div
        className="status-list"
        style={{
          marginTop: 18,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: 10,
        }}
      >
        <div className="status-row" style={{ flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
          <span className="section-meta">Current status</span>
          <span>
            <strong>
              {isCancelPending ? "Active — auto-renewal cancelled" : subscriptionStatus}
            </strong>
          </span>
        </div>
        {billingPlanLabel ? (
          <div className="status-row" style={{ flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
            <span className="section-meta">Plan</span>
            <span>
              <strong>{billingPlanLabel}</strong>
            </span>
          </div>
        ) : null}
        {billingInterval ? (
          <div className="status-row" style={{ flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
            <span className="section-meta">Billing frequency</span>
            <span>
              <strong>{billingInterval === "ANNUAL" ? "Annual" : "Monthly"}</strong>
            </span>
          </div>
        ) : null}
        {billingCurrency ? (
          <div className="status-row" style={{ flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
            <span className="section-meta">Currency</span>
            <span>
              <strong>{billingCurrency}</strong>
            </span>
          </div>
        ) : null}
        <div className="status-row" style={{ flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
          <span className="section-meta">Current period ends</span>
          <span>
            <strong>
              {formatPeriodEndLabel(currentPeriodEndsAtIso, timeRemainingLabel)}
            </strong>
          </span>
        </div>
      </div>

      <div
        className="subscription-disclosure"
        style={{
          marginTop: 18,
          padding: "14px 16px",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 12,
          background: "rgba(255,255,255,0.03)",
        }}
      >
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6 }}>
          <strong>Cancellation policy:</strong> If you cancel auto-renewal,{" "}
          <strong>
            your subscription will remain active until the end of your current paid
            billing period
          </strong>
          . <strong>Cancelling prevents future renewal charges.</strong> No partial
          refunds are provided for the remainder of a billing period unless
          otherwise required by applicable law.
        </p>
        <p style={{ margin: "8px 0 0 0", fontSize: 13, lineHeight: 1.6 }}>
          <strong>7-day free trial:</strong> {FREE_TRIAL_DOES_NOT_AUTO_CONVERT}
        </p>
      </div>

      <UpgradeToAnnualCard
        subscriberId={subscriberId}
        isActive={normalizedStatus === "ACTIVE"}
        isMonthly={billingInterval ? billingInterval.toUpperCase() === "MONTHLY" : false}
        billingCurrency={billingCurrency}
      />

      <div className="actions" style={{ marginTop: 20, flexWrap: "wrap" }}>
        {subscriberId ? (
          <BuyNowButton
            subscriberId={subscriberId}
            intent={buyNowIntent ?? "BUY_NOW"}
            timeRemainingLabel={timeRemainingLabel}
            label={
              isActiveOrPastDue || isCancelPending
                ? "Change or Renew Plan"
                : "Subscribe Now"
            }
          />
        ) : null}

        <Link
          href={`/subscribe/${subscriberId}`}
          className="button secondary"
          aria-label="Go to checkout plans"
        >
          View Plan Options
        </Link>

        {isCancelPending ? (
          <button
            type="button"
            className="button secondary"
            disabled
            aria-label="Auto-renewal already cancelled"
            title="Auto-renewal is already OFF for the current term."
          >
            Auto-renewal OFF until end of term
          </button>
        ) : canCancel ? (
          <button
            type="button"
            className="button secondary"
            onClick={() => void handleCancel()}
            disabled={busy}
            style={{
              borderColor: "rgba(220, 38, 38, 0.45)",
              color: busy ? undefined : "rgb(220, 38, 38)",
            }}
          >
            {busy
              ? "Cancelling..."
              : cancelStep === 1
                ? "Cancel Auto-Renewal"
                : "Confirm: Turn Off Auto-Renewal"}
          </button>
        ) : null}
      </div>

      {cancelStep === 2 && !busy ? (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            borderRadius: 10,
            border: "1px solid rgba(220, 38, 38, 0.35)",
            background: "rgba(220, 38, 38, 0.06)",
            fontSize: 13,
            lineHeight: 1.6,
          }}
        >
          <strong style={{ color: "rgb(220, 38, 38)" }}>
            Are you sure you want to turn off auto-renewal?
          </strong>
          <ul className="longform-list" style={{ marginTop: 8 }}>
            <li>
              You will not be charged again at the next renewal date unless you
              reactivate.
            </li>
            <li>
              Your check-ins and trusted escalation notifications continue
              uninterrupted until the end of the period you already paid for.
            </li>
            <li>
              You can reactivate anytime from{" "}
              <Link href="/dashboard/settings#subscription" className="inline-link">
                Settings &rarr; Subscription
              </Link>
              .
            </li>
          </ul>
          <div className="actions" style={{ marginTop: 10, justifyContent: "flex-start" }}>
            <button
              type="button"
              className="button tertiary"
              onClick={() => {
                setCancelStep(1);
                setStatus(null);
              }}
            >
              Keep auto-renewal ON
            </button>
          </div>
        </div>
      ) : null}

      {status ? <p style={{ marginTop: 14 }}>{status}</p> : null}
    </section>
  );
}

type UpgradeToAnnualCardProps = {
  subscriberId: string;
  isActive: boolean;
  isMonthly: boolean;
  billingCurrency?: "USD" | "CAD";
};

type UpgradeResponse = {
  ok: boolean;
  message?: string;
  changed?: string;
  requiresPayment?: boolean;
  amountDue?: {
    currency: "USD" | "CAD";
    amountCents: number;
    amountDisplay: string;
  };
  pricing?: {
    perYearDisplay: string;
    equivalentMonthlyDisplay: string;
    savingsPercent: number;
  };
  hostedInvoicePayUrl?: string | null;
  invoicePdfUrl?: string | null;
};

function UpgradeToAnnualCard({
  subscriberId,
  isActive,
  isMonthly,
  billingCurrency,
}: UpgradeToAnnualCardProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [response, setResponse] = useState<UpgradeResponse | null>(null);

  if (!isActive || !isMonthly) return null;

  const currencySymbol = billingCurrency === "USD" ? "$" : "CA$";
  const perYear = billingCurrency === "USD" ? "144.00" : "180.00";
  const equivMonthly = billingCurrency === "USD" ? "11.99" : "15.00";
  const currentMonthly = billingCurrency === "USD" ? "14.99" : "19.99";
  const savings = "20";

  async function handleUpgrade() {
    if (step === 1) {
      setStep(2);
      setMessage(
        "Click again to confirm. Your card will be charged immediately for the prorated annual balance (annual fee minus credit for the unused portion of your current monthly term). Check-ins continue uninterrupted.",
      );
      return;
    }

    setBusy(true);
    setMessage("Preparing annual upgrade…");
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 15000);
    try {
      const res = await fetch("/api/billing/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriberId, toInterval: "annual" }),
        signal: ctrl.signal,
      });
      clearTimeout(to);
      const data = (await res.json()) as UpgradeResponse;
      setResponse(data);
      if (!res.ok || !data.ok) {
        setMessage(
          data.message ??
            "We couldn't start your annual upgrade right now. Please try again in 60 seconds or contact sales@warm-hello.com.",
        );
        return;
      }
      if (data.requiresPayment && data.hostedInvoicePayUrl) {
        setMessage(
          `Your upgrade is ready. ${data.message ?? "Open the Stripe invoice page below to complete payment."}`,
        );
        try {
          window.open(data.hostedInvoicePayUrl, "_blank", "noopener,noreferrer");
        } catch {
          /* ignore popup blockers */
        }
      } else {
        setMessage(
          data.message ??
            "Your annual upgrade has been applied. Your plan will refresh here in a few moments.",
        );
      }
    } catch {
      setMessage(
        "We couldn't complete your annual upgrade right now. Please try again in 60 seconds or contact sales@warm-hello.com.",
      );
    } finally {
      clearTimeout(to);
      setBusy(false);
      setStep(1);
    }
  }

  return (
    <section
      style={{
        marginTop: 20,
        padding: "18px 20px",
        border: "1px solid rgba(34, 197, 94, 0.35)",
        borderRadius: 14,
        background:
          "linear-gradient(180deg, rgba(34,197,94,0.08) 0%, rgba(34,197,94,0.02) 100%)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: "1 1 320px", minWidth: 280 }}>
          <p
            className="eyebrow"
            style={{ color: "rgb(34, 197, 94)", margin: 0, marginBottom: 4 }}
          >
            Save ~{savings}%
          </p>
          <h3 style={{ margin: 0, fontSize: 20 }}>Upgrade to Annual Billing</h3>
          <p className="lede" style={{ margin: "6px 0 12px 0" }}>
            From <strong>{currencySymbol}{currentMonthly}/month</strong> to{" "}
            <strong>{currencySymbol}{perYear}/year</strong> — works out to{" "}
            <strong>{currencySymbol}{equivMonthly}/month</strong> with no change to your check-ins or escalation contacts.
          </p>
          <ul
            className="longform-list"
            style={{ margin: 0, paddingInlineStart: 18, fontSize: 13, lineHeight: 1.7 }}
          >
            <li>Prorated credit for unused days already paid on this month</li>
            <li>One simple annual charge; no partial refunds (Ontario CPA cancellation policy applies).</li>
            <li>Check-ins, SMS, and family contacts continue without interruption.</li>
            <li>Auto-renewal stays ON for the new annual term unless you turn it off.</li>
          </ul>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "stretch",
            gap: 10,
            minWidth: 260,
          }}
        >
          <button
            type="button"
            className="button"
            onClick={() => void handleUpgrade()}
            disabled={busy}
            style={{
              background: "rgb(22, 163, 74)",
              border: "1px solid rgba(22,163,74,0.55)",
              color: "white",
            }}
          >
            {busy
              ? "Preparing upgrade…"
              : step === 1
                ? `Upgrade to Annual — ${currencySymbol}${perYear}/yr`
                : "Confirm: Charge prorated annual balance now"}
          </button>
          {response?.amountDue?.amountDisplay ? (
            <p style={{ margin: 0, fontSize: 13, textAlign: "center" }}>
              Amount due today: <strong>{response.amountDue.amountDisplay}</strong>
            </p>
          ) : null}
          {response?.hostedInvoicePayUrl ? (
            <a
              href={response.hostedInvoicePayUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="button secondary"
              style={{ textAlign: "center" }}
            >
              Pay prorated amount on Stripe (new tab)
            </a>
          ) : null}
          {response?.invoicePdfUrl ? (
            <a
              href={response.invoicePdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="button tertiary"
              style={{ textAlign: "center" }}
            >
              View invoice PDF
            </a>
          ) : null}
          {step === 2 && !busy ? (
            <button
              type="button"
              className="button tertiary"
              onClick={() => {
                setStep(1);
                setMessage(null);
              }}
            >
              Cancel — keep monthly billing
            </button>
          ) : null}
        </div>
      </div>

      {message ? (
        <p
          style={{
            marginTop: 14,
            marginBottom: 0,
            fontSize: 13,
            lineHeight: 1.6,
          }}
        >
          {message}
        </p>
      ) : null}
    </section>
  );
}
