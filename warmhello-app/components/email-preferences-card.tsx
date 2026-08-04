"use client";

import { useState } from "react";

type EmailPreferencesCardProps = {
  initialEmailOptedOut: boolean;
};

export function EmailPreferencesCard({ initialEmailOptedOut }: EmailPreferencesCardProps) {
  const [emailOptedOut, setEmailOptedOut] = useState(initialEmailOptedOut);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function update(nextValue: boolean) {
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch("/api/preferences/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOptedOut: nextValue }),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok || !data.ok) {
        setStatus(data.message ?? "Could not update settings.");
        return;
      }
      setEmailOptedOut(nextValue);
      setStatus("Saved.");
    } catch {
      setStatus("Could not update settings.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card" style={{ marginTop: 24 }}>
      <p className="eyebrow">Account settings</p>
      <h2>Email notifications</h2>
      <p className="lede">
        Control non-essential onboarding emails like trial reminders. SMS check-ins are not affected
        by this setting.
      </p>

      <div className="status-list" style={{ marginTop: 16 }}>
        <div className="status-row" style={{ gap: 16 }}>
          <span style={{ flex: 1 }}>Trial emails</span>
          <span style={{ width: 220, textAlign: "right" }}>
            {emailOptedOut ? "Unsubscribed" : "Subscribed"}
          </span>
          <span style={{ width: 170, textAlign: "right" }}>
            <button
              type="button"
              className="button secondary"
              disabled={busy}
              onClick={() => void update(!emailOptedOut)}
            >
              {emailOptedOut ? "Re-subscribe" : "Unsubscribe"}
            </button>
          </span>
        </div>
      </div>

      {status ? <p style={{ marginTop: 12 }}>{status}</p> : null}
    </section>
  );
}

