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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    fetch("/api/plan/me", { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) {
          return { ok: true, loggedIn: false, loginHref: protectAuthHref } as PlanResponse;
        }
        try {
          return (await res.json()) as PlanResponse;
        } catch {
          return { ok: true, loggedIn: false, loginHref: protectAuthHref } as PlanResponse;
        }
      })
      .then((data) => {
        clearTimeout(timeoutId);
        if (!mounted) return;
        if (!data || !data.ok) {
          setPlan({ ok: true, loggedIn: false, loginHref: protectAuthHref });
          return;
        }
        setPlan(data);
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        if (!mounted) return;
        const isAbort =
          typeof DOMException !== "undefined" &&
          err instanceof DOMException &&
          err.name === "AbortError";
        if (isAbort) {
          console.warn("[SmartBuyNowButton] /api/plan/me timed out after 12s; treating as guest.");
        }
        setPlan({ ok: true, loggedIn: false, loginHref: protectAuthHref });
      });

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      try {
        controller.abort();
      } catch {
        /* noop */
      }
    };
  }, []);

  if (!plan || !plan.ok) {
    return (
      <button
        type="button"
        disabled
        aria-busy="true"
        className={className ?? "button buy-now-button"}
        style={{
          opacity: 0.72,
          cursor: "wait",
          pointerEvents: "none",
        }}
        title="Loading…"
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

  if (
    plan.allowNavigation &&
    plan.subscribeHref &&
    plan.buyNowIntent !== "POPUP_ALREADY_SUBSCRIBED"
  ) {
    return (
      <button
        type="button"
        className={className ?? "button buy-now-button"}
        onClick={() => {
          window.location.href = plan.subscribeHref as unknown as string;
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
