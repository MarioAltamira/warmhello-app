# 07 — Troubleshooting Runbooks

Before any deep investigation, start with the three-step triage. It resolves ~70% of pages in <10 minutes.

**Three-step triage (always run first):**
1. `pm2 status warmhello` → status = online? uptime reasonable? CPU% > 90%? Mem% nearing 512 MB?
2. `curl -sS http://127.0.0.1:8080/api/health` → 200? integrations all true?
3. Last 80 lines of PM2 error log: `tail -n 80 /home/admin/.pm2/logs/warmhello-error-0.log | grep -v '^$'` — is it a recurring error?

If any step fails, go directly to the matching numbered runbook below.

---

## 7.1 Runbook 1 — Next Build OOM SIGABRT on Deploy (exit code 134, 512 MB micro)

### Symptoms
- `next build` prints red `SIGABRT: abort` or `JavaScript heap out of memory` and a 50 MB stack dump to stderr
- Exit code 134 (bash convention: 128 + SIGABRT 6)
- Build grid of Static/Server/Static routes NEVER prints

### Root cause (confirmed known)
V8 default heap sizing on a 512 MB host thinks it has ~380 MB; Next build's Terser minification + webpack chunk split peaks around ~900 MB virtual; OOM-killer or V8 internal abort triggers.

### Fix (100% success — deploy script already uses it)
```bash
NODE_OPTIONS="--max-old-space-size=2048" pnpm exec next build
```
Why this works even with only 512 MB physical: V8 asks OS for 2 GB heap max; 2 GB swapfile absorbs ~1.2 GB cold pages, only hot working set (~300 → 450 MB) lives in RAM. Latency during minification slows down but still ≤ 6 min total build.

### Permanent guardrail
Always wrap these in `NODE_OPTIONS="--max-old-space-size=2048"` on prod micro:
- `pnpm install --frozen-lockfile` (large dependency trees)
- `next build`
- `next start`
- `prisma generate` (optional; harmless to add)
- `tsc --noEmit` (optional once project >2k ts files)

### False negative check
If still failing after NODE_OPTIONS → run `free -h` and confirm Swap total says 2.0 Gi; if swap missing, re-enable it per §2.2 Step 1 then retry build. Swap off + 512 MB = guaranteed failure.

---

## 7.2 Runbook 2 — PM2 started, curl to /api/health fails "curl(7) Failed to connect: Connection refused" for first minute

### Symptoms
After `pm2 start` + immediate curl (within 15 seconds):
```
curl: (7) Failed to connect to 127.0.0.1 port 8080 after 0 ms: Couldn't connect to server
```

### Root cause (confirmed known — Next.js cold start latency)
`next start` on this app takes **9.7 → 12.3 seconds** before it binds port 8080 and serves first request. During that window, PM2 reports "online" (because the process spawned) but the Node HTTP server is NOT yet listening. The deploy script already uses `sleep 25` then 5 retries to absorb this.

### Remediation
Always wait at least 20 s before first health curl after `pm2 start` OR `pm2 restart`.

**Deploy-mandatory sleep (copy this, never remove the 25 s):**
```bash
pm2 restart warmhello --time
sleep 25
for i in 1 2 3 4 5; do curl -sS http://127.0.0.1:8080/api/health ; echo " (attempt $i)" ; sleep 5; done
```

### If curl7 still fails at attempt 5
Process truly died. Check:
1. `pm2 status warmhello` → is status "errored" or "stopped" not "online"?
2. `tail -n 120 /home/admin/.pm2/logs/warmhello-error-0.log` — look for `Invalid environment variables: JOB_SIGNING_SECRET Expected string length ≥ 32` (this is #1 post-deploy crash cause now).

---

## 7.3 Runbook 3 — App crash-loop immediately after pm2 start (Zod env parse fails)

### Symptoms
- `pm2 status` shows Warm-Hello restarts every 3-10 s, uptime never >20 s
- Error log tail contains line: `Invalid environment variables:` followed by a key name

### Common offending keys today (ordered by likelihood)
1. **`JOB_SIGNING_SECRET` — Expected string, length ≥ 32**
   - `lib/env.ts line 59` enforced this in security hardening commit
   - Old `.env` had a short dev-only 16 char secret → app will **NOT** boot with it
2. `DATABASE_URL` / `DIRECT_URL` — blank on a deployment that needs DB
3. `SMTP_PORT` — non-numeric / negative
4. `APP_URL` / `NEXT_PUBLIC_APP_URL` / `SHORT_LINK_BASE_URL` — invalid URL format (forgot `https://` prefix)

### Fix step-by-step
1. Print the offending error:
   ```bash
   grep -A 20 "Invalid environment variables" /home/admin/.pm2/logs/warmhello-error-0.log | head -n 40
   ```
2. Edit `.env` and fix the key. For **JOB_SIGNING_SECRET < 32** → generate new entropy:
   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
   ```
3. Save + chmod 0600 `.env`
4. **Rebuild** (NEXT_PUBLIC_* vars baked into JS bundle) then restart:
   ```bash
   NODE_OPTIONS="--max-old-space-size=2048" pnpm exec next build
   pm2 restart warmhello --time
   sleep 25 ; curl -sS http://127.0.0.1:8080/api/health
   ```

### If you need to fall back to older code that allowed short JOB_SIGNING_SECRET
→ See §2.5 Rollback A, roll back before security pass. Not recommended.

---

## 7.4 Runbook 4 — Prisma "P1001 Can't reach database server at X.supabase.com:5432"

### Symptoms
- Any DB-touch endpoint returns 500
- PM2 error log tail 30 lines has `PrismaClientInitializationError: error: Error validating datasource \`db\`: the URL must start with the protocol \`postgresql://\` or \`postgres://\`. → no` OR `P1001: Can't reach database server`

### Step-by-step
1. **Test network-level reachability FROM SSH server shell**
   ```bash
   HOST="aws-0-ca-central-1.pooler.supabase.com"
   PORT=5432
   timeout 5 bash -c "cat < /dev/null > /dev/tcp/$HOST/$PORT" 2>/dev/null && echo "PORT $PORT OPEN to $HOST" || echo "FAIL — DB TCP NOT reachable"
   ```
   If FAIL → 99% an outbound firewall rule, UFW, or AWS VPC security group egress deny on :5432.
   - Temporarily disable UFW to test: `sudo ufw disable` → if it starts working → UFW rule order issue (default outgoing allow MUST be enabled at top; see §2.2 Step 4).
2. **Check DB role password correctness**
   - Paste `DIRECT_URL` into **Supabase SQL Editor on console** web page — does SQL Editor work? If web also fails → project is paused on Supabase free tier after 7 days idle! Restore it on Supabase Console Project → Resume.
   - If web works but URL fails → reset password for `postgres.mjcgmecafwhlzqglcmqj` from Console → Project → Settings → Database → Reset password. Update `.env` then rebuild + restart.
3. **PgBouncer mode mismatch** — ensure pooled URL has `?pgbouncer=true&connection_limit=15` query string after `/postgres` db name. The direct URL MUST NOT have pgbouncer=true.
4. **Verify .env URL has NO whitespace** — very common paste error:
   ```bash
   node -e "const u=(require('fs').readFileSync('.env','utf8').match(/^DATABASE_URL=(.*)$/m)||[])[1]||''; console.log('len=', u.length, 'startsOk=', u.startsWith('postgres://'), 'hasSpace=', /\s/.test(u));"
   ```
   Correct result: `startsOk=true hasSpace=false`.

---

## 7.5 Runbook 5 — Too Many 429s on endpoints (rate limiter blocking legitimate users)

### Symptoms
- Users see toast "Too many requests. Try again in X minutes."
- Response body from endpoint returns HTTP 429 with header `Retry-After: <seconds>`
- PM2 out log shows security audit kind names `_RATE_LIMITED`

### Diagnosis
Identify key dimension → run PM2 error log grep:
```bash
grep -h "RATE_LIMITED\|429" /home/admin/.pm2/logs/warmhello-out-0.log /home/admin/.pm2/logs/warmhello-error-0.log | tail -n 60
```
Common dimension keys: `ip:`, `subscriberId:`, `email:`, `householdId:`, `token:`.

### Remediation options
1. **Single user blocked (genuine legitimate burst):** Restart the process → this wipes ALL in-memory rate limit buckets clean. Drawback: also gives attackers fresh buckets, so only do for genuine known internal single-user case.
   ```bash
   pm2 restart warmhello --time
   ```
2. **Legitimate bot (monitoring service / health checker / uptime SaaS):** Add the source IPv4 to a new trusted IP bypass list in `lib/rate-limit.ts` (short-circuit before `checkRateLimit`).
3. **Attack credential stuffing → real 429s are GOOD:** The rate limiter is functioning correctly. Upgrade to a Redis-backed rate limiter + permanent IP block list to continue scaling defense.
4. **Limits too low for a known busy day (launch, promo):** Adjust constants up in each route file's `checkRateLimit(key, windowMs, limit)` call. Typical constants to double:
   - Subscriber create signup `3/IP/5min → 10/IP/5min`
   - Timeline actions that users legitimately click several times in a row.

### Architectural note on rate limiter (CRITICAL for future)
§1.4 caveat restated: rate limiter state is in-process only. If we ever scale to 2 Node processes via `pm2 -i max` or a second Lightsail replica, state diverges between processes. Fix by swapping `Map<string, number[]>` bucket to **Upstash Redis** (Lua script sliding-window pattern).

---

## 7.6 Runbook 6 — PgBouncer / Connection Pool Exhaustion (all endpoints slow, 504 or no response)

### Symptoms
- Every DB-backed endpoint p90 goes from <400ms → >3s for ≥10 min continuous
- PM2 error tail shows repeating `Timed out during fetch in 10000 ms` or `PrismaClientKnownRequestError: P2024: Timed out fetching a new connection from the connection pool`
- Active DB sessions in Supabase Console → Server → Connections shows 15/15 connections (maxed out)

### Step-by-step
1. Identify stuck idle queries / abandoned transactions:
   ```bash
   psql "$DIRECT_URL" -c "
   SELECT pid, now()-query_start AS dur, state, wait_event_type, wait_event,
          left(query, 120) query
   FROM pg_stat_activity
   WHERE state <> 'idle' OR wait_event IS NOT NULL
   ORDER BY query_start ASC;"
   ```
2. For any session `dur > 5 min` state `idle in transaction` → kill it:
   ```sql
   SELECT pg_terminate_backend(<pid_from_above>);
   ```
3. Temporary 30-min reprieve if we can't deploy:
   ```bash
   pm2 restart warmhello --time    # drops app-side pool and re-initializes 15 fresh
   ```
4. Long-term fix:
   - Add Prisma `pool_timeout` explicit tuning in schema datasource `url = env("DATABASE_URL")` → add `?pool_timeout=5` (fail fast)
   - Bump connection_limit from 15 → 30 on URL, and confirm PgBouncer pooler on Supabase plan supports ≥30 (Pro plan minimum)

---

## 7.7 Runbook 7 — Stripe Webhook 400 "constructEvent FAILED" 100% of callbacks

### Symptoms
- Stripe Dashboard → Webhooks → Warm-Hello webhook endpoint → Recent deliveries every call = 400 "Webhook Error: …"
- PM2 error log has lines with substring `[stripe-webhook:verify-signature] constructEvent FAILED`

### Root causes (sorted by likelihood)
1. **`STRIPE_WEBHOOK_SECRET` env var is `whsec_` from WRONG Stripe webhook endpoint** (you created 2 endpoints and pasted the wrong one).
2. **Server clock skew** — Stripe signatures include a `t=` timestamp; 5 min tolerance is default. Run `date -u` on Lightsail SSH and compare to `date -u` on your laptop; drift >60 s → configure NTP:
   ```bash
   sudo timedatectl set-ntp true ; timedatectl status
   ```
3. **Reverse proxy / body parser double-read:** Next.js route already consumes request body stream as raw; ensure no middleware touched it and rewrote bytes. (Never an issue today since we use standard `NextRequest.text()` pattern — keep that pattern.)

### Verification step after fix
```bash
# From Stripe Dashboard → Webhook → Send test event:
#   type = customer.updated, expected status = 200 + JSON {"received":true}
# OR from CLI if Stripe CLI installed:
stripe listen --forward-to https://warm-hello.com/api/webhooks/stripe
```

---

## 7.8 Runbook 8 — 403 "Cross-origin request blocked" for internal POSTs (CSRF middleware firing false-positive)

### Symptoms
- A working user form suddenly POST → 403 JSON `{"ok":false,"error":"Cross-origin request blocked."}`
- The route is NOT on the whitelist: `/api/webhooks/*`, `/api/jobs/*`, `/api/auth/magic`
- Hitting the endpoint with `curl -X POST http://127.0.0.1:8080/api/<route>` also fails with 403 (because curl sends no Origin header by default)

### Diagnosis & quick fix for admin testing
1. Admin `curl` 403s are expected behavior. Correct curl to include Origin header from site whitelist:
   ```bash
   curl -sS -X POST http://127.0.0.1:8080/api/auth/change-password \
     -H "Origin: https://warm-hello.com" \
     -H "Content-Type: application/json" \
     -d '{"oldPassword":"x","newPassword":"yyyyyyyyyyyyyyyyyyyyyyyy"}'
   ```
2. Real user browsers are failing → check the `NEXT_PUBLIC_APP_URL` env var exactly matches browser URL origin (scheme+host+port). Common mistake: `https://warm-hello.com` in browser but `APP_URL=http://warm-hello.com` in .env (no https) — origin comparison fails because protocol differs. Fix in .env, rebuild, restart.

### If an internal cron / third-party caller legitimately POSTs with no origin
Add the path prefix to `EXTERNAL_POST_WHITELIST_PREFIXES` in [middleware.ts:14-18](file:///C:/Users/mario/Documents/trae_projects/WarmHello/warmhello-app/middleware.ts#L14-L18). Re-deploy.

---

## 7.9 Disaster Recovery — Formal RPO / RTO + Catastrophic Outage Protocol

### Definitions
- **RPO (Recovery Point Objective):** Max acceptable data loss during disaster = **≤ 24 hours** (Supabase daily snapshot worst-case). Supabase Pro 7-day PITR → RPO ≤ 5 minutes achievable.
- **RTO (Recovery Time Objective):** Max downtime until back online = **≤ 60 minutes** with single operator. Requires operator SSH shell access + Supabase console access.

### Step-by-step Disaster Recovery (data-center-level failure / ransomware / stolen SSH key → full rebuild)
1. **0 → 5 minutes: Declare disaster** — Stop further writes. Add TXT `_dmarc` temp to quarantine or suspend QStash schedules via Upstash Console. Stop PM2: `pm2 stop warmhello` or (if host down) assume host is lost.
2. **5 → 15 min: Choose restore target**
   - For PITR eligible (Pro): Supabase Console → Backups → PITR → pick timestamp 5 minutes BEFORE disaster started
   - For daily snapshots only: click latest green snapshot before disaster
   - **In parallel on a new Lightsail instance** — provision a new Debian 12 micro per §2.2 Steps 1–6. Skip DB bootstrap steps until Supabase restore done.
3. **15 → 40 min: Spin up new VM + DB swap**
   - DB: Wait for Supabase restore operation to report Complete (UI). Credentials unchanged in majority of cases.
   - VM: Follow §2.2 step 7 onwards. Copy the **rotated (new)** `.env` to `/home/admin/warmhello/warmhello-app/warmhello-app/.env`.
   - Build + start; `sleep 25`; health check.
4. **40 → 55 min: Cut over DNS / TLS**
   - DNS A record `warm-hello.com` → new VM public IPv4
   - Reissue certbot cert if custom TLS (recommended): §6.2.2 steps
   - Monitor first 1 000 live requests via error log tail, integrations all five true
5. **55 → 60 min: Wrap**
   - QStash schedules re-enabled
   - Stripe webhook endpoint updated in Stripe Dashboard Developers → Webhooks if endpoint URL changed
   - Telnyx SMS webhook URL updated if changed
   - Postmortem: update docs, file ticket against root cause, verify nightly backup runs.

---

## 7.10 Escalation matrix
**Formal escalation path & vendor contact directory has been broken into its own document: [`emergency-contacts.md`](emergency-contacts.md).** Keep that file printed / pinned next to this runbook during a P1 incident.
