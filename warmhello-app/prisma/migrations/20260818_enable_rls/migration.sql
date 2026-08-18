-- Enable Row Level Security on all public tables so Supabase Security Advisor
-- stops flagging "RLS Disabled in Public" and "Sensitive Columns Exposed" errors.
--
-- All of WarmHello's database access is 100% server-side via Prisma, which connects
-- as the database owner / session pooler user (roles that BYPASS RLS). Prisma's
-- access is unaffected.
--
-- PostgREST (the Supabase auto-generated REST API) connects as anon / authenticated
-- Postgres roles, which DO respect RLS.  Because we do not define any PERMISSIVE
-- policies for those roles below, PostgREST effectively returns 0 rows / writes 0
-- rows for any caller, which is the correct deny-by-default posture for WarmHello
-- (we do not serve data directly from Supabase REST).

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
    EXECUTE format('ALTER TABLE public.%s ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE public.%s FORCE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;
