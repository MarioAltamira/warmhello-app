import type { SubscriptionStatus } from "@prisma/client";

const TRIAL_LENGTH_DAYS = 7;

export type SubscriberPlanSummary = {
  isPaidSubscriber: boolean;
  isFreeTrial: boolean;
  isTrialExpired: boolean;
  showBuyNow: boolean;
  trialEndsAt: Date;
  statusLabel: string;
};

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function getSubscriberPlanSummary(input: {
  created: Date;
  subscriptionStatus: SubscriptionStatus;
}) {
  const trialEndsAt = addDays(input.created, TRIAL_LENGTH_DAYS);
  const isFreeTrial = input.subscriptionStatus === "TRIAL";
  const isTrialExpired = isFreeTrial && trialEndsAt.getTime() <= Date.now();
  const isPaidSubscriber = input.subscriptionStatus === "ACTIVE";
  const showBuyNow =
    input.subscriptionStatus === "TRIAL" ||
    input.subscriptionStatus === "PAST_DUE" ||
    input.subscriptionStatus === "CANCELED";

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
    showBuyNow,
    trialEndsAt,
    statusLabel,
  } satisfies SubscriberPlanSummary;
}
