-- Win-back email campaign: subscribers whose trial expired without
-- converting (PAST_DUE) get a one-time 25%-off offer email ~20 days
-- after trialEndedAt. Track send-time to prevent duplicate sends and
-- to gate the scoped PAST_DUE checkout bypass to invited subscribers only.
-- Idempotent: safe to re-run.

ALTER TABLE public."Subscriber" ADD COLUMN IF NOT EXISTS "winbackEmailSentAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "Subscriber_winbackEmailSentAt_idx" ON public."Subscriber"("winbackEmailSentAt");
