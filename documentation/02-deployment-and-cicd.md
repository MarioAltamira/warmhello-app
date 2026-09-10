# 02 — Deployment & CI/CD Pipeline

Warm-Hello has **no CI/CD**, **no staging environment**, and **no Terraform or IaC** today. Everything is manual `git pull → build → pm2 restart` executed over SSH. All environments are flat (single production instance, separate laptops for dev).

This document contains:
- §2.1 Build process (reproducible local build → build artifact → prod build)
- §2.2 Fresh environment provisioning (from zero to reachable)
- §2.3 Production deployment workflow
- §2.4 Staging vs. production paths (both = same blueprint, none in use today)
- §2.5 Rollback strategy (pinpoint sha rollback)
- §2.6 Recommended future CI/CD GitHub Actions starter YAML

---

## 2.1 Build Process

### 2.1.1 Toolchain
Prerequisites required on every build host (dev + prod identical):
```
node   ≥ 20 LTS
pnpm   10.17.1  (enforced by package.json "packageManager": "pnpm@10.17.1")
git    ≥ 2.38
Linux or macOS (Windows WSL2 Ubuntu 22+ also works for local dev)
```

If Node ≥20 but no `pnpm` yet:
```bash
corepack enable          # ships with node 16.18+, makes pnpm/yarn global
corepack prepare pnpm@10.17.1 --activate
```

### 2.1.2 One-shot local build (dev laptop verification)
```bash
cd warmhello-app/
cp .env.example .env        # Fill in at least JOB_SIGNING_SECRET ≥32 chars + DATABASE_URL valid
pnpm install --frozen-lockfile
pnpm exec prisma validate              # exit 0 required
pnpm exec prisma generate              # writes @prisma/client under node_modules
pnpm exec tsc --noEmit                 # exit 0 required (type check)
NODE_OPTIONS="--max-old-space-size=2048" pnpm build   # writes .next/
pnpm lint                              # exit 1 expected due to 7 pre-existing untouched lint errors (documented in §0, NOT a build gate)
```
Build artifact produced = directory tree: `.next/` (Next stand-alone output, NOT committed to git; regenerated every fresh build).

### 2.1.3 512 MB micro build constraint (CRITICAL — must read)
On 512 MB VM, Node's V8 default heap auto-sizes to ~380 MB; Next build phase
OOMs with exit 134 (SIGABRT) unless we raise `max-old-space-size` to **2048**
(V8 allows it, and the 2 GB swapfile absorbs evicted page cold).

Always prefix:
```bash
NODE_OPTIONS="--max-old-space-size=2048" <command>
```
Works on `pnpm install` (large install phases), `next build`, `next start`,
`prisma generate` (never broke without; harmless to include), `tsc --noEmit`
at very large project sizes.

---

## 2.2 Environment Provisioning (Fresh Lightsail VM from scratch)

Assumes brand new Debian 12 Lightsail micro instance created via AWS Console.
Connect SSH as `admin@PUBLIC_IPV4`.

### Step 1/7 — Update OS + add 2 GB swapfile (mandatory on micro)
```bash
set -euxo pipefail
sudo apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get -y dist-upgrade
sudo fallocate -l 2G /swapfile && sudo chmod 0600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo "/swapfile swap swap defaults 0 0" | sudo tee -a /etc/fstab
free -h ; swapon --show    # Verify Swap: total=2.00GiB
sudo apt-get install -y curl git build-essential ufw ca-certificates gnupg
```

### Step 2/7 — Install Node.js 20 LTS + pnpm 10.17.1 via nodesource
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v   # expect v20.x.x
corepack enable
corepack prepare pnpm@10.17.1 --activate
pnpm -v   # expect 10.17.1
```

### Step 3/7 — Install PM2 global and make it auto-start on reboot
```bash
sudo npm install -g pm2
pm2 --version
pm2 startup systemd -u admin --hp /home/admin
# paste the line it prints back (starts with "sudo env PATH=…")
```

### Step 4/7 — UFW firewall (extra defense even behind Lightsail firewall)
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw limit 22/tcp comment 'SSH (rate limited 6/30s)'
sudo ufw allow 80/tcp comment 'HTTP for Let us Encrypt / redirect'
sudo ufw allow 443/tcp comment 'HTTPS user traffic'
# DO NOT ufw allow 8080/tcp
echo "y" | sudo ufw enable
sudo ufw status numbered verbose
```

### Step 5/7 — Clone repo, install once
```bash
mkdir -p /home/admin/warmhello/warmhello-app/
cd /home/admin/warmhello/warmhello-app/
git clone https://github.com/MarioAltamira/warmhello-app.git
# Result: /home/admin/warmhello/warmhello-app/warmhello-app/  (double-nested historical path)
cd /home/admin/warmhello/warmhello-app/warmhello-app/
NODE_OPTIONS="--max-old-space-size=2048" pnpm install --frozen-lockfile
```

### Step 6/7 — Place `.env` with all production credentials
Copy from `03-configuration-and-environment-variables.md` §3.3. Verify file perms:
```bash
chmod 0600 .env
ls -la .env
# -rw------- 1 admin admin ... .env
```

### Step 7/7 — Bootstrap DB + first start
```bash
NODE_OPTIONS="--max-old-space-size=2048" pnpm exec prisma migrate deploy
NODE_OPTIONS="--max-old-space-size=2048" pnpm exec prisma generate
NODE_OPTIONS="--max-old-space-size=2048" pnpm exec next build
pm2 start "NODE_OPTIONS='--max-old-space-size=2048' pnpm exec next start -p 8080" --name warmhello --time
pm2 save
sleep 25
curl -sS http://127.0.0.1:8080/api/health
# Expect 200 with {"ok":true,"integrations":{"prisma":true,"stripe":true,"sms":true,"email":true,"qstash":true},"timestamp":"…"}
```

---

## 2.3 Standard Production Deployment Workflow (git push → SSH deploy)

Used after *every* new commit on `main`. Run inside an already-open admin SSH session on the Lightsail VM.

```bash
set -euo pipefail
cd /home/admin/warmhello/warmhello-app/warmhello-app/

# === 1/5 Snapshot previous state for easy rollback ===
PREV_SHA=$(git rev-parse HEAD)
echo "PREVIOUS_ROLLBACK_SHA=$PREV_SHA"
echo "Write this sha down — you can 'git reset --hard $PREV_SHA' if rollback needed."

# === 2/5 Fetch latest, reset working tree clean (discard any runtime local edits) ===
git fetch --all --prune
git reset --hard origin/main
git clean -fdx   # CAREFUL: removes any uncommitted files EXCEPT untracked .env (check .gitignore first; .env IS listed in .gitignore so safe)

# === 3/5 Install + Prisma ===
NODE_OPTIONS="--max-old-space-size=2048" pnpm install --frozen-lockfile
NODE_OPTIONS="--max-old-space-size=2048" pnpm exec prisma generate
# Run migrations ONLY IF prisma/migrations/ folder has new entries since last deploy:
NODE_OPTIONS="--max-old-space-size=2048" pnpm exec prisma migrate deploy
# (exit 0 with "0 pending" if no new migrations — safe to always run)

# === 4/5 BUILD + SWAP ===
NODE_OPTIONS="--max-old-space-size=2048" pnpm exec next build 2>&1 | tail -n 40
# Build success prints "(Static |  Dynamic |   λ  Server)" grid. No SIGABRT.
pm2 delete warmhello || true
pm2 start "NODE_OPTIONS='--max-old-space-size=2048' pnpm exec next start -p 8080" --name warmhello --time
pm2 save

# === 5/5 HEALTH CHECK (sleep 25s mandatory) ===
echo "sleeping 25 seconds for Next.js cold start"
sleep 25
for i in 1 2 3 4 5; do
  echo "--- attempt $i at $(date '+%H:%M:%S') ---"
  curl -sS http://127.0.0.1:8080/api/health || echo "(curl wait — Next still compiling routes)"
  echo ""
  sleep 5
done
echo "=== tail pm2 logs 100 lines ==="
pm2 logs warmhello --lines 100 --nostream --raw | tail -n 120
```

Timing: total deploy 5m 30s → 9m typical on 512 MB micro (build is ~3.5 → 6m; npm install dominates if many new deps; cold start after pm2 start = ~10 → 14s; hence mandatory sleep 25 before first curl to avoid false curl7).

---

## 2.4 Staging vs. Production (paths today + recommendation)

### Today: no staging
- Single branch = `main` is production. There is **no GitHub Actions, no preview deployments, no staging VPS, no staging DB**.
- Staging environment = developer laptop `pnpm dev` against `DATABASE_URL` dev-only Supabase branch. Dev DB branch should be created manually via Supabase Console → Database → Branches → "Create branch from main".

### Recommendation (medium-term, not blocking anything today)
Add a 2nd small Lightsail instance `staging-warmhello` with its own:
1. Separate `.env` → points DATABASE_URL at a Supabase staging branch DB clone, uses Stripe **test mode** SK keys, Telnyx **test messaging profile**, QStash `staging-` namespace token.
2. Separate PM2 process name `warmhello-staging` on port **8081** bind 127.0.0.1.
3. Deploy pipeline identical §2.3 but tracks `staging` branch instead of `main`.
4. Cutover promotion flow: `staging deploy → verify on URL → PR merge main → prod deploy`.

---

## 2.5 Rollback Strategy

Two rollback speeds depending on failure surface.

### A — Fast / Preferred: Roll back source code + rebuild (≤ 10 min)
When the NEW build boots but misbehaves (e.g., 500s on homepage, DB schema mismatch we can revert by applying schema backwards through prisma, new rate limiter too aggressive, etc.):

```bash
set -euo pipefail
cd /home/admin/warmhello/warmhello-app/warmhello-app/
# 1. Record the broken sha, snap previous good sha
BROKEN=$(git rev-parse HEAD)
echo "Broken deploy at $BROKEN"
# 2. Target = last known good. Pick one:
TARGET=PREV_SHA_YOU_WROTE_DOWN_IN_STEP_1      # (Recommended. You wrote it down!)
# — or —
TARGET=HEAD~1                                 # last commit (if you know 1 commit back is ok)
# — or —
TARGET=ea93ad2                                # named good sha from commit log

# 3. Hard reset and rebuild
git reset --hard $TARGET
git clean -fdx
NODE_OPTIONS="--max-old-space-size=2048" pnpm install --frozen-lockfile
NODE_OPTIONS="--max-old-space-size=2048" pnpm exec prisma generate
# Note: Prisma migrations DOWN requires manual resolve IF a broken migration was applied.
# Run prisma migrate status FIRST to see if down is needed, else skip.
NODE_OPTIONS="--max-old-space-size=2048" pnpm exec prisma migrate status
# If status says "1 migration applied but not in schema yet" → manual §4.2 procedure
NODE_OPTIONS="--max-old-space-size=2048" pnpm exec next build
pm2 delete warmhello || true
pm2 start "NODE_OPTIONS='--max-old-space-size=2048' pnpm exec next start -p 8080" --name warmhello --time
pm2 save
sleep 25 && curl -sS http://127.0.0.1:8080/api/health
```

### B — Instant / Emergency: Revert PM2 to previous build folder (≤ 1 min, only preserves 1 prior build)
If you had foresight to keep the previous `.next/` before overwriting with a new build:
```bash
# Run BEFORE new build, run this once per deploy as insurance:
cp -a .next .next.predeploy
# Then if new build fails:
rm -rf .next && mv .next.predeploy .next
pm2 restart warmhello --time
sleep 25 && curl -sS http://127.0.0.1:8080/api/health
```
Warning: This trick only works if no new migrations were applied between the two builds. If DB schema changed, the `.next.predeploy` code will emit Prisma "column X does not exist" errors and you must immediately move to Rollback A + manual Prisma migrate resolve down.

### C — Prisma-specific migration rollback (last resort, ≥ 30 min)
See §4.2 Database Migration Rollback procedure.

---

## 2.6 Future Recommended CI/CD — GitHub Actions Starter

Not configured today. Drop the following into `.github/workflows/ci.yml` to get
a **main-branch gate that blocks on type-check failure + invalid Prisma schema**.
Do NOT run `next build` on 2-core GitHub runners against 512 MB micro memory quota
(will pass but slow and costly). Add a deploy step via SSH deploy key only
**after** staging env exists.

```yaml
name: Warm-Hello CI
on:
  push:
    branches: [main, staging]
  pull_request:
jobs:
  typecheck-and-lint:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10.17.1
          run_install: false
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - name: Install
        run: pnpm install --frozen-lockfile
        env:
          NODE_OPTIONS: "--max-old-space-size=4096"
      - name: Fake minimal env (only vars needed for zod schema parse pass)
        run: |
          echo "JOB_SIGNING_SECRET=ci-only-dev-secret-min-32-characters-0123456789" > .env
      - name: Prisma validate
        run: pnpm exec prisma validate
      - name: Prisma generate
        run: pnpm exec prisma generate
      - name: tsc --noEmit (hard failure on any TS error)
        run: pnpm exec tsc --noEmit
      - name: Lint (informational, non-blocking due to 7 pre-existing untouched errors)
        run: pnpm lint || true
```
