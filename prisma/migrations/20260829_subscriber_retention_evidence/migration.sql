DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'BillingInterval') THEN
    CREATE TYPE "BillingInterval" AS ENUM ('MONTHLY', 'ANNUAL');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CancellationStatus') THEN
    CREATE TYPE "CancellationStatus" AS ENUM ('NONE', 'PENDING_AT_PERIOD_END', 'CANCELED');
  END IF;
END $$;

ALTER TABLE "Subscriber" ADD COLUMN IF NOT EXISTS "billingInterval" "BillingInterval" NOT NULL DEFAULT 'MONTHLY';
ALTER TABLE "Subscriber" ADD COLUMN IF NOT EXISTS "subscriptionPriceAmount" DECIMAL(10,2);
ALTER TABLE "Subscriber" ADD COLUMN IF NOT EXISTS "nextRenewalDate" TIMESTAMP(3);
ALTER TABLE "Subscriber" ADD COLUMN IF NOT EXISTS "trialStartedAt" TIMESTAMP(3);
ALTER TABLE "Subscriber" ADD COLUMN IF NOT EXISTS "trialEndedAt" TIMESTAMP(3);
ALTER TABLE "Subscriber" ADD COLUMN IF NOT EXISTS "subscriptionStartedAt" TIMESTAMP(3);
ALTER TABLE "Subscriber" ADD COLUMN IF NOT EXISTS "cancellationStatus" "CancellationStatus" NOT NULL DEFAULT 'NONE';
ALTER TABLE "Subscriber" ADD COLUMN IF NOT EXISTS "cancellationDate" TIMESTAMP(3);
ALTER TABLE "Subscriber" ADD COLUMN IF NOT EXISTS "cancellationRequestedAt" TIMESTAMP(3);
ALTER TABLE "Subscriber" ADD COLUMN IF NOT EXISTS "privacyAcknowledgedAt" TIMESTAMP(3);
ALTER TABLE "Subscriber" ADD COLUMN IF NOT EXISTS "operationalSmsConsentGrantedAt" TIMESTAMP(3);
ALTER TABLE "Subscriber" ADD COLUMN IF NOT EXISTS "subscriptionTermsDisclosureVer" TEXT;

ALTER TABLE "Subscriber" ALTER COLUMN "tosVersion" SET DEFAULT 'v2026-08-29';
ALTER TABLE "Subscriber" ALTER COLUMN "privacyPolicyVersion" SET DEFAULT 'v2026-08-29';
