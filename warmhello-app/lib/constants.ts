import { LEGAL_ENTITY_PLACEHOLDERS } from "@/lib/legal-placeholders";

const ENTITY = LEGAL_ENTITY_PLACEHOLDERS.LEGAL_ENTITY_NAME;

export const LEGAL_DISCLAIMER_UNIVERSAL =
  `IMPORTANT NOTICE: Warm-Hello is an automated text-messaging notification utility operated by ${ENTITY} to facilitate routine check-ins between individuals and their designated personal contacts. WARM-HELLO IS NOT A MEDICAL ALERT SYSTEM, PERSONAL EMERGENCY RESPONSE SYSTEM (PERS), OR EMERGENCY DISPATCH SERVICE. Warm-Hello does not monitor for health conditions, contact emergency services (e.g., 911), or replace professional caregiving. Delivery of SMS notifications relies on third-party telecommunication providers and cannot be guaranteed. In an emergency, dial 911 or contact local emergency services immediately.` as const;

export const LEGAL_DISCLAIMER_CONDENSED =
  "Warm-Hello is NOT a 911 / medical alert service. SMS delivery is not guaranteed. In an emergency, call 911 or your local emergency number immediately." as const;

export const TOS_VERSION_CURRENT = "v2026-08-29" as const;
export const PRIVACY_VERSION_CURRENT = "v2026-08-29" as const;

export const CLICKWRAP_PAID_CHECKOUT_LABEL =
  "I agree to the Terms of Service and acknowledge the Privacy Policy. I confirm that I am authorized to provide the senior's contact details, and I understand Warm-Hello is NOT a medical alert system or emergency 911 dispatch service." as const;

export const CLICKWRAP_SENIOR_ADD_LABEL =
  "I confirm that I have authorization to enroll this person and provide their contact information to Warm-Hello. I also understand Warm-Hello is NOT a medical alert system or emergency 911 dispatch service." as const;

export const CLICKWRAP_SENIOR_ADD_AUTHORIZATION_LABEL =
  "I confirm that I have authorization to enroll this person and provide their contact information to Warm-Hello." as const;

export const CLICKWRAP_SENIOR_SMS_OPERATIONAL_LABEL =
  "Senior SMS Check-In Consent — I confirm that I have authorization from this person to provide their mobile number to Warm-Hello and to receive Warm-Hello check-in messages and operational notifications. Message and data rates may apply. Message frequency varies. Reply STOP to opt out and HELP for help." as const;

export const CLICKWRAP_MARKETING_EMAIL_LABEL =
  "Yes, I'd like to receive occasional promotional emails and offers from Warm-Hello. I can unsubscribe at any time." as const;

export const PAID_RENEWAL_MEDIALINE =
  "Recurring subscription: Your subscription will automatically renew at the selected billing interval unless cancelled before the next renewal date. You will be charged the applicable subscription price plus applicable taxes at each renewal." as const;

export const FREE_TRIAL_DOES_NOT_AUTO_CONVERT =
  "The 7-day free trial does not automatically convert to a paid subscription. At the end of your trial, you must actively choose a plan and complete checkout to continue using Warm-Hello." as const;

export const CPA_AUTO_RENEW_BULLETS = [
  "FREE TRIAL DOES NOT AUTOMATICALLY CONVERT. At the end of the 7-day trial you must actively select a plan and complete checkout — no card is charged at trial end.",
  "PAID SUBSCRIPTIONS ARE RECURRING. Once you actively purchase a paid plan, you will be billed automatically at the start of each new billing term at the then-current subscription price plus applicable taxes, unless you cancel ≥48 HOURS BEFORE the next renewal date.",
  "Cancel ANYTIME from Dashboard → Settings → Subscription. No phone calls, no emails, no cancellation fees.",
  "Annual plans: Renewal reminder email sent 14 days before the next renewal.",
] as const;

export const EMERGENCY_WARNING_ONBOARDING =
  "Warm-Hello is not an emergency service. A missed check-in does not necessarily mean an emergency has occurred. Warm-Hello does not contact 911 or emergency services. In an emergency, call 911." as const;

export const EMERGENCY_WARNING_DASHBOARD =
  "Not an emergency service. Call 911 in an emergency." as const;

export const EMERGENCY_WARNING_SENIOR_SETUP =
  "Warm-Hello is a routine check-in service and does not replace emergency, medical, or caregiving services." as const;

export const NON_EMERGENCY_POSITIONING_LINE =
  "Warm-Hello is not an emergency monitoring or medical alert service." as const;

export const PRIVACY_CHOICE_CATEGORIES = {
  necessary: {
    key: "necessary",
    title: "Strictly Necessary Cookies / Technologies",
    description:
      "Required for the Service to function: authentication, account sessions, fraud prevention, security, transaction processing, storing required privacy-choice preferences, and core functionality. These cannot be disabled because they are necessary to provide the Service.",
    alwaysOn: true,
  },
  analytics: {
    key: "analytics",
    title: "Analytics",
    description:
      "Help us understand website traffic, product usage, technical performance, conversion rates, and user journeys so we can improve the Service.",
    alwaysOn: false,
  },
  advertising: {
    key: "advertising",
    title: "Targeted Advertising",
    description:
      "Used for advertising, retargeting, conversion measurement, campaign attribution, and audience measurement across third-party platforms.",
    alwaysOn: false,
  },
  saleSharing: {
    key: "saleSharing",
    title: "Sale / Sharing of Personal Information",
    description:
      "Under CCPA and similar U.S. state laws, disclosing personal information to third parties for cross-context behavioral advertising may be considered a 'sale' or 'sharing' of personal information. Opting out instructs us not to engage in such processing where applicable.",
    alwaysOn: false,
  },
} as const;

export const PRIVACY_CHOICES_FOOTER_LINK = "Your Privacy Choices" as const;
export const PRIVACY_CHOICES_SAVED_MESSAGE =
  "Your privacy choices have been saved." as const;
