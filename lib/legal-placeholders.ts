export const LEGAL_ENTITY_PLACEHOLDERS = {
  LEGAL_ENTITY_NAME:
    '10894796 Canada Inc., a corporation incorporated under the federal laws of Canada, doing business as "Warm-Hello"',
  JURISDICTION_OF_INCORPORATION:
    "the federal laws of Canada (CBCA)",
  CA_MAILING_ADDRESS:
    "53 Lancewood Cres, Brampton, Ontario, Canada, L6S 5Y5",
  SUPPORT_EMAIL: "sales@warm-hello.com",
  GST_HST_REGISTRATION_NUMBER:
    "831746540RT0001",
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
