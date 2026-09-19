-- Fix Supabase Security Advisor lint:
-- "RLS Policy Always True · public.SmsConsentTombstone · sms_tombstone_insert"
--
-- Root cause:
-- SmsConsentTombstone was added AFTER the 20260818_enable_rls + enable_rls_policies
-- migrations ran. As a result:
--   (a) RLS was never explicitly ENABLED on this table
--   (b) Supabase's advisor auto-generates a permissive placeholder policy
--       ("sms_tombstone_insert" FOR INSERT WITH CHECK (true) TO authenticated/anon)
--       to avoid flagging "RLS enabled but no policy exists", but that permissive
--       INSERT policy triggers a HIGHER-SEVERITY lint instead.
--
-- Fix follows the EXACT same pattern as our other 8 public tables (see
-- 20260818_enable_rls + 20260818_enable_rls_policies):
--   1. ENABLE + FORCE RLS on the table (keeps deny-by-default for anon/authenticated)
--   2. Drop any pre-existing auto-generated bad policies (the advisor-created ones,
--      anything with any name, idempotently)
--   3. Create a SINGLE admin-only policy for postgres/supabase_admin/pgbouncer/authenticator
--      roles only. These are the internal Prisma connection roles — they have BYPASSRLS
--      so the USING(true) WITH CHECK(true) clauses are NO-OPS for them. Critically,
--      anon / authenticated (PostgREST REST API) roles have NO policy, so RLS keeps
--      them in full deny-by-default for this table, which is what WarmHello wants.
--
-- Data access for this table (from our app):
--   SmsConsentTombstone is ONLY ever written/read from SERVER-SIDE code paths:
--     - P2-1 Telnyx STOP/HELP/START inbound webhook  → app/api/webhooks/telnyx/route.ts
--       (upsertTombstone helper on STOP/START writes via prisma.smsConsentTombstone.upsert)
--     - P2-2 Delete account → app/api/account/delete/route.ts (scrubs subscriber,
--       tombstone intentionally preserved — no subscriber FK by design for CASL s.13(1))
--   All of the above use server-side Prisma connecting as postgres/pgbouncer roles
--   (BYPASS RLS) so this policy configuration changes nothing for the running app.
--   It purely silences two Supabase advisor lints: (a) RLS disabled on public table,
--   (b) permissive INSERT policy applied to authenticated.

DO $$
DECLARE
  rec record;
BEGIN
  -- Step 1: Explicitly enable RLS. Safe to re-run (Postgres tolerates re-ENABLING
  -- if already enabled; raises a NOTICE only, not an error, so Prisma won't abort).
  EXECUTE 'ALTER TABLE public."SmsConsentTombstone" ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE public."SmsConsentTombstone" FORCE ROW LEVEL SECURITY';

  -- Step 2: Idempotently drop EVERY existing policy on this table, regardless of
  -- name. This removes the advisor-generated "sms_tombstone_insert" permissive
  -- policy plus any other auto-created ones that could trigger future lints.
  FOR rec IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'SmsConsentTombstone'
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON public."SmsConsentTombstone"',
      rec.policyname
    );
  END LOOP;

  -- Step 3: Create the standard WarmHello admin-only policy.
  --   FOR ALL: covers SELECT/INSERT/UPDATE/DELETE
  --   TO:     trusted internal roles ONLY — NEVER anon, NEVER authenticated
  --           (these are the Prisma/pooler/admin roles, they BYPASS RLS anyway so
  --           USING(true) / WITH CHECK(true) are no-ops, not security issues)
  --   Result: Supabase advisor stops complaining because at least 1 policy exists,
  --           and no policy applies to authenticated/anon, so no "always true" lint.
  EXECUTE format(
    'CREATE POLICY %I ON public."SmsConsentTombstone" ' ||
    'FOR ALL ' ||
    'TO postgres, supabase_admin, pgbouncer, authenticator ' ||
    'USING (true) WITH CHECK (true)',
    'SmsConsentTombstone_admin_all'
  );
END $$;
