"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type BuyNowIntent =
  | "BUY_NOW"
  | "POPUP_ALREADY_SUBSCRIBED"
  | "POPUP_HAS_TIME_REMAINING";

type BuyNowButtonProps = {
  subscriberId: string;
  intent: BuyNowIntent;
  timeRemainingLabel?: string | null;
  className?: string;
  label?: string;
};

export function BuyNowButton(props: BuyNowButtonProps) {
  const router = useRouter();
  const [showPopup, setShowPopup] = useState(false);
  const [popupTitle, setPopupTitle] = useState("");
  const [popupBody, setPopupBody] = useState("");

  useEffect(() => {
    if (!showPopup) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setShowPopup(false);
    }
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [showPopup]);

  function handleClick() {
    // Intentionally disabled popup for "has time remaining on canceled plan" or "buy now" / trial users
    // Only show popup for PAID ACTIVE subscribers to prevent double-charging.
    if (props.intent === "POPUP_ALREADY_SUBSCRIBED") {
      setPopupTitle("You are already subscribed");
      setPopupBody(
        "Your Warm-Hello subscription is active and billing is configured. If you need assistance, reach out any time at sales@warm-hello.com.",
      );
      setShowPopup(true);
      return;
    }

    router.push(`/subscribe/${encodeURIComponent(props.subscriberId)}`);
  }

  return (
    <>
      <button
        type="button"
        className={props.className ?? "button buy-now-button"}
        onClick={handleClick}
      >
        {props.label ?? "Buy Now"}
      </button>

      {showPopup ? (
        <div
          className="modal-backdrop"
          onClick={() => setShowPopup(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="buy-now-popup-title"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 60,
          }}
        >
          <div
            className="card"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: 440,
              width: "100%",
              boxShadow: "0 30px 80px rgba(15, 23, 42, 0.35)",
              borderRadius: 18,
            }}
          >
            <p className="eyebrow">Warm-Hello</p>
            <h2 id="buy-now-popup-title">{popupTitle}</h2>
            <p
              className="lede"
              style={{ marginTop: 12 }}
            >
              {popupBody}
            </p>
            <div
              className="actions"
              style={{
                marginTop: 20,
                justifyContent: "flex-end",
              }}
            >
              <button
                type="button"
                className="button primary"
                onClick={() => setShowPopup(false)}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function formatPopupEndsAt(_isoOrDate?: string | Date | null) {
  return null;
}
const _unused = formatPopupEndsAt;
void _unused;

export default BuyNowButton;
