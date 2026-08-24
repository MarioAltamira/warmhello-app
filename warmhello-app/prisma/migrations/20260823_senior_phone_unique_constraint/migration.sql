-- Bug #4: Prevent cross-subscriber Senior.phoneNumber reuse (CSV-import or manual
-- duplicate-senior-phone bug where the SAME PHYSICAL HANDSET receives SMS for TWO different
-- households, which looks like "double SMS" even though they're different CheckIn rows.
--
-- Root cause: No DB-level UNIQUE on Senior.phoneNumber. Test CSV import populated
-- two different Test subscriber households with identical senior +16479161215, so when
-- both households' advance-day cron created a daily CheckIn, both initial_sms landed
-- on the same phone → user saw "senior got 2x check-in SMS for everyone".
--
-- This migration is 100% idempotent (safe to re-apply, safe even if the index
-- pre-exists from a half-run):
--   Phase A. Dedupe any existing duplicate Senior.phoneNumber rows BEFORE we create
--           the unique index (otherwise CREATE UNIQUE INDEX fails on duplicate keys).
--           Strategy per duplicate-phone group:
--             * Keep exactly ONE row as the canonical Senior. Preference order:
--                 (a) the Senior with the most CheckIn rows (most usage = real user),
--                 (b) if tied / no CheckIns → the most recent createdAt row.
--               The kept row retains active flag (usually true) and CLEAN phoneNumber.
--             * All OTHER rows in the duplicate group get:
--                 active = FALSE (SMS sending path via smsOptedOut path already gates, but
--                 doubly-sure disable CheckIn creation → no future CheckIns will be made for inactive Seniors,
--                 phoneNumber = CONCAT(phoneNumber, '-dup-', LEFT(id,8))  (mangled so
--                 they can never collide with the kept one, and the UNIQUE index passes.
--   Phase B. CREATE UNIQUE INDEX IF NOT EXISTS "Senior_phoneNumber_key" on the
--           Senior(phoneNumber), so future writes can't re-introduce this anti-pattern.

DO $$
DECLARE
  dup_rec record;
  keep_id text;
  loser_id text;
  loser_phone text;
BEGIN
  ---------------------------------------------------------------------------
  -- PHASE A: Dedupe any pre-existing duplicate Senior.phoneNumber rows.
  -- We only touch groups HAVING COUNT(*) > 1 (no-op when no duplicates → no-op on
  -- clean databases; harmless on re-apply since we GROUP BY phone so each group handled
  -- only once, and the loser rows we mangle will produce COUNT=1 on next re-run).
  ---------------------------------------------------------------------------
  FOR dup_rec IN
    SELECT "phoneNumber" AS phone
    FROM public."Senior"
    GROUP BY "phoneNumber"
    HAVING COUNT(*) > 1
  LOOP
    -- Step A.1: Pick the KEEPER for this phone group.
    -- Prefer the Senior with the highest CheckIn count; tie-break by most recent createdAt.
    SELECT s.id
    INTO keep_id
    FROM public."Senior" s
    LEFT JOIN public."CheckIn" c ON c."seniorId" = s.id
    WHERE s."phoneNumber" = dup_rec.phone
    GROUP BY s.id, s."createdAt"
    ORDER BY COUNT(c.id) DESC, s."createdAt" DESC
    LIMIT 1;

    -- Step A.2: For every OTHER Seniors on this phone that are NOT the keeper,
    -- mark inactive and mangle the phone so it can't collide going forward.
    FOR loser_id, loser_phone IN
      SELECT id, "phoneNumber"
      FROM public."Senior"
      WHERE "phoneNumber" = dup_rec.phone
        AND id <> keep_id
    LOOP
      UPDATE public."Senior"
      SET
        "active"      = false,
        "phoneNumber" = CONCAT(
          loser_phone,
          '-dup-', "left"(id, 8)
        ),
        "updatedAt"   = CURRENT_TIMESTAMP
      WHERE id = loser_id;
    END LOOP;
  END LOOP;
END $$;

---------------------------------------------------------------------------
-- PHASE B: Create the UNIQUE index that prevents this bug from recurring.
-- IF NOT EXISTS → no-op if already present (half-run, manual add, etc.).
---------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS "Senior_phoneNumber_key"
  ON public."Senior"("phoneNumber");
