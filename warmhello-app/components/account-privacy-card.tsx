"use client";

import Link from "next/link";
import { useState } from "react";

export function AccountPrivacyCard({ subscriberEmail }: { subscriberEmail: string }) {
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [confirmStep, setConfirmStep] = useState<1 | 2>(1);
  const [status, setStatus] = useState<string | null>(null);

  async function downloadExport() {
    setExporting(true);
    setStatus("Preparing export...");
    try {
      const res = await fetch("/api/account/export", { method: "GET" });
      if (!res.ok) {
        setStatus("Could not generate export. Try again in a moment.");
        return;
      }
      const blob = await res.blob();
      const cd = res.headers.get("Content-Disposition");
      const nameMatch = cd?.match(/filename="([^"]+)"/);
      const filename = nameMatch?.[1] ?? `warmhello-account-export-${Date.now()}.json`;
      const url = window.URL.createObjectURL(blob);
      try {
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } finally {
        window.URL.revokeObjectURL(url);
      }
      setStatus("Export downloaded.");
    } catch {
      setStatus("Could not download export. Try again in a moment.");
    } finally {
      setExporting(false);
    }
  }

  async function requestDelete() {
    setDeleting(true);
    setStatus("Deleting your account...");
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmEmail: deleteConfirmText }),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string; redirect?: string };
      if (!res.ok || !data.ok) {
        setStatus(data.message ?? "Could not delete your account right now.");
        return;
      }
      setStatus("Account deleted. Redirecting...");
      const url = data.redirect ?? "/auth?mode=login&source=account-deleted";
      setTimeout(() => {
        window.location.href = url;
      }, 800);
    } catch {
      setStatus("Could not delete your account right now.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section className="card" style={{ marginTop: 24 }}>
      <p className="eyebrow">Privacy &amp; data</p>
      <h2>Your data</h2>
      <p className="lede">
        Per PIPEDA Principle 4.9 and the Ontario CPA, you may download a copy of your account data
        or permanently delete your account at any time.
      </p>

      <div className="status-list" style={{ marginTop: 16 }}>
        <div className="status-row" style={{ gap: 16, alignItems: "center" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600 }}>Download my data</div>
            <div style={{ fontSize: 13, color: "var(--muted)" }}>
              JSON file containing your subscriber profile, senior(s), contacts, check-in history,
              and SMS log metadata.
            </div>
          </div>
          <button
            type="button"
            className="button secondary"
            onClick={() => void downloadExport()}
            disabled={exporting}
          >
            {exporting ? "Preparing..." : "Download JSON"}
          </button>
        </div>
      </div>

      <div
        className="status-row"
        style={{
          marginTop: 24,
          gap: 16,
          alignItems: "flex-start",
          padding: 16,
          border: "1px solid rgba(220, 38, 38, 0.35)",
          borderRadius: 12,
          background: "rgba(220, 38, 38, 0.06)",
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, color: "rgb(239, 68, 68)" }}>
            Delete my account permanently
          </div>
          <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
            This will immediately cancel any active Stripe subscription, anonymize your subscriber
            record, and delete all check-ins, contacts, seniors, and SMS logs associated with this
            account. This action cannot be undone.
          </div>

          {confirmStep === 1 ? (
            <div className="actions" style={{ marginTop: 14, justifyContent: "flex-start" }}>
              <button
                type="button"
                className="button secondary"
                disabled={deleting}
                onClick={() => setConfirmStep(2)}
              >
                Continue to delete account
              </button>
            </div>
          ) : (
            <div style={{ marginTop: 14 }}>
              <label style={{ display: "grid", gap: 8, fontSize: 14, fontWeight: 600 }}>
                Confirm your email to continue:
                <input
                  type="email"
                  value={deleteConfirmText}
                  onChange={(event) => setDeleteConfirmText(event.target.value)}
                  placeholder={subscriberEmail}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: "1px solid var(--border)",
                    background: "var(--field-bg)",
                    color: "var(--text)",
                    font: "inherit",
                  }}
                />
              </label>
              <div className="actions" style={{ marginTop: 12, justifyContent: "flex-start" }}>
                <button
                  type="button"
                  className="button primary"
                  disabled={
                    deleting ||
                    !deleteConfirmText ||
                    deleteConfirmText.trim().toLowerCase() !==
                      subscriberEmail.trim().toLowerCase()
                  }
                  onClick={() => void requestDelete()}
                  style={{
                    background:
                      deleting ||
                      !deleteConfirmText ||
                      deleteConfirmText.trim().toLowerCase() !==
                        subscriberEmail.trim().toLowerCase()
                        ? undefined
                        : "rgb(220, 38, 38)",
                    borderColor: "rgb(220, 38, 38)",
                  }}
                >
                  {deleting ? "Deleting..." : "Permanently delete my account"}
                </button>
                <button
                  type="button"
                  className="button secondary"
                  disabled={deleting}
                  onClick={() => {
                    setConfirmStep(1);
                    setDeleteConfirmText("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <p style={{ marginTop: 16, fontSize: 13, color: "var(--muted)" }}>
        You may also request access, correction, or deletion in writing via{" "}
        <Link href={`mailto:sales@warm-hello.com?subject=PIPEDA%20IAR%20Request`} className="inline-link">
          sales@warm-hello.com
        </Link>
        . Written requests are responded to within 30 days per PIPEDA.
      </p>

      {status ? <p style={{ marginTop: 14 }}>{status}</p> : null}
    </section>
  );
}
