"use client";

import { useState } from "react";

type CheckInCardProps = {
  token: string;
  seniorName: string;
  scheduledLabel: string;
  status: "pending" | "confirmed" | "expired";
  confirmedLabel?: string;
};

export function CheckInCard({
  token,
  seniorName,
  scheduledLabel,
  status,
  confirmedLabel,
}: CheckInCardProps) {
  const returnToMessagesHref = "sms:+16892258343";
  const [message, setMessage] = useState(
    status === "confirmed"
      ? `Already confirmed${confirmedLabel ? ` on ${confirmedLabel}` : ""}.`
      : status === "expired"
        ? "This link is expired."
        : "Tap once to confirm you are okay.",
  );
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(status === "confirmed");

  async function handleConfirm() {
    setSubmitting(true);

    try {
      const response = await fetch(`/api/checkins/${token}/confirm`, {
        method: "POST",
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

  return (
    <section className="card checkin-card">
      <p className="eyebrow">Secure Daily Check-In</p>
      <h1>Hi {seniorName}</h1>
      <p>
        Your scheduled check-in window is <strong>{scheduledLabel}</strong>.
      </p>
      <button className="button primary" disabled={disabled} onClick={handleConfirm}>
        {submitting ? "Confirming..." : "I am okay"}
      </button>
      <p className={`checkin-status ${errorMessage ? "error" : "success"}`} style={{ marginTop: 16 }}>
        {message}
      </p>
      {confirmed ? (
        <a className="button secondary" href={returnToMessagesHref} style={{ marginTop: 16 }}>
          Return to Messages
        </a>
      ) : null}
    </section>
  );
}
