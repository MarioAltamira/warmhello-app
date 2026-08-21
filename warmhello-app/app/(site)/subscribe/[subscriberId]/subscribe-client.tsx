"use client";

import Link from "next/link";
import { useState } from "react";
import { CLICKWRAP_CHECKOUT_LABEL, TOS_VERSION_CURRENT } from "@/lib/constants";

export default function SubscribeClient({ subscriberId }: { subscriberId: string }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [failed, setFailed] = useState<boolean>(false);
  const [consentChecked, setConsentChecked] = useState<boolean>(false);

  async function proceed() {
    if (!consentChecked) {
      setFailed(true);
      setStatus("Please accept the Terms of Service and authorization to continue.");
      return;
    }

    setLoading(true);
    setFailed(false);
    setStatus("Preparing secure checkout...");

    try {
      const res = await fetch(`/api/subscribe/${encodeURIComponent(subscriberId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tos_version: TOS_VERSION_CURRENT,
          caregiver_ack: true,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        url?: string | null;
        message?: string;
      };
      if (!res.ok || !data.ok || !data.url) {
        setFailed(true);
        setLoading(false);
        setStatus(data.message ?? "Checkout is not available right now.");
        return;
      }
      setStatus("Redirecting to Stripe Checkout...");
      window.location.href = data.url;
    } catch {
      setFailed(true);
      setLoading(false);
      setStatus("We could not start checkout right now.");
    }
  }

  return (
    <div style={{ textAlign: "left" }}>
      <label
        className="checkbox-grid-row"
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
          padding: "16px",
          border: "1px solid var(--border)",
          borderRadius: 12,
          background: "rgba(15, 23, 42, 0.3)",
        }}
      >
        <input
          type="checkbox"
          checked={consentChecked}
          onChange={(event) => setConsentChecked(event.target.checked)}
          style={{ marginTop: 4 }}
        />
        <div style={{ fontSize: 14, lineHeight: 1.55 }}>
          <div style={{ whiteSpace: "pre-line" }}>{CLICKWRAP_CHECKOUT_LABEL}</div>
          <div style={{ marginTop: 6, fontSize: 13, color: "var(--muted)" }}>
            <Link href="/terms" className="inline-link">
              Terms of Service
            </Link>{" "}
            ·{" "}
            <Link href="/privacy" className="inline-link">
              Privacy Policy
            </Link>
          </div>
        </div>
      </label>

      <div className="actions" style={{ marginTop: 20, justifyContent: "center" }}>
        <button
          type="button"
          className="button primary"
          disabled={!consentChecked || loading}
          onClick={() => void proceed()}
        >
          {loading ? "Preparing Checkout..." : "Proceed to Checkout"}
        </button>
        <Link href="/dashboard" className="button secondary">
          Back to Dashboard
        </Link>
      </div>

      {status ? <p style={{ marginTop: 14, textAlign: "center" }}>{status}</p> : null}
      {failed && !loading ? (
        <div className="actions" style={{ marginTop: 12, justifyContent: "center" }}>
          <button type="button" className="button secondary" onClick={() => void proceed()}>
            Try again
          </button>
        </div>
      ) : null}
    </div>
  );
}
