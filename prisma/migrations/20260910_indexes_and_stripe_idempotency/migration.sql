-- Security/optimization audit fixes (2026-09-10):
--   1. Add missing indexes on foreign-key columns that were doing full table
--      scans (Senior.subscriberId, Contact.subscriberId/seniorId,
--      CheckIn.subscriberId/(seniorId,scheduledFor), AlertJob.checkInId).
--   2. Add ProcessedStripeEvent table so Stripe webhook handling can be made
--      idempotent (dedupe on event.id before applying state-changing writes).
-- Idempotent: safe to re-run.

CREATE INDEX IF NOT EXISTS "Senior_subscriberId_idx" ON public."Senior"("subscriberId");

CREATE INDEX IF NOT EXISTS "Contact_subscriberId_idx" ON public."Contact"("subscriberId");
CREATE INDEX IF NOT EXISTS "Contact_seniorId_idx" ON public."Contact"("seniorId");

CREATE INDEX IF NOT EXISTS "CheckIn_subscriberId_idx" ON public."CheckIn"("subscriberId");
CREATE INDEX IF NOT EXISTS "CheckIn_seniorId_scheduledFor_idx" ON public."CheckIn"("seniorId", "scheduledFor");

CREATE INDEX IF NOT EXISTS "AlertJob_checkInId_idx" ON public."AlertJob"("checkInId");

CREATE TABLE IF NOT EXISTS "ProcessedStripeEvent" (
  "id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProcessedStripeEvent_pkey" PRIMARY KEY ("id")
);
