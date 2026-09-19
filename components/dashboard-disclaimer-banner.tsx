"use client";

import { useState } from "react";
import { LEGAL_DISCLAIMER_CONDENSED, EMERGENCY_WARNING_DASHBOARD } from "@/lib/constants";

type Props = { subscriberId: string; initiallyDismissed: boolean };

export function DashboardDisclaimerBanner({ subscriberId, initiallyDismissed }: Props) {
  const [dismissed, setDismissed] = useState<boolean>(initiallyDismissed);
  const [dismissing, setDismissing] = useState(false);

  if (dismissed) {
    return null;
  }

  async function dismiss() {
    setDismissing(true);
    try {
      await fetch("/api/dashboard/disclaimer-dismiss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriberId }),
      });
    } catch {
      // ignore - still hide locally for UX
    } finally {
      setDismissing(false);
      setDismissed(true);
    }
  }

  return (
    <div
      className="card"
      style={{
        marginTop: 16,
        border: "2px solid rgb(250, 204, 21)",
        background: "rgba(250, 204, 21, 0.08)",
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        justifyContent: "space-between",
      }}
    >
      <blockquote className="notice-block" style={{ marginTop: 0, marginBottom: 0 }}>
        <strong>{EMERGENCY_WARNING_DASHBOARD}</strong>
        <div style={{ marginTop: 6, fontSize: 13, color: "var(--muted)" }}>
          {LEGAL_DISCLAIMER_CONDENSED}
        </div>
      </blockquote>
      <button
        type="button"
        className="button secondary"
        onClick={() => void dismiss()}
        disabled={dismissing}
        style={{ padding: "6px 12px", fontSize: 13, whiteSpace: "nowrap" }}
      >
        {dismissing ? "Saving..." : "Dismiss"}
      </button>
    </div>
  );
}
