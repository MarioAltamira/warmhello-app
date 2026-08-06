"use client";

import { useState } from "react";
import { BuyNowButton } from "@/components/buy-now-button";
import CurrencyToggle from "@/components/currency-toggle";

type SubscriptionManagementCardProps = {
  subscriberId: string;
  subscriptionStatus: string;
  showBuyNow: boolean;
  customerEmail: string;
  billingCurrency?: "USD" | "CAD";
  billingPlanLabel?: string;
  buyNowIntent?: "BUY_NOW" | "POPUP_ALREADY_SUBSCRIBED" | "POPUP_HAS_TIME_REMAINING";
  timeRemainingLabel?: string | null;
};

export function SubscriptionManagementCard({
  subscriberId,
  subscriptionStatus,
  billingCurrency,
  billingPlanLabel,
  buyNowIntent,
  timeRemainingLabel,
}: SubscriptionManagementCardProps) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function handleCancel() {
    if (!confirming) {
      setConfirming(true);
      setStatus("Click again to confirm cancellation.");
      return;
    }

    setBusy(true);
    setStatus("Canceling auto-renew...");
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
      setStatus(data.message ?? "Subscription updated.");
      setConfirming(false);
    } catch {
      setStatus("We could not cancel your subscription right now.");
    } finally {
      setBusy(false);
    }
  }

  const canCancel = subscriptionStatus === "Active" || subscriptionStatus === "Past Due";

  return (
    <section className="card" style={{ marginTop: 24 }}>
      <p className="eyebrow">Account settings</p>
      <h2>Subscription</h2>
      <p className="lede">
        Current status: <strong>{subscriptionStatus}</strong>. Upgrade, renew, or turn off auto-renew
        here.
      </p>
      {billingPlanLabel ? (
        <p>
          <strong>Plan:</strong> {billingPlanLabel}
        </p>
      ) : null}
      <div style={{ marginTop: 12 }}>
        <CurrencyToggle initial={billingCurrency} compact />
      </div>

      <div className="actions" style={{ marginTop: 16, flexWrap: "wrap" }}>
        {subscriberId ? (
          <BuyNowButton
            subscriberId={subscriberId}
            intent={buyNowIntent ?? "BUY_NOW"}
            timeRemainingLabel={timeRemainingLabel}
          />
        ) : null}

        {canCancel ? (
          <button
            type="button"
            className="button secondary"
            onClick={() => void handleCancel()}
            disabled={busy}
          >
            {confirming ? "Confirm Cancel Auto-Renew" : "Cancel Auto-Renew"}
          </button>
        ) : null}
      </div>

      {status ? <p style={{ marginTop: 12 }}>{status}</p> : null}
    </section>
  );
}
