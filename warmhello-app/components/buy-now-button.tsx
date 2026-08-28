"use client";

import { useRouter } from "next/navigation";

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
  // Popup behavior is intentionally disabled (removed) for all intents.
  // Header banner Buy Now and dashboard bottom Buy Now always navigate
  // directly to /subscribe/<subscriberId> so the user can choose plan/billing.
  void props.intent;
  void props.timeRemainingLabel;

  function handleClick() {
    router.push(`/subscribe/${encodeURIComponent(props.subscriberId)}`);
  }

  return (
    <button
      type="button"
      className={props.className ?? "button buy-now-button"}
      onClick={handleClick}
    >
      {props.label ?? "Buy Now"}
    </button>
  );
}

function formatPopupEndsAt(_isoOrDate?: string | Date | null) {
  return null;
}

const _unused = formatPopupEndsAt;
void _unused;

export default BuyNowButton;
