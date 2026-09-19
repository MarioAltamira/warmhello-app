-- Security/optimization audit follow-up fixes (2026-09-10):
--   1. Add indexes on remaining Subscriber columns used in WHERE/ORDER BY by
--      background jobs and admin reports (subscriptionStartedAt,
--      cancellationRequestedAt, cancellationDate).
-- Idempotent: safe to re-run.

CREATE INDEX IF NOT EXISTS "Subscriber_subscriptionStartedAt_idx" ON public."Subscriber"("subscriptionStartedAt");
CREATE INDEX IF NOT EXISTS "Subscriber_cancellationRequestedAt_idx" ON public."Subscriber"("cancellationRequestedAt");
CREATE INDEX IF NOT EXISTS "Subscriber_cancellationDate_idx" ON public."Subscriber"("cancellationDate");
