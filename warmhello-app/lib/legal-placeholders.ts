export const LEGAL_ENTITY_PLACEHOLDERS = {
  LEGAL_ENTITY_NAME:
    "Warm-Hello Inc. [REPLACE WITH EXACT CORPORATE NAME — e.g., 'Warm-Hello Inc., a corporation incorporated under the laws of the Province of Ontario']",
  JURISDICTION_OF_INCORPORATION:
    "the Province of Ontario, Canada [REPLACE if federally incorporated (CBCA) or another province]",
  CA_MAILING_ADDRESS:
    "[REPLACE WITH OFFICIAL CANADIAN MAILING ADDRESS FOR CASL — Example: 53 Lancewood Cres, Brampton ON L6S 5Y5, Canada]",
  SUPPORT_EMAIL: "sales@warm-hello.com",
  GST_HST_REGISTRATION_NUMBER:
    "[REPLACE WITH YOUR 9-DIGIT BN + RT0001 GST/HST NUMBER — Example: 123456789 RT0001]",
  DATA_RESIDENCY_DISCLOSURE_REQUIRED: true as const,
  DATA_PROCESSING_COUNTRIES: [
    "United States of America (Supabase — database at rest in AWS us-east-2 Ohio; Stripe payment processing)",
    "Canada [REPLACE/ADD if you add a CA-region backup or CDN endpoint]",
  ],
  CHECKIN_LOGS_RETENTION_MONTHS: 24,
  BILLING_LOGS_RETENTION_YEARS: 7,
  SMS_CONSENT_RECORDS_RETENTION_YEARS: 6,
  CASL_CONSENT_MECHANISM:
    "Caregiver explicit clickwrap authorization checkbox during account setup + senior first-SMS STOP/HELP/START identity welcome confirmation",
  SUBSCRIBER_CONTACT_FOR_DELETION:
    "sales@warm-hello.com OR Dashboard → Settings → Delete My Account (1-click if signed in)",
  DAYS_TO_RESPOND_IAR: 30,
};

export type LegalEntityPlaceholders = typeof LEGAL_ENTITY_PLACEHOLDERS;
