export type IntegrationStatus = {
  database: boolean;
  stripe: boolean;
  sms: boolean;
  email: boolean;
  qstash: boolean;
};

export type DashboardSnapshot = {
  subscriberId?: string;
  subscriberName: string;
  subscriberEmail: string;
  subscriberPhone: string;
  subscriptionStatus: string;
  isPaidSubscriber: boolean;
  isTrialExpired: boolean;
  showBuyNow: boolean;
  buyNowIntent: "BUY_NOW" | "POPUP_ALREADY_SUBSCRIBED" | "POPUP_HAS_TIME_REMAINING";
  periodEndsAt?: string;
  timeRemainingLabel: string | null;
  hasHousehold: boolean;
  seniorName: string;
  nextCheckInLabel: string;
  latestCheckInStatus: string;
  latestCheckInToken?: string;
  latestConfirmedLabel?: string;
  billingCustomerLabel: string;
  contacts: Array<{
    fullName: string;
    relationship: string;
    phoneNumber: string;
  }>;
  escalationPolicy: string;
  integrationStatus: IntegrationStatus;
  stripePrice: {
    displayLabel: string | null;
    expectedLabel: string;
    aligned: boolean;
    priceId: string;
  } | null;
};

export type CheckInPageData = {
  token: string;
  seniorName: string;
  scheduledLabel: string;
  status: "pending" | "confirmed" | "expired";
  confirmedLabel?: string;
};

export const demoDashboard: DashboardSnapshot = {
  subscriberId: "demo-subscriber",
  subscriberName: "Caregiver Demo",
  subscriberEmail: "caregiver@example.com",
  subscriberPhone: "+15551230001",
  subscriptionStatus: "Trial",
  isPaidSubscriber: false,
  isTrialExpired: false,
  showBuyNow: true,
  buyNowIntent: "BUY_NOW",
  timeRemainingLabel: null,
  hasHousehold: true,
  seniorName: "Margaret Johnson",
  nextCheckInLabel: "Today at 9:00 AM",
  latestCheckInStatus: "Pending",
  latestCheckInToken: "demo-token",
  billingCustomerLabel: "Stripe customer will appear after checkout.",
  contacts: [
    {
      fullName: "David Johnson",
      relationship: "Son",
      phoneNumber: "+15551230003",
    },
    {
      fullName: "Angela Rivera",
      relationship: "Neighbor",
      phoneNumber: "+15551230004",
    },
  ],
  escalationPolicy:
    "Friendly follow-up after 1 hour, then contact your trusted emergency contacts one hour after that if your loved one still hasn't confirmed they're okay.",
  integrationStatus: {
    database: false,
    stripe: false,
    sms: false,
    email: false,
    qstash: false,
  },
  stripePrice: null,
};

export const demoCheckIn: CheckInPageData = {
  token: "demo-token",
  seniorName: "Margaret",
  scheduledLabel: "Today at 9:00 AM",
  status: "pending",
};
