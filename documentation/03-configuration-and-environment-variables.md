# 03 — Configuration & Environment Variables

All runtime configuration is parsed with Zod at import-time by `lib/env.ts`.
If any required key is invalid, process will **throw at first `import env`**
(usually PM2 restart loop; you will see errors like
`Invalid environment variables → JOB_SIGNING_SECRET: Expected string, length ≥ 32`
in `warmhello-error-0.log`).

---

## 3.1 Secrets Management — Today

**Current storage location:** plaintext file `.env` chmod `0600`
- Path on server: `/home/admin/warmhello/warmhello-app/warmhello-app/.env`
- Path on dev laptops: repo root `warmhello-app/.env`, already `.gitignore`d
- Owner on server: `admin:admin`, mode `-rw-------` (only owner read/write)
- NO secrets manager, NO Vault, NO AWS Secrets Manager today.
- `.env` IS explicitly listed in `.gitignore`. NEVER commit this file.

### 3.1.1 Recommended hardening (6-12 month)
Move only the *production 11 keys below* into AWS Secrets Manager → load at
boot via a small `envsubst` step in PM2 script. Keep dev `.env` on laptops as
today (local-only entropy). This is a **future recommendation only** — not
required for current operating handoff.

The 11 actual production-only secret values that MUST migrate first when you
adopt a secrets manager:
1. `DATABASE_URL` (Supabase pooled + password)
2. `DIRECT_URL` (Supabase non-pooled + password)
3. `JOB_SIGNING_SECRET`
4. `STRIPE_SECRET_KEY`
5. `STRIPE_WEBHOOK_SECRET`
6. `TELNYX_API_KEY`
7. `TELNYX_WEBHOOK_SECRET`
8. `SMTP_USERNAME` (AWS SES IAM access key id)
9. `SMTP_PASSWORD` (AWS SES IAM smtp password)
10. `QSTASH_TOKEN`
11. `.env` file integrity — do not append `# comments after value=tokens`

---

## 3.2 Environment Matrix (Complete Zod Key List)

Source of truth = [env.ts](file:///C:/Users/mario/Documents/trae_projects/WarmHello/warmhello-app/lib/env.ts).
Template = [.env.example](file:///C:/Users/mario/Documents/trae_projects/WarmHello/warmhello-app/.env.example).

| Variable | Required | Type | Default value if unset | Dev (local laptop) | Staging (future) | Production |
|---|---|---|---|---|---|---|
| **NODE_ENV** | soft | `development` `test` `production` | `development` | `development` | `production` | `production` |
| **APP_URL** | soft | full URL incl scheme | `http://localhost:8080` | `http://localhost:8080` | `https://staging.warm-hello.com` | `https://warm-hello.com` |
| **NEXT_PUBLIC_APP_URL** | soft | full URL incl scheme (SENT TO BROWSER JS BUNDLE) | `http://localhost:8080` | `http://localhost:8080` | `https://staging.warm-hello.com` | `https://warm-hello.com` |
| **DATABASE_URL** | conditional | Postgres URI, pooled, starts `postgres://` | `undefined` (blank) → DB-disabled mode for pure front-end dev | Supabase dev branch pooled URI | Supabase staging branch pooled URI | Supabase main pooled URI (`*.pooler.supabase.com`) |
| **DIRECT_URL** | conditional | Postgres URI, non-pooled direct connect, starts `postgres://` | `undefined` (blank) | Supabase dev branch direct URI | Supabase staging branch direct URI | Supabase main direct URI |
| **JOB_SIGNING_SECRET** | ⚠️ **ABSOLUTELY REQUIRED** | min 32 characters, high-entropy random (NO DEFAULT) | Zod throws | min 32 chars, unique dev-only | min 32 chars, unique staging-only | min 32 chars, unique production only. **IF PROD ENV LEN <32 THE APP WILL NOT BOOT.** |
| **STRIPE_SECRET_KEY** | conditional | starts `sk_live_` or `sk_test_` | `undefined` → billing disabled | `sk_test_*` from Stripe test dashboard | `sk_test_*` | `sk_live_*` |
| **STRIPE_WEBHOOK_SECRET** | conditional | starts `whsec_` | `undefined` → webhook verify always fails (good, do not set unless you have an endpoint configured in Stripe) | test webhook `whsec_*` | test webhook `whsec_*` | live webhook `whsec_*` |
| **STRIPE_PRICE_ID** | conditional | single legacy default price id `price_*` | `undefined` | test mode default price | test mode default price | live default monthly (can be empty if USD/CAD specific vars below populated instead) |
| **STRIPE_PRICE_ID_USD_MONTHLY** | conditional | `price_*` USD monthly | `undefined` | test price | test price | live price |
| **STRIPE_PRICE_ID_USD_ANNUAL** | conditional | `price_*` USD annual | `undefined` | test price | test price | live price |
| **STRIPE_PRICE_ID_CAD_MONTHLY** | conditional | `price_*` CAD monthly | `undefined` | test price | test price | live price |
| **STRIPE_PRICE_ID_CAD_ANNUAL** | conditional | `price_*` CAD annual | `undefined` | test price | test price | live price |
| **TELNYX_API_KEY** | conditional | starts `KEY0*...` or `KEY1*...` per Telnyx v2 | `undefined` → SMS disabled | test profile API key | test profile API key | live messaging profile API key |
| **TELNYX_FROM_NUMBER** | conditional | E.164 format +1NNNNNNNNNN | `undefined` → SMS disabled | Telnyx test number | Telnyx staging number | Telnyx production 10DLC campaign number |
| **TELNYX_WEBHOOK_SECRET** | conditional | string returned when creating webhook in Telnyx portal | `undefined` → Telnyx webhooks not verified (reject all) | test webhook secret | test webhook secret | live webhook secret |
| **SHORT_LINK_BASE_URL** | conditional | URL scheme+host | `undefined` | `http://localhost:8080` | `https://staging.warm-hello.com` | `https://warm-hello.com` |
| **EMAIL_FROM_ADDRESS** | soft | RFC-5321 email address, address used as `From:` | `sales@warm-hello.com` | `sales-dev@warm-hello.com` | `sales-staging@warm-hello.com` | `sales@warm-hello.com` |
| **SMTP_HOST** | conditional | hostname | `undefined` → email globally disabled (no signup welcome, no password reset, no trial emails) | SES sandbox smtp hostname | SES smtp hostname | `email-smtp.us-east-1.amazonaws.com` or SES-sandbox-removed matching region |
| **SMTP_PORT** | conditional | integer positive, must match host | `undefined` | 465 | 465 | **465** (TLS mandatory wrapper, NO STARTTLS 587) |
| **SMTP_USERNAME** | conditional | string SES gives you | `undefined` → email disabled | SES sandbox IAM SMTP user key id | SES staging IAM SMTP user key id | SES production IAM SMTP user key id (AKIA…) |
| **SMTP_PASSWORD** | conditional | string | `undefined` → email disabled | SES sandbox SMTP password | SES staging SMTP password | SES production SMTP password (NOT console login; SMTP credential password only) |
| **QSTASH_URL** | soft | URL, scheme+host | `https://qstash.upstash.io` (always leave this default) | default | default | default |
| **QSTASH_TOKEN** | conditional | starts `Bearer…` → the Upstash token part (paste WITHOUT "Bearer" prefix; token is `Bearer <X>` header built internally) | `undefined` → jobs disabled, timers silent (qstash status in health endpoint will be false/red) | dev QStash token | staging QStash token | production QStash token |

### 3.2.1 Derived integration status flags
`/api/health` computes per-integration booleans from these env vars. True iff
the marked sub-vars are all non-empty.
| Health key "integrations.X" | True if |
|---|---|
| `prisma` | `DATABASE_URL` set |
| `stripe` | `STRIPE_SECRET_KEY` set AND `STRIPE_PRICE_ID` (or 1+ of 4 USD/CAD MONTHLY/ANNUAL price ids) set |
| `sms` | `TELNYX_API_KEY` set AND `TELNYX_FROM_NUMBER` set |
| `email` | `EMAIL_FROM_ADDRESS` set AND `SMTP_HOST` AND `SMTP_PORT` AND `SMTP_USERNAME` AND `SMTP_PASSWORD` all set |
| `qstash` | `QSTASH_TOKEN` set |

All 5 integrations=true in production. The app runs in "degraded" dev/demo mode with a subset false during front-end-only work.

---

## 3.3 Production `.env` file — minimum required block

Copy exactly this pattern (**UNQUOTED values only** — zod parser strips stray
wrapping quotes but keep paste-clean). Paste values without a trailing slash on
URLs.

```env
# ====== Node runtime ======
NODE_ENV=production

# ====== URLs ======
APP_URL=https://warm-hello.com
NEXT_PUBLIC_APP_URL=https://warm-hello.com
SHORT_LINK_BASE_URL=https://warm-hello.com

# ====== Database (Supabase pooled + direct) ======
DATABASE_URL=postgres://postgres.mjcgmecafwhlzqglcmqj:PLACEHOLDER_SUPABASE_POOLER_PASSWORD@aws-0-ca-central-1.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=15
DIRECT_URL=postgres://postgres.mjcgmecafwhlzqglcmqj:PLACEHOLDER_SUPABASE_DIRECT_PASSWORD@aws-0-ca-central-1.supabase.com:5432/postgres

# ====== Jobs / CSRF / Unsubscribe signing ======
# 1-time generation (run from laptop once): node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
# MUST BE >= 32 chars or app refuses to boot.
JOB_SIGNING_SECRET=PLACEHOLDER_JOB_SIGNING_SECRET_MIN_32_CHARS_GENERATED_VIA_NODE_ABOVE

# ====== Stripe LIVE ======
STRIPE_SECRET_KEY=<your-stripe-live-secret-key>
STRIPE_WEBHOOK_SECRET=<your-stripe-webhook-signing-secret>
STRIPE_PRICE_ID=price_xxxxxxxxxxxxxxxxxxxxxxxx       (leave blank if you use only the 4 specific ones)
STRIPE_PRICE_ID_USD_MONTHLY=price_xxx
STRIPE_PRICE_ID_USD_ANNUAL=price_xxx
STRIPE_PRICE_ID_CAD_MONTHLY=price_xxx
STRIPE_PRICE_ID_CAD_ANNUAL=price_xxx

# ====== Telnyx LIVE 10DLC SMS ======
TELNYX_API_KEY=KEY00000000000000000000000000000000
TELNYX_FROM_NUMBER=+15555551234
TELNYX_WEBHOOK_SECRET=PLACEHOLDER_TELNYX_WEBHOOK_SECRET

# ====== Email (AWS SES SMTP) ======
EMAIL_FROM_ADDRESS=sales@warm-hello.com
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=465
SMTP_USERNAME=AKIAIOSFODNN7EXAMPLE
SMTP_PASSWORD=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ====== Upstash QStash ======
QSTASH_URL=https://qstash.upstash.io
QSTASH_TOKEN=PLACEHOLDER_UPSTASH_QSTASH_TOKEN_PROD
```

After pasting, run a parse validation:
```bash
set -a ; . ./.env ; set +a
node -e "console.log('len JOB_SIGNING_SECRET=', '${JOB_SIGNING_SECRET}'.length)"
# Expect 32+ (64 if you used crypto.randomBytes(48).toString('base64url'))
```

---

## 3.4 Local Dev `.env` (Developer Laptop)
Minimal passable parse:
```env
NODE_ENV=development
APP_URL=http://localhost:8080
NEXT_PUBLIC_APP_URL=http://localhost:8080
DATABASE_URL=postgres://postgres:postgres-dev-db-password@localhost:5432/warmhello_dev
# or use Supabase dev branch pooled URL
DIRECT_URL=
JOB_SIGNING_SECRET=local-dev-only-min32-changeme-dontuseinprod123
```
All other keys blank = integrations disable themselves gracefully via health false. Front-end still renders; you can test pages without SMS/Stripe.

---

## 3.5 Changing an environment variable — live rollout procedure
Do NOT hot-edit `.env` and expect PM2 to pick it up automatically. It won't.

1. Edit `.env`
2. Confirm `chmod 0600 .env`
3. Rebuild + restart process (must rerun next build because some NEXT_PUBLIC_* vars are baked into the browser JS bundle at build time):
```bash
cd /home/admin/warmhello/warmhello-app/warmhello-app/
NODE_OPTIONS="--max-old-space-size=2048" pnpm exec next build
pm2 restart warmhello --time
sleep 25 ; curl -sS http://127.0.0.1:8080/api/health
```
Exceptions (keys NOT baked into build, so you can get away with `pm2 restart warmhello` skipping build if the only change was purely server-side keys like DATABASE_URL or SMTP_PASSWORD):
- Purely server-env keys (not prefixed NEXT_PUBLIC_*, and not referenced inside middleware.ts or route handlers that hit client bundle code) — still rebuild is *safer* and only 4 minutes; always rebuild for anything non-trivial.
