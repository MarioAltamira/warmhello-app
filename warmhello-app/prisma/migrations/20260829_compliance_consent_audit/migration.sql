BEGIN;

-- 1. LegalConsentEvent enum
DO $$ BEGIN
  CREATE TYPE "LegalConsentEvent" AS ENUM (
    'TERMS_ACCEPTED',
    'PRIVACY_ACKNOWLEDGED',
    'SUBSCRIPTION_PURCHASE',
    'OPERATIONAL_SMS_OPT_IN',
    'MARKETING_SMS_OPT_IN',
    'MARKETING_EMAIL_OPT_IN',
    'SENIOR_SMS_AUTHORIZATION'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. Subscriber consent columns
ALTER TABLE "Subscriber"
  ADD COLUMN IF NOT EXISTS "privacyPolicyVersion" TEXT;
ALTER TABLE "Subscriber"
  ADD COLUMN IF NOT EXISTS "marketingEmailConsent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Subscriber"
  ADD COLUMN IF NOT EXISTS "marketingEmailConsentAt" TIMESTAMP(3);
ALTER TABLE "Subscriber"
  ADD COLUMN IF NOT EXISTS "marketingSmsConsent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Subscriber"
  ADD COLUMN IF NOT EXISTS "marketingSmsConsentAt" TIMESTAMP(3);

-- 3. Senior operational/self SMS consent columns
ALTER TABLE "Senior"
  ADD COLUMN IF NOT EXISTS "operationalSmsConsent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Senior"
  ADD COLUMN IF NOT EXISTS "operationalSmsConsentAt" TIMESTAMP(3);
ALTER TABLE "Senior"
  ADD COLUMN IF NOT EXISTS "selfSmsConsent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Senior"
  ADD COLUMN IF NOT EXISTS "selfSmsConsentAt" TIMESTAMP(3);

-- 4. LegalConsentAudit table
CREATE TABLE IF NOT EXISTS "LegalConsentAudit" (
  "id" TEXT NOT NULL,
  "subscriberId" TEXT,
  "event" "LegalConsentEvent" NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "termsVersion" TEXT,
  "privacyVersion" TEXT,
  "subscriptionPlan" "BillingCurrency",
  "billingInterval" TEXT,
  "priceAmount" DOUBLE PRECISION,
  "currency" "BillingCurrency",
  "stripeSessionId" TEXT,
  "stripeSubscriptionId" TEXT,
  "seniorPhoneNumber" TEXT,
  "phoneE164" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "LegalConsentAudit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "LegalConsentAudit_subscriberId_createdAt_idx"
  ON "LegalConsentAudit"("subscriberId", "createdAt");
CREATE INDEX IF NOT EXISTS "LegalConsentAudit_event_createdAt_idx"
  ON "LegalConsentAudit"("event", "createdAt");
CREATE INDEX IF NOT EXISTS "LegalConsentAudit_createdAt_idx"
  ON "LegalConsentAudit"("createdAt");

ALTER TABLE "LegalConsentAudit"
  ADD CONSTRAINT "LegalConsentAudit_subscriberId_fkey"
  FOREIGN KEY ("subscriberId") REFERENCES "Subscriber"("id") ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT;
