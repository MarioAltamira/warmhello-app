import type { SubscriptionStatus } from "@prisma/client";

const TRIAL_LENGTH_DAYS = 7;

export type BuyNowIntent =
  | "BUY_NOW"
  | "POPUP_ALREADY_SUBSCRIBED"
  | "POPUP_HAS_TIME_REMAINING";

export type SubscriberPlanSummary = {
  isPaidSubscriber: boolean;
  isFreeTrial: boolean;
  isTrialExpired: boolean;
  showBuyNow: boolean;
  trialEndsAt: Date;
  periodEndsAt: Date;
  periodHasExpired: boolean;
  statusLabel: string;
  buyNowIntent: BuyNowIntent;
  timeRemainingLabel: string | null;
};

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function buildTimeRemainingLabel(now: Date, endsAt: Date) {
  const msRemaining = endsAt.getTime() - now.getTime();
  if (msRemaining <= 0) {
    return null;
  }

  const totalSeconds = Math.floor(msRemaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days} day${days === 1 ? "" : "s"}`);
  if (hours > 0) parts.push(`${hours} hour${hours === 1 ? "" : "s"}`);
  if (parts.length === 0 && minutes > 0) {
    parts.push(`${minutes} minute${minutes === 1 ? "" : "s"}`);
  }
  if (parts.length === 0) {
    parts.push("less than a minute");
  }

  return parts.join(" and ");
}

export function getSubscriberPlanSummary(input: {
  created: Date;
  subscriptionStatus: SubscriptionStatus;
  currentPeriodEndsAt?: Date | null;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const createdPlus7 = addDays(input.created, TRIAL_LENGTH_DAYS);
  const explicitEnd = input.currentPeriodEndsAt ?? null;

  let trialEndsAt: Date;
  if (input.subscriptionStatus === "TRIAL" && explicitEnd) {
    trialEndsAt = explicitEnd.getTime() > createdPlus7.getTime() ? explicitEnd : createdPlus7;
  } else {
    trialEndsAt = createdPlus7;
  }

  const isFreeTrial = input.subscriptionStatus === "TRIAL";
  const isTrialExpired = isFreeTrial && trialEndsAt.getTime() <= now.getTime();
  const isPaidSubscriber = input.subscriptionStatus === "ACTIVE";

  let periodEndsAt: Date;
  if (explicitEnd) {
    periodEndsAt = explicitEnd;
  } else if (isPaidSubscriber || input.subscriptionStatus === "CANCELED") {
    periodEndsAt = trialEndsAt;
  } else {
    periodEndsAt = trialEndsAt;
  }
  const periodHasExpired = periodEndsAt.getTime() <= now.getTime();
  const timeRemainingLabel = periodHasExpired
    ? null
    : buildTimeRemainingLabel(now, periodEndsAt);

  let buyNowIntent: BuyNowIntent = "BUY_NOW";
  if (input.subscriptionStatus === "ACTIVE") {
    buyNowIntent = "POPUP_ALREADY_SUBSCRIBED";
  } else if (input.subscriptionStatus === "CANCELED" && !periodHasExpired) {
    buyNowIntent = "POPUP_HAS_TIME_REMAINING";
  }

  let statusLabel = input.subscriptionStatus
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  if (isTrialExpired) {
    statusLabel = "Trial Period Is Over";
  } else if (isFreeTrial) {
    statusLabel = "Free Trial";
  }

  return {
    isPaidSubscriber,
    isFreeTrial,
    isTrialExpired,
    showBuyNow: true,
    trialEndsAt,
    periodEndsAt,
    periodHasExpired,
    statusLabel,
    buyNowIntent,
    timeRemainingLabel,
  } satisfies SubscriberPlanSummary;
}
