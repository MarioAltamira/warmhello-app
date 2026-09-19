"use client";

import Link from "next/link";
import { useState } from "react";

const PRIVACY_CONTACT_EMAIL = "sales@warm-hello.com";

type PrivacyRequestKind =
  | "access"
  | "correct"
  | "delete"
  | "complaint"
  | "withdraw-consent"
  | "other";

const PRIVACY_REQUEST_TEMPLATES: Record<
  PrivacyRequestKind,
  { label: string; subject: string; body: string; hint: string }
> = {
  access: {
    label: "Access my information",
    subject: "Privacy request — Access my personal information",
    body:
      "To Whom It May Concern at Warm-Hello,\n\nI am submitting a request to access the personal information that Warm-Hello has collected and processed about me or my household. Please provide a complete, machine-readable export covering my subscriber profile, designated contacts, check-in history, and any consent or billing records associated with my account.\n\nAccount email (please keep if correct, otherwise update): YOUR ACCOUNT EMAIL HERE\n\nIf any additional information is required to verify this request, please let me know.\n\nThank you.",
    hint: "Receive a complete copy of your data.",
  },
  correct: {
    label: "Correct my information",
    subject: "Privacy request — Correct inaccurate personal information",
    body:
      "To Whom It May Concern at Warm-Hello,\n\nI am submitting a request to correct the following personal information held by Warm-Hello about me or my household.\n\nAccount email (please keep if correct, otherwise update): YOUR ACCOUNT EMAIL HERE\n\nInformation to correct:\n  • Describe the inaccurate record(s) here.\n\nPlease confirm in writing once the correction has been applied.\n\nThank you.",
    hint: "Fix inaccurate profile or contact details.",
  },
  delete: {
    label: "Delete my information",
    subject: "Privacy request — Delete my personal information",
    body:
      "To Whom It May Concern at Warm-Hello,\n\nI am submitting a request to delete the personal information that Warm-Hello has collected and processed about me or my household, to the extent permitted or required by applicable law.\n\nAccount email (please keep if correct, otherwise update): YOUR ACCOUNT EMAIL HERE\n\nNote: I understand that certain transaction, tax, security, fraud-prevention, or legal records may be retained where required or permitted by law even after account deletion. If you cannot delete certain records, please tell me which ones and the legal basis for retention.\n\nThank you.",
    hint: "Request erasure of your personal data.",
  },
  complaint: {
    label: "Privacy complaint",
    subject: "Privacy complaint — Warm-Hello",
    body:
      "To Whom It May Concern at Warm-Hello,\n\nI am submitting a privacy complaint regarding the following matter:\n\nAccount email (if applicable): YOUR ACCOUNT EMAIL HERE\n\nNature of the complaint:\n  • Describe the issue here (e.g., data handling, consent, marketing contact, or privacy-process concern).\n\nRequested resolution:\n  • Describe the resolution you are seeking.\n\nI look forward to your response within the statutory response window.\n\nThank you.",
    hint: "Raise a privacy-process concern.",
  },
  "withdraw-consent": {
    label: "Withdraw consent where applicable",
    subject: "Privacy request — Withdraw consent",
    body:
      "To Whom It May Concern at Warm-Hello,\n\nI am writing to withdraw consent for the following processing where it has been based on my prior consent.\n\nAccount email (please keep if correct, otherwise update): YOUR ACCOUNT EMAIL HERE\n\nConsent I am withdrawing:\n  • Marketing emails\n  • Marketing SMS\n  • Senior operational SMS check-ins (if applicable)\n  • Other (describe): \n\nIf any processing can continue without consent (for example, billing records required by law or necessary for the performance of a contract), please identify that processing.\n\nThank you.",
    hint: "Revoke previously granted consent categories.",
  },
  other: {
    label: "Other privacy request",
    subject: "Privacy request — Other",
    body:
      "To Whom It May Concern at Warm-Hello,\n\nI am submitting the following privacy-related request or question.\n\nAccount email (if applicable): YOUR ACCOUNT EMAIL HERE\n\nRequest / question:\n  • Please describe your privacy request or question here.\n\nThank you.",
    hint: "Any other privacy matter.",
  },
};

function buildMailto(kind: PrivacyRequestKind, subscriberEmail: string) {
  const tpl = PRIVACY_REQUEST_TEMPLATES[kind];
  const subject = encodeURIComponent(tpl.subject);
  const body = encodeURIComponent(
    tpl.body.replaceAll("YOUR ACCOUNT EMAIL HERE", subscriberEmail || "you@example.com"),
  );
  return `mailto:${PRIVACY_CONTACT_EMAIL}?subject=${subject}&body=${body}`;
}

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
            Deleting your account will <strong>terminate access to the Service</strong>.{" "}
            Certain information may be retained where required or permitted by law,
            including transaction records, tax records, security and
            fraud-prevention records, and other legal records required for
            compliance, billing integrity, or legal defense. Your senior, contact,
            check-in, and SMS log records will be anonymized or removed on a
            best-effort basis within the applicable statutory retention windows.
            This action cannot be undone.
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

      <section
        style={{
          marginTop: 24,
          padding: 16,
          border: "1px solid var(--border)",
          borderRadius: 12,
          background: "rgba(255,255,255,0.02)",
        }}
      >
        <h3 style={{ marginTop: 0, marginBottom: 4, fontSize: 16 }}>
          Submit a privacy request in writing
        </h3>
        <p className="section-meta" style={{ marginTop: 0, marginBottom: 16 }}>
          Send your request directly to{" "}
          <a
            href={`mailto:${PRIVACY_CONTACT_EMAIL}?subject=Privacy%20request`}
            className="inline-link"
          >
            {PRIVACY_CONTACT_EMAIL}
          </a>
          . Written privacy requests are responded to within 30 days per PIPEDA and
          applicable U.S. state privacy laws. Click any tile below to open a
          pre-drafted email for the category that best matches your request.
        </p>
        <div
          className="privacy-request-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 10,
          }}
        >
          {(Object.keys(PRIVACY_REQUEST_TEMPLATES) as PrivacyRequestKind[]).map((kind) => {
            const tpl = PRIVACY_REQUEST_TEMPLATES[kind];
            const href = buildMailto(kind, subscriberEmail);
            return (
              <a
                key={kind}
                href={href}
                className="privacy-request-tile"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  padding: 12,
                  borderRadius: 10,
                  border: "1px solid var(--border)",
                  textDecoration: "none",
                  color: "var(--text)",
                  background: "rgba(255,255,255,0.03)",
                }}
              >
                <strong style={{ fontSize: 13 }}>{tpl.label}</strong>
                <span className="section-meta" style={{ fontSize: 12 }}>
                  {tpl.hint}
                </span>
              </a>
            );
          })}
        </div>
      </section>

      <p style={{ marginTop: 16, fontSize: 13, color: "var(--muted)" }}>
        You may also request access, correction, deletion, or data portability in
        writing via{" "}
        <a
          href={`mailto:${PRIVACY_CONTACT_EMAIL}?subject=PIPEDA%20Privacy%20Request`}
          className="inline-link"
        >
          {PRIVACY_CONTACT_EMAIL}
        </a>
        . Or start a 1-click export above to download the full JSON export of your
        account data immediately.
      </p>

      {status ? <p style={{ marginTop: 14 }}>{status}</p> : null}
    </section>
  );
}
