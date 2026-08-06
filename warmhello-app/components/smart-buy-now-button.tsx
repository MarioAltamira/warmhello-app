"use client";

import { useEffect, useState } from "react";
import { BuyNowButton } from "@/components/buy-now-button";
import { protectAuthHref } from "@/lib/routes";

type PlanResponse =
  | {
      ok: true;
      loggedIn: false;
      loginHref: string;
    }
  | {
      ok: true;
      loggedIn: true;
      subscriberId: string;
      buyNowIntent: "BUY_NOW" | "POPUP_ALREADY_SUBSCRIBED" | "POPUP_HAS_TIME_REMAINING";
      timeRemainingLabel: string | null;
      subscribeHref: string;
      allowNavigation: boolean;
    }
  | {
      ok: false;
      loggedIn?: boolean;
      subscriberId?: string;
      message?: string;
      loginHref?: string;
    };

type SmartBuyNowButtonProps = {
  className?: string;
  label?: string;
};

export function SmartBuyNowButton({ className, label }: SmartBuyNowButtonProps) {
  const [plan, setPlan] = useState<PlanResponse | null>(null);

  useEffect(() => {
    let mounted = true;

    fetch("/api/plan/me")
      .then(async (res) => {
        if (!res.ok) return;
        return (await res.json()) as PlanResponse;
      })
      .then((data) => {
        if (!mounted || !data) return;
        setPlan(data);
      })
      .catch(() => {
        // Fallback to a safe baseline: treat as guest.
        if (!mounted) return;
        setPlan({ ok: true, loggedIn: false, loginHref: protectAuthHref });
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (!plan || !plan.ok) {
    return (
      <button
        type="button"
        className={className ?? "button buy-now-button"}
        onClick={() => {
          window.location.href = protectAuthHref;
        }}
      >
        {label ?? "Buy Now"}
      </button>
    );
  }

  if (!plan.loggedIn) {
    return (
      <button
        type="button"
        className={className ?? "button buy-now-button"}
        onClick={() => {
          window.location.href = plan.loginHref;
        }}
      >
        {label ?? "Buy Now"}
      </button>
    );
  }

  return (
    <BuyNowButton
      subscriberId={plan.subscriberId}
      intent={plan.buyNowIntent}
      timeRemainingLabel={plan.timeRemainingLabel}
      className={className}
      label={label}
    />
  );
}

export default SmartBuyNowButton;
