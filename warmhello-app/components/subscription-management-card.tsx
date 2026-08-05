"use client";

import { useState } from "react";

type SubscriptionManagementCardProps = {
  subscriberId: string;
  subscriptionStatus: string;
  showBuyNow: boolean;
  customerEmail: string;
};

export function SubscriptionManagementCard({
  subscriberId,
  subscriptionStatus,
  showBuyNow,
  customerEmail,
}: SubscriptionManagementCardProps) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function handleCheckout() {
    setBusy(true);
    setStatus("Starting checkout...");
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriberId, customerEmail }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        url?: string | null;
        message?: string;
      };
      if (!res.ok || !data.ok || !data.url) {
        setStatus(data.message ?? "Stripe checkout is not configured yet.");
        return;
      }
      window.location.href = data.url;
    } catch {
      setStatus("We could not start checkout right now.");
    } finally {
      setBusy(false);
    }
  }

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

      <div className="actions" style={{ marginTop: 16, flexWrap: "wrap" }}>
        {showBuyNow ? (
          <button
            type="button"
            className="button primary"
            onClick={() => void handleCheckout()}
            disabled={busy}
          >
            {busy ? "Starting..." : "Buy Now"}
          </button>
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
