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

DO $$
DECLARE
  t text;
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
    EXECUTE format(
      'CREATE POLICY %I ON public.%s ' ||
      'FOR ALL ' ||
      'TO postgres, supabase_admin, pgbouncer, authenticator ' ||
      'USING (true) WITH CHECK (true)',
      t || '_admin_all',
      t
    );
  END LOOP;
END $$;
