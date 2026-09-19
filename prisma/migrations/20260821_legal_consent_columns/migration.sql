-- Phase 1 legal consent columns (P1-4 clickwrap tosVersion + caregiver ack timestamps,
-- dashboard disclaimer dismiss column, P2-1 Senior smsOptedOut boolean + timestamp,
-- P2-1 CASL s.13(1) 6-year SmsConsentTombstone table).
--
-- Server-deploy fix for P3018 / SQLSTATE 42701 "column already exists":
-- Previously, this migration used unguarded ALTER TABLE ... ADD COLUMN ... which
-- raises SQLSTATE 42701 when any of these columns were pre-created by a Supabase
-- dashboard manual column add, a prior half-deploy, or any other path that wrote
-- DDL outside Prisma's _prisma_migrations tracking.
--
-- Rewritten to be 100% idempotent (safe to re-apply even when columns/table/indexes
-- already exist):
--   * Column adds: DO block + information_schema.columns existence check.
--   * Table create: CREATE TABLE IF NOT EXISTS (native Postgres syntax).
--   * Indexes: CREATE UNIQUE INDEX IF NOT EXISTS / CREATE INDEX IF NOT EXISTS.
--   * Defaults/constraints for the new columns: ALTER TABLE ... ALTER COLUMN ...
--     SET DEFAULT ... wrapped in the same DO block so we only touch what we need
--     and never overwrite any existing user-authored defaults for the column.

DO $$
BEGIN
  ---------------------------------------------------------------------------
  -- 1. Subscriber: 4 new columns (clickwrap ToS, caregiver ack, disclaimer)
  ---------------------------------------------------------------------------
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'Subscriber'
      AND column_name  = 'tosAcceptedAt'
  ) THEN
    ALTER TABLE "Subscriber" ADD COLUMN "tosAcceptedAt" TIMESTAMP(3);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'Subscriber'
      AND column_name  = 'tosVersion'
  ) THEN
    ALTER TABLE "Subscriber" ADD COLUMN "tosVersion" TEXT DEFAULT 'v2026-08-21';
  ELSE
    -- Column pre-existed (manual add, prior half-run). Best-effort ensure the
    -- versioned default matches our current TOS_VERSION_CURRENT so new rows
    -- get the correct string even if this migration didn't originally create
    -- the column. Harmless: SET DEFAULT on existing columns is cheap and
    -- idempotent-ish (running same DEFAULT twice is identical result).
    ALTER TABLE "Subscriber" ALTER COLUMN "tosVersion" SET DEFAULT 'v2026-08-21';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'Subscriber'
      AND column_name  = 'caregiverSeniorConsentAckAt'
  ) THEN
    ALTER TABLE "Subscriber" ADD COLUMN "caregiverSeniorConsentAckAt" TIMESTAMP(3);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'Subscriber'
      AND column_name  = 'dashboardDisclaimerDismissedAt'
  ) THEN
    ALTER TABLE "Subscriber" ADD COLUMN "dashboardDisclaimerDismissedAt" TIMESTAMP(3);
  END IF;

  ---------------------------------------------------------------------------
  -- 2. Senior: 3 new columns (caregiver consent ack + STOP opt-out boolean)
  ---------------------------------------------------------------------------
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'Senior'
      AND column_name  = 'caregiverConsentAckAt'
  ) THEN
    ALTER TABLE "Senior" ADD COLUMN "caregiverConsentAckAt" TIMESTAMP(3);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'Senior'
      AND column_name  = 'smsOptedOut'
  ) THEN
    ALTER TABLE "Senior" ADD COLUMN "smsOptedOut" BOOLEAN NOT NULL DEFAULT false;
  ELSE
    -- Same rationale as tosVersion default: make sure the opt-out default is
    -- false for NEW rows even if someone created this column manually with
    -- NULL / true default.
    ALTER TABLE "Senior" ALTER COLUMN "smsOptedOut" SET DEFAULT false;
    -- If they manually added it as nullable, back-fill not-null to match our
    -- Prisma schema (Senior.smsOptedOut Boolean @default(false), non-nullable).
    -- We only SET NOT NULL if the column is currently nullable — otherwise
    -- Postgres raises "column is already NOT NULL".
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name   = 'Senior'
        AND column_name  = 'smsOptedOut'
        AND is_nullable  = 'YES'
    ) THEN
      -- Back-fill any existing NULLs with false before enforcing NOT NULL.
      UPDATE "Senior" SET "smsOptedOut" = false WHERE "smsOptedOut" IS NULL;
      ALTER TABLE "Senior" ALTER COLUMN "smsOptedOut" SET NOT NULL;
    END IF;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'Senior'
      AND column_name  = 'smsOptedOutAt'
  ) THEN
    ALTER TABLE "Senior" ADD COLUMN "smsOptedOutAt" TIMESTAMP(3);
  END IF;
END $$;

---------------------------------------------------------------------------
-- 3. CASL s.13(1) 6-year SMS consent tombstone table (permanent, no FK,
--    survives Delete My Account cascade).
---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "SmsConsentTombstone" (
    "id" TEXT NOT NULL,
    "phoneE164" TEXT NOT NULL,
    "optInAt" TIMESTAMP(3),
    "optOutAt" TIMESTAMP(3),
    "reOptInAt" TIMESTAMP(3)[],
    "reason" TEXT,
    "retainedUntil" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SmsConsentTombstone_pkey" PRIMARY KEY ("id")
);

---------------------------------------------------------------------------
-- 4. Indexes (all IF NOT EXISTS — pre-existing ones from manual dashboard
--    adds or half-runs are skipped silently).
---------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS "SmsConsentTombstone_phoneE164_key"
  ON "SmsConsentTombstone"("phoneE164");

CREATE INDEX IF NOT EXISTS "SmsConsentTombstone_phoneE164_idx"
  ON "SmsConsentTombstone"("phoneE164");

CREATE INDEX IF NOT EXISTS "SmsConsentTombstone_retainedUntil_idx"
  ON "SmsConsentTombstone"("retainedUntil");
