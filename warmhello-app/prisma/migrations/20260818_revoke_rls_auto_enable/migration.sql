-- Remove the last 2 Supabase Security Advisor Warnings ("Public/Signed-in
-- Users Can Execute SECURITY DEFINER Function public.rls_auto_enable()").
--
-- public.rls_auto_enable() is a SECURITY DEFINER function (runs with the
-- privileges of the FUNCTION OWNER, typically the superuser/postgres)
-- that was auto-created by a prior Supabase helper / manual SQL run.
-- WarmHello does NOT call this function anywhere — we manage RLS via
-- explicit Prisma migrations (see 20260818_enable_rls.sql). Having it
-- callable by anon or authenticated is a privilege escalation risk:
-- even if the function body currently looks benign, SECURITY DEFINER
-- is subject to search_path hijacking, and future platform changes can
-- extend it. Safest posture = revoke PUBLIC EXECUTE entirely.
--
-- We intentionally do NOT DROP the function because Supabase / upstream
-- extensions sometimes auto-recreate helper functions on next platform
-- heal cycle. REVOKE FROM PUBLIC + grant back only to postgres is
-- idempotent and survives those re-creates.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'rls_auto_enable'
      AND p.pronargs = 0
  ) THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.rls_auto_enable() TO postgres';
  END IF;
END $$;
