export type IntegrationStatus = {
  database: boolean;
  stripe: boolean;
  sms: boolean;
  email: boolean;
  qstash: boolean;
};

export type DashboardSnapshot = {
  subscriberName: string;
  subscriberEmail: string;
  subscriberPhone: string;
  subscriptionStatus: string;
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
};

export type CheckInPageData = {
  token: string;
  seniorName: string;
  scheduledLabel: string;
  status: "pending" | "confirmed" | "expired";
  confirmedLabel?: string;
};

export const demoDashboard: DashboardSnapshot = {
  subscriberName: "Caregiver Demo",
  subscriberEmail: "caregiver@example.com",
  subscriberPhone: "+15551230001",
  subscriptionStatus: "Trial",
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
  escalationPolicy: "Reminder after 60 minutes, contact alerts after another 60 minutes.",
  integrationStatus: {
    database: false,
    stripe: false,
    sms: false,
    email: false,
    qstash: false,
  },
};

export const demoCheckIn: CheckInPageData = {
  token: "demo-token",
  seniorName: "Margaret",
  scheduledLabel: "Today at 9:00 AM",
  status: "pending",
};
