"use client";

import { useState } from "react";

type CheckoutButtonProps = {
  subscriberId: string;
  customerEmail: string;
  label?: string;
};

export function CheckoutButton({
  subscriberId,
  customerEmail,
  label = "Buy Now",
}: CheckoutButtonProps) {
  const [statusMessage, setStatusMessage] = useState(
    "",
  );
  const [submitting, setSubmitting] = useState(false);

  async function handleCheckout() {
    setSubmitting(true);
    setStatusMessage("Creating checkout session...");

    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscriberId,
          customerEmail,
        }),
      });

      const data = (await response.json()) as {
        ok?: boolean;
        url?: string | null;
        message?: string;
      };

      if (!response.ok || !data.ok || !data.url) {
        setStatusMessage(data.message ?? "Stripe checkout is not configured yet.");
        return;
      }

      setStatusMessage("Redirecting to Stripe checkout...");
      window.location.href = data.url;
    } catch {
      setStatusMessage("We could not create the checkout session right now.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <button className="button buy-now-button" onClick={handleCheckout} disabled={submitting}>
        {submitting ? "Starting..." : label}
      </button>
      {statusMessage ? <p style={{ marginTop: 12 }}>{statusMessage}</p> : null}
    </div>
  );
}
