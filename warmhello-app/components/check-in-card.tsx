"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

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

  useEffect(() => {
    try { document.body.style.paddingTop = "0px"; } catch {}
    try { document.documentElement.style.scrollPaddingTop = "0px"; } catch {}
    if (!isSmsFlow) return undefined;
    function isBlocked(next: string | URL | null | undefined): boolean {
      if (!next) return false;
      try {
        const u = new URL(String(next), window.location.origin);
        if (u.origin !== window.location.origin) return false;
        const p = u.pathname;
        if (p.startsWith("/checkin/") || p.startsWith("/s/") || p.startsWith("/api/") || p === "/") return false;
        return true;
      } catch {
        return false;
      }
    }
    function onPop(e: PopStateEvent) {
      void e;
      if (isBlocked(window.location.pathname + window.location.search + window.location.hash)) {
        try { window.stop?.(); } catch {}
      }
    }
    const origPush = window.history.pushState;
    const origRepl = window.history.replaceState;
    try {
      window.history.pushState = function (a: unknown, b: string, c?: unknown) {
        if (c != null && isBlocked(c as string | URL | null)) {
          if (typeof console !== "undefined") console.warn("[checkin] blocked SPA pushState", String(c));
          return null as unknown as void;
        }
        return origPush.call(this, a, b, c as string | URL | null | undefined);
      };
    } catch {}
    try {
      window.history.replaceState = function (a: unknown, b: string, c?: unknown) {
        if (c != null && isBlocked(c as string | URL | null)) {
          if (typeof console !== "undefined") console.warn("[checkin] blocked SPA replaceState", String(c));
          return null as unknown as void;
        }
        return origRepl.call(this, a, b, c as string | URL | null | undefined);
      };
    } catch {}
    window.addEventListener("popstate", onPop, { capture: true });
    return () => {
      try { window.history.pushState = origPush; } catch {}
      try { window.history.replaceState = origRepl; } catch {}
      window.removeEventListener("popstate", onPop, { capture: true } as AddEventListenerOptions);
    };
  }, [isSmsFlow]);

  return (
    <section className="card checkin-card">
      <div style={{ marginBottom: 18 }}>
        <Image
          src="/warmhello-logo-b.png"
          alt="Warm-Hello"
          width={220}
          height={55}
          priority
          className="checkin-card-logo"
        />
      </div>
      <p className="checkin-eyebrow">Secure Daily Check-In</p>
      <h1 className="checkin-hi">Hi {seniorName}</h1>
      <p className="checkin-scheduled">
        Your scheduled check-in window is <strong>{scheduledLabel}</strong>.
      </p>
      <div className="checkin-actions">
        <button
          className="checkin-btn checkin-btn-okay"
          disabled={disabledOkay}
          onClick={() => handleConfirm("okay")}
        >
          {submittingOkay ? "Confirming..." : "I am okay"}
        </button>
        <button
          className="checkin-btn checkin-btn-call"
          disabled={disabledCall}
          onClick={() => handleConfirm("call_me")}
        >
          {submittingCall ? "Requesting call..." : "Call me"}
        </button>
      </div>
      <p
        className={`checkin-status ${errorMessage ? "error" : "success"} ${callRequested ? "callRequested" : ""}`}
      >
        {message}
      </p>
      {isSmsFlow ? (
        <a className="checkin-return" href={RETURN_TO_MESSAGES_HREF}>
          Return to Messages
        </a>
      ) : null}
    </section>
  );
}
