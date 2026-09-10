-- Fix Supabase Security Advisor "RLS Disabled in Public" for the 3 tables
-- added after the original 20260818_enable_rls + enable_rls_policies pass:
--   - ProcessedStripeEvent (Stripe webhook idempotency ledger)
--   - LegalConsentAudit    (ToS/Privacy consent + purchase compliance trail)
--   - SecurityAudit        (auth/security event log — login, password reset, etc.)
--
-- Root cause: these 3 models were added to prisma/schema.prisma after the
-- original RLS rollout and were never included in the ENABLE ROW LEVEL
-- SECURITY loop, so they remained fully open to PostgREST's anon/authenticated
-- roles (same class of gap fixed for SmsConsentTombstone in
-- 20260821_sms_tombstone_rls_policy_fix).
--
-- Fix follows the EXACT same pattern as our other public tables:
--   1. ENABLE + FORCE RLS on the table (deny-by-default for anon/authenticated)
--   2. Idempotently drop any pre-existing policies (advisor auto-generated ones)
--   3. Create a SINGLE admin-only policy for postgres/supabase_admin/pgbouncer/
--      authenticator roles only. These are the internal Prisma connection
--      roles — they have BYPASSRLS so USING(true)/WITH CHECK(true) are no-ops
--      for them. anon/authenticated get NO policy, so RLS keeps them fully
--      denied, which is correct: WarmHello does not serve any of these 3
--      tables via PostgREST/Supabase REST — 100% server-side Prisma access.

DO $$
DECLARE
  t text;
  rec record;
BEGIN
  FOR t IN VALUES
    ('ProcessedStripeEvent'),
    ('LegalConsentAudit'),
    ('SecurityAudit')
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', t);

    FOR rec IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = t
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', rec.policyname, t);
    END LOOP;

    EXECUTE format(
      'CREATE POLICY %I ON public.%I ' ||
      'FOR ALL ' ||
      'TO postgres, supabase_admin, pgbouncer, authenticator ' ||
      'USING (true) WITH CHECK (true)',
      t || '_admin_all',
      t
    );
  END LOOP;
END $$;
