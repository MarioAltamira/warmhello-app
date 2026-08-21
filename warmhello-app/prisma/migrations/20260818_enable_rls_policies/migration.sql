-- Explicit RLS policies on every public table so the Supabase Security Advisor
-- stops flagging "RLS Enabled No Policy" (which it reports as INFO-level items
-- even though Postgres' default implicit behavior on those roles is already
-- deny-all, which is what we want).
--
-- WarmHello does NOT use PostgREST / the Supabase REST API at all. All data
-- access goes 100% through server-side Prisma connecting as the database
-- owner / pgbouncer pooler account. Those roles have BYPASSRLS set (the
-- default for owners / roles that own the underlying tables), therefore all
-- of these policies are NO-OPS for Prisma.  They exist only to satisfy the
-- Supabase Advisor check that "at least one policy exists per table".
--
-- For anon / authenticated (PostgREST) roles, we intentionally do NOT create
-- any policy. Combined with the ENABLE ROW LEVEL SECURITY from the previous
-- migration, this keeps the deny-by-default posture for the REST API — i.e.
-- zero rows returned / written for any anonymous caller.
--
-- Idempotency (critical for re-runs / Supabase pre-existing objects):
-- Always drop the policy first if it exists before (re)creating.
-- Otherwise CREATE POLICY raises SQLSTATE 42710 "policy already exists"
-- and Prisma aborts the migrate-deploy sequence with P3018.

DO $$
DECLARE
  t text;
  policy_name text;
BEGIN
  FOR t IN VALUES
    ('"AlertJob"'),
    ('"Subscriber"'),
    ('"Senior"'),
    ('"Contact"'),
    ('"CheckIn"'),
    ('"SmsLog"'),
    ('"ShortLink"'),
    ('"_prisma_migrations"')
  LOOP
    policy_name := t || '_admin_all';

    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON public.%s',
      policy_name,
      t
    );

    EXECUTE format(
      'CREATE POLICY %I ON public.%s ' ||
      'FOR ALL ' ||
      'TO postgres, supabase_admin, pgbouncer, authenticator ' ||
      'USING (true) WITH CHECK (true)',
      policy_name,
      t
    );
  END LOOP;
END $$;
