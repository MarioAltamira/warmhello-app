-- Security/optimization audit follow-up fixes (2026-09-10):
--   1. Add index on Senior.active (queried standalone by the daily advance-day
--      cron job and admin reports without a subscriberId filter).
--   2. Add indexes on Subscriber columns used in WHERE/ORDER BY by background
--      jobs and admin reports (subscriptionStatus, currentPeriodEndsAt,
--      createdAt, trialEndedAt).
--   3. Convert LegalConsentAudit.priceAmount from Float to Decimal(10,2) to
--      avoid floating-point rounding errors in a compliance/audit table.
-- Idempotent: safe to re-run.

CREATE INDEX IF NOT EXISTS "Senior_active_idx" ON public."Senior"("active");

CREATE INDEX IF NOT EXISTS "Subscriber_subscriptionStatus_idx" ON public."Subscriber"("subscriptionStatus");
CREATE INDEX IF NOT EXISTS "Subscriber_currentPeriodEndsAt_idx" ON public."Subscriber"("currentPeriodEndsAt");
CREATE INDEX IF NOT EXISTS "Subscriber_createdAt_idx" ON public."Subscriber"("createdAt");
CREATE INDEX IF NOT EXISTS "Subscriber_trialEndedAt_idx" ON public."Subscriber"("trialEndedAt");

ALTER TABLE public."LegalConsentAudit"
  ALTER COLUMN "priceAmount" TYPE DECIMAL(10, 2) USING "priceAmount"::DECIMAL(10, 2);
