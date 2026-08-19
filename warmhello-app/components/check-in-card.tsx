"use client";

import Image from "next/image";
import { useState } from "react";

type CheckInCardProps = {
  token: string;
  seniorName: string;
  scheduledLabel: string;
  status: "pending" | "confirmed" | "expired";
  confirmedLabel?: string;
  isPreview?: boolean;
};

const RETURN_TO_MESSAGES_HREF = "sms:+16892258343";

export function CheckInCard({
  token,
  seniorName,
  scheduledLabel,
  status,
  confirmedLabel,
  isPreview = false,
}: CheckInCardProps) {
  const [message, setMessage] = useState(
    status === "confirmed"
      ? `Already confirmed${confirmedLabel ? ` on ${confirmedLabel}` : ""}.`
      : status === "expired"
        ? "This link is expired."
        : "Tap one button above to complete today's check-in.",
  );
  const [submittingOkay, setSubmittingOkay] = useState(false);
  const [submittingCall, setSubmittingCall] = useState(false);
  const [confirmed, setConfirmed] = useState(status === "confirmed");

  async function handleConfirm(mode: "okay" | "call_me") {
    if (mode === "okay") setSubmittingOkay(true);
    if (mode === "call_me") setSubmittingCall(true);

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
      setSubmittingOkay(false);
      setSubmittingCall(false);
    }
  }

  const anySubmitting = submittingOkay || submittingCall;
  const disabledOkay = status !== "pending" || anySubmitting;
  const disabledCall = status !== "pending" || anySubmitting;
  const errorMessage = message.includes("could not") || message.includes("expired");
  const callRequested = confirmed && message.toLowerCase().includes("call");
  const isSmsFlow = !isPreview;

  return (
    <section className="card checkin-card">
      {isSmsFlow ? (
        <div style={{ marginBottom: 8 }}>
          <Image
            src="/warmhello-logo-b.png"
            alt="Warm-Hello"
            width={220}
            height={55}
            priority
          />
        </div>
      ) : null}
      <p className="eyebrow">Secure Daily Check-In</p>
      <h1>Hi {seniorName}</h1>
      <p>
        Your scheduled check-in window is <strong>{scheduledLabel}</strong>.
      </p>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 8 }}>
        <button className="button primary" disabled={disabledOkay} onClick={() => handleConfirm("okay")}>
          {submittingOkay ? "Confirming..." : "I am okay"}
        </button>
        <button
          className="button"
          disabled={disabledCall}
          onClick={() => handleConfirm("call_me")}
          style={{
            backgroundColor: "rgb(34, 197, 94)",
            color: "white",
            border: "1px solid rgb(22, 163, 74)",
          }}
        >
          {submittingCall ? "Requesting call..." : "Call me"}
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
      {isSmsFlow ? (
        <a
          className="button secondary"
          href={RETURN_TO_MESSAGES_HREF}
          style={{ marginTop: 24 }}
        >
          Return to Messages
        </a>
      ) : null}
    </section>
  );
}
