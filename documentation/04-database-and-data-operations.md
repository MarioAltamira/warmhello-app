# 04 — Database & Data Operations

Warm-Hello uses a **single PostgreSQL 16** database hosted by Supabase in AWS
ca-central-1. Supabase manages: automated backups, PITR, OS updates, storage,
replication. The Warm-Hello app uses two Postgres endpoints (same logical DB):

1. **Pooled** — `DATABASE_URL` `*.pooler.supabase.com :5432` — PgBouncer transaction-mode pooling. Used by **ALL runtime Prisma queries in the app** (the 99% path). Enforces max 15 connections in the URI `?connection_limit=15` on 512 MB micro.
2. **Direct** — `DIRECT_URL` `*.supabase.com :5432` — 1:1 raw connection. Used by `prisma migrate deploy` DDL, `prisma db push`, and `prisma migrate resolve`. Never used for user queries.

---

## 4.1 Engine Specs

| Spec | Value |
|---|---|
| Database engine | PostgreSQL 16.x (Supabase always tracks latest stable minor) |
| DBaaS provider | Supabase (runs on AWS ca-central-1) |
| Logical DB name | `postgres` (default supabase DB name) |
| Postgres user | `postgres.mjcgmecafwhlzqglcmqj` (per Supabase pattern: project owner auto-generated role) |
| Pooled Hostname | `aws-0-ca-central-1.pooler.supabase.com` |
| Pooled Port | 5432, PgBouncer mode **transaction** (NOT session). Prepared statements OK per Supabase docs because they wrap server-side. |
| Direct Hostname | `aws-0-ca-central-1.supabase.com` |
| SSL | ALWAYS on. Prisma auto-configures `sslmode=require` for Supabase URLs. No plaintext anywhere. |
| ORM | Prisma 6.19.x. Schema path: `prisma/schema.prisma` |
| Prisma client location | auto-generated into `node_modules/@prisma/client` each `prisma generate` run |
| Connection pool size (app-level Prisma) | `connection_limit=15` on pooled URL (default would be num_cpus*2+1 which is 3; bump to 15 for 3x burst headroom on PgBouncer) |
| Timeouts | Prisma default statement_timeout 30 s (global). Prisma pool_timeout 10 s. |
| Row-level access control | NONE in Postgres RLS today (all access trusted via app server ORM only). The DB is not exposed to browser Supabase SDK client; no anon/key URL in JS bundle. |
| Supabase Auth | DISABLED. We do not use Supabase Auth JS SDK, magic links, JWT, or RLS. Auth is handled app-server-side bcryptjs + HMAC-signed cookies only. |

---

## 4.2 Migration Procedures

Prisma migration files live in `prisma/migrations/YYYYMMDDHHmmSS_migration_name/migration.sql`.
They are applied server-side with `prisma migrate deploy`, NEVER `prisma migrate dev`
(dev-only command for creating migrations, not applying).

### 4.2.1 Apply pending migrations (deploy-time only)
Run **BEFORE** `next build` on deploy step §2.3. It is safe to always run;
`0 pending migrations` exits 0.

```bash
cd /home/admin/warmhello/warmhello-app/warmhello-app/
NODE_OPTIONS="--max-old-space-size=2048" pnpm exec prisma migrate deploy --schema prisma/schema.prisma
```

### 4.2.2 Audit migrations applied on target DB
```bash
NODE_OPTIONS="--max-old-space-size=2048" pnpm exec prisma migrate status
# Expected output example:
# 8 migrations found in prisma/migrations
#
# Following migration have been applied:
#  20260820170000_init
#  20260902_add_password_hash
#  20260902_add_password_auth_enum_values
#
# No pending migrations to apply.
```

### 4.2.3 Creating a new migration (dev-laptop-only, NEVER on prod)
```bash
# 1. Edit prisma/schema.prisma on laptop
# 2. Run:
pnpm exec prisma migrate dev --name descriptive_lowercase_name_here
# 3. Creates prisma/migrations/YYYYMMDDHHmmSS_descriptive_lowercase_name_here/migration.sql + updates _prisma_migrations table on local dev DB
# 4. Review generated SQL before committing; manual edits inside .sql file allowed before commit (for indexes, triggers, pg_trgm etc.)
# 5. Git commit migration files + schema.prisma together (atomic commit)
```
**Never manually edit a migration SQL file once it's been committed to main.**
That breaks the deterministic Prisma migration checksum; deploy will throw
"Checksum mismatch for migration …" → procedure §4.2.5.

### 4.2.4 Roll back a deployed migration — last resort (Rare)
Prisma has no built-in "prisma migrate rollback". Steps:
1. Open the migration.sql in `prisma/migrations/…/migration.sql` you want to undo.
2. Write the **inverse** SQL manually:
   - `ALTER TABLE … ADD COLUMN foo` → `ALTER TABLE … DROP COLUMN foo`
   - `CREATE TABLE bar` → `DROP TABLE bar`
   - `CREATE UNIQUE INDEX …` → `DROP INDEX …`
3. Save as `prisma/migrations/YYYYMMDDHHmmSS_rollback_<name>/migration.sql`.
4. Commit, deploy normally via §4.2.1.
5. Note: data-destroying rollbacks (`DROP TABLE`, `DROP COLUMN`) lose data. For data-preserving rollbacks of DDLs, first inspect column fill % with:
```sql
SELECT schemaname, tablename, attname, n_distinct, correlation FROM pg_stats WHERE tablename IN ('subscribers','checkins','households') ORDER BY tablename;
```

### 4.2.5 Resolve "Checksum mismatch" / "Failed migration"
If deploy broke mid-`prisma migrate deploy` (SSH dropped, VM killed mid-transaction):
```bash
# 1. Figure out which migration folder is the bad one
NODE_OPTIONS="--max-old-space-size=2048" pnpm exec prisma migrate status

# 2. Option A: If the migration is actually applied (SQL worked) but Prisma thinks failed → mark applied
NODE_OPTIONS="--max-old-space-size=2048" pnpm exec prisma migrate resolve --applied 20260902123456_the_name

# 3. Option B: If the migration truly failed partway (SQL partially applied) → mark rolled-back
#    (then manually fix the partial SQL state against production DB with psql)
NODE_OPTIONS="--max-old-space-size=2048" pnpm exec prisma migrate resolve --rolled-back 20260902123456_the_name
```
Always prefer Option A if the actual SQL statements all ran (most common case when killed mid-transaction commit).

### 4.2.6 Schema validate before commit
```bash
pnpm exec prisma validate   # exit 0 required; catches broken @relation, @id, enum syntax
```

---

## 4.3 Backup & Restore

Backups today are **100% Supabase-managed**. You need a Supabase owner/editor
login to perform restores.

### 4.3.1 Automated Backup Schedule (Supabase)
| Tier | PITR (point-in-time) | Snapshot backup cadence | Retention |
|---|---|---|---|
| Supabase Free | ❌ No | Daily automated | 2 days |
| Supabase Pro ($25/mo) | ✅ 7-day PITR granular to 1 second | Daily automated | 7 days |
| Supabase Team ($100/mo) | ✅ 30-day PITR | Daily automated + on-demand | 30 days |

**Recommendation**: **Pro tier minimum for production** (7 day PITR mandatory).
Currently using whatever tier the project is on — confirm this via Supabase console
→ Project → Billing → Plan.

### 4.3.2 Ad-hoc manual backups (recommended before every risky migration)
Create a manual pg_dump before you run ANY production migrate deploy that
has ALTER / ADD COLUMN with NOT NULL / DROP / NEW TABLE CASCADE.

```bash
# Run FROM A LAPTOP OR JUMP BOX, NEVER SSH INTO PROD TO DUMP (eats root disk)
DIRECT_URL="postgres://postgres.mjcgmecafwhlzqglcmqj:PLACEHOLDER_SUPABASE_DIRECT_PASSWORD@aws-0-ca-central-1.supabase.com:5432/postgres"
DATESTAMP=$(date +%Y%m%d-%H%M%S)
pg_dump "$DIRECT_URL" \
  --format=custom \
  --compress=zstd:9 \
  --no-owner \
  --no-privileges \
  --clean \
  --if-exists \
  -f "warmhello-prod-backup-${DATESTAMP}.dump"
# Copy offline to encrypted s3 bucket or external cold storage
aws s3 cp "warmhello-prod-backup-${DATESTAMP}.dump" s3://PLACEHOLDER_ENCRYPTED_BACKUPS_BUCKET/warmhello/prod/
```

### 4.3.3 Restore from Snapshot (Supabase console — catastrophic failure)
1. Login to Supabase Console → Project → Settings → Backups
2. Pick restore target (PITR if Pro, else latest daily snapshot)
3. **Warning:** restore is **DESTRUCTIVE TO CURRENT LIVE DB**. Write down the DB size on disk (Settings → Infrastructure → Storage) first.
4. Click Restore.
5. Wait for Supabase (10-40 min depending on DB size; Supabase provisions new instance under-the-hood then swaps).
6. After restore:
   - Re-validate app's DATABASE_URL pooled (hostname/password do NOT change on snapshot restore; it's same logical project cluster)
   - `pm2 restart warmhello --time` ; sleep 25 ; curl health

### 4.3.4 Restore from pg_dump dump file (object-level selective restore)
```bash
DIRECT_URL="postgres://user:pass@host:5432/postgres"
DUMPFILE="warmhello-prod-backup-YYYYMMDD-HHMMSS.dump"
# Inspect first (list objects):
pg_restore --list "$DUMPFILE" | head -n 40
# Restore into a fresh EMPTY clone DB (NEVER OVERWRITE PROD DB WITH RESTORE IN PLACE):
createdb warmhello_restore_test
PGPASSWORD=PLACEHOLDER_RESTORE_DB_PASS pg_restore --no-owner --no-privileges --dbname=warmhello_restore_test --host=… --port=5432 --username=… "$DUMPFILE"
```

### 4.3.5 Recovery Point / Time Targets
See §7.5 Disaster Recovery for formal RPO / RTO statements.

---

## 4.4 Periodic DB Ops Manual Checklist
Every 30 days (repeat monthly cron reminder — set personal task):
1. `psql $DIRECT_URL -c "SELECT pg_size_pretty(pg_database_size(current_database()));"` — record DB size trend (warn if >50% Supabase plan quota).
2. `psql $DIRECT_URL -c "SELECT schemaname, relname, n_live_tup, n_dead_tup, last_autovacuum FROM pg_stat_user_tables ORDER BY n_dead_tup DESC LIMIT 10;"` — dead tuples blow up planner estimates; if any table `n_dead_tup > 1,000,000` → `VACUUM ANALYZE <table>;`.
3. `psql $DIRECT_URL -c "SELECT pid, usename, state, query_start, wait_event_type || ':' || wait_event, query FROM pg_stat_activity WHERE state <> 'idle' ORDER BY query_start;"` — catch runaway queries (stuck transactions cause PgBouncer pool exhaustion → 503s on app endpoints).
4. Confirm Supabase automated backup is green via Console → Backups → Last success date.
5. Take a manual pg_dump baseline per §4.3.2 and ship to offline encrypted storage.
