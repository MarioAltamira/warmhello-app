import { LEGAL_ENTITY_PLACEHOLDERS } from "@/lib/legal-placeholders";

const ENTITY = LEGAL_ENTITY_PLACEHOLDERS.LEGAL_ENTITY_NAME;

export const LEGAL_DISCLAIMER_UNIVERSAL =
  `IMPORTANT NOTICE: Warm-Hello is an automated text-messaging notification utility operated by ${ENTITY} to facilitate routine check-ins between individuals and their designated personal contacts. WARM-HELLO IS NOT A MEDICAL ALERT SYSTEM, PERSONAL EMERGENCY RESPONSE SYSTEM (PERS), OR EMERGENCY DISPATCH SERVICE. Warm-Hello does not monitor for health conditions, contact emergency services (e.g., 911), or replace professional caregiving. Delivery of SMS notifications relies on third-party telecommunication providers and cannot be guaranteed. In an emergency, dial 911 or contact local emergency services immediately.` as const;

export const LEGAL_DISCLAIMER_CONDENSED =
  "Warm-Hello is NOT a 911 / medical alert service. SMS delivery is not guaranteed. In an emergency, call 911 or your local emergency number immediately." as const;

export const TOS_VERSION_CURRENT = "v2026-08-21" as const;

export const CLICKWRAP_CHECKOUT_LABEL =
  "I agree to the Terms of Service and Privacy Policy. I confirm that I am authorized to provide the senior's contact details, and I understand Warm-Hello is NOT a medical alert system or emergency 911 dispatch service." as const;

export const CLICKWRAP_SENIOR_ADD_LABEL =
  "I confirm that I am authorized to provide this new senior's contact details, and I understand Warm-Hello is NOT a medical alert system or emergency 911 dispatch service." as const;

export const CPA_AUTO_RENEW_BULLETS = [
  "THIS IS A RECURRING SUBSCRIPTION.",
  "You will be BILLED AUTOMATICALLY: $5 USD / $6 CAD monthly OR $72 CAD annual (taxes may apply). Billing happens AT THE START of each new term UNLESS YOU CANCEL ≥48 HOURS BEFORE RENEWAL.",
  "Cancel ANYTIME with 1 click from Dashboard → Settings → Subscription. No phone calls, no emails, no cancellation fees.",
  "Annual plans: Reminder email sent 14 days before renewal.",
] as const;
