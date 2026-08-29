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
