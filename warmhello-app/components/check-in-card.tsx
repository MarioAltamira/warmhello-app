"use client";

import { useState } from "react";

type CheckInCardProps = {
  token: string;
  seniorName: string;
  scheduledLabel: string;
  status: "pending" | "confirmed" | "expired";
  confirmedLabel?: string;
  returnHref?: string;
};

export function CheckInCard({
  token,
  seniorName,
  scheduledLabel,
  status,
  confirmedLabel,
  returnHref = "/dashboard",
}: CheckInCardProps) {
  const returnToMessagesHref = "sms:+16892258343";
  const [message, setMessage] = useState(
    status === "confirmed"
      ? `Already confirmed${confirmedLabel ? ` on ${confirmedLabel}` : ""}.`
      : status === "expired"
        ? "This link is expired."
        : "Tap one button below to complete today's check-in.",
  );
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(status === "confirmed");

  async function handleConfirm(mode: "okay" | "call_me") {
    setSubmitting(true);

    try {
      const response = await fetch(`/api/checkins/${token}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      const data = (await response.json()) as { ok: boolean; message: string };
      setMessage(data.message);
      if (data.ok) {
        setConfirmed(true);
      }
    } catch {
      setMessage("We could not confirm the check-in right now.");
    } finally {
      setSubmitting(false);
    }
  }

  const disabled = status !== "pending" || submitting;
  const errorMessage = message.includes("could not") || message.includes("expired");
  const callRequested = confirmed && message.toLowerCase().includes("call");

  function handleBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
    } else if (typeof window !== "undefined") {
      window.location.assign(returnHref);
    }
  }

  return (
    <>
      <section className="card checkin-card">
        <p className="eyebrow">Secure Daily Check-In</p>
        <h1>Hi {seniorName}</h1>
        <p>
          Your scheduled check-in window is <strong>{scheduledLabel}</strong>.
        </p>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 8 }}>
          <button className="button primary" disabled={disabled} onClick={() => handleConfirm("okay")}>
            {submitting ? "Confirming..." : "I am okay"}
          </button>
          <button
            className="button"
            disabled={disabled}
            onClick={() => handleConfirm("call_me")}
            style={{
              backgroundColor: "rgb(34, 197, 94)",
              color: "white",
              border: "1px solid rgb(22, 163, 74)",
            }}
          >
            {submitting ? "Requesting call..." : "Call me"}
          </button>
        </div>
        <p
          className={`checkin-status ${errorMessage ? "error" : "success"}`}
          style={{
            marginTop: 16,
            color: callRequested ? "rgb(22, 163, 74)" : undefined,
            fontWeight: callRequested ? 600 : undefined,
          }}
        >
          {message}
        </p>
        {confirmed ? (
          <a
            className="button secondary"
            href={returnToMessagesHref}
            style={{ marginTop: 16 }}
          >
            Return to Messages
          </a>
        ) : null}
      </section>
      <button
        type="button"
        onClick={handleBack}
        aria-label="Return"
        style={{
          position: "fixed",
          right: 24,
          bottom: 24,
          padding: "12px 20px",
          borderRadius: 999,
          border: "none",
          cursor: "pointer",
          fontWeight: 500,
          fontSize: 16,
          backgroundColor: "rgb(147, 197, 253)",
          color: "rgb(30, 64, 175)",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.25)",
          zIndex: 50,
        }}
      >
        Return
      </button>
    </>
  );
}
