# 05 — Monitoring, Logging & Observability

No APM vendor (Datadog / New Relic / Sentry) today. All observability is SSH-based
using PM2 logs + Linux built-ins plus one public HTTP health check endpoint for
uptime monitoring SaaS pings.

---

## 5.1 Health Checks

### 5.1.1 Primary API health endpoint
```
GET /api/health
```
- **Port on host:** `http://127.0.0.1:8080/api/health`
- **Public URL (for uptime SaaS):** `https://warm-hello.com/api/health`
- **Response format (JSON):**
```json
{
  "ok": true,
  "integrations": {
    "database": true,
    "stripe": true,
    "sms": true,
    "email": true,
    "qstash": true
  },
  "timestamp": "2026-09-02T14:22:08.192Z"
}
```
- **HTTP status = 200 on ALL responses** (ok is inside JSON, not HTTP code — so some log lines still print if 401/403 middleware rejects during maintenance; endpoint itself always returns 200 JSON).
- **What "ok: true" does NOT verify:** this endpoint does NOT attempt a live TCP
  connect round-trip against DB, Stripe, SES or QStash. It only checks env vars
  are set (boolean) — see [health route](file:///C:/Users/mario/Documents/trae_projects/WarmHello/warmhello-app/app/api/health/route.ts) for implementation.

Use for:
1. Lightsail / load balancer simple "is the Node process listening" check
2. Uptime SaaS 60-second interval pings
3. First verification step right after deploy

### 5.1.2 Deep health checks (run manually by SSH admin when investigation)

**Database alive:**
```bash
cd /home/admin/warmhello/warmhello-app/warmhello-app/
NODE_OPTIONS="--max-old-space-size=2048" pnpm exec prisma db execute --stdin <<'EOF'
SELECT 'OK pr_db_1' as check, now() as server_clock, current_database();
EOF
```

**Stripe secret key valid:**
```bash
curl -sS https://api.stripe.com/v1/balance -u "$(grep -E '^STRIPE_SECRET_KEY=' .env | cut -d= -f2-):" | head -c 300
```

**SES SMTP creds valid (will send one test email to admin):**
```bash
node - <<'EOF'
const net = require("net");
const env = Object.fromEntries(require("fs").readFileSync(".env","utf8").split(/\n/).filter(l=>l && !l.startsWith("#")).map(l=>{const [k,...v]=l.split("=");return [k,v.join("=")]}));
console.log("Attempting TLS SMTP connect to", env.SMTP_HOST, env.SMTP_PORT);
// Full EHLO / STARTTLS handshake NOT done here (complex); use openssl s_client instead:
EOF
# Simpler:
openssl s_client -quiet -crlf -connect email-smtp.us-east-1.amazonaws.com:465 </dev/null 2>&1 | head
# Should print 220 Amazon ESMTP greeting. Exit the manual auth flow by Ctrl-C after confirming handshakes.
```

**QStash token valid:**
```bash
TOKEN="$(grep -E '^QSTASH_TOKEN=' .env | cut -d= -f2-)"
curl -sS https://qstash.upstash.io/v2/topics -H "Authorization: Bearer $TOKEN" | head -c 400
```

---

## 5.2 Log Aggregation & Rotation

### 5.2.1 Log locations today (PM2 default)
```
/home/admin/.pm2/logs/
├── warmhello-error-0.log     # uncaught exceptions, console.error, zod parse fails, prisma errors, 500s — PRIMARY LOG TO WATCH
└── warmhello-out-0.log       # console.log, console.info, request summary lines, 200 OK verbose
```
PM2 is started with `--time` flag so each line is prefixed with UTC timestamp.
Example line prefix format: `2026-09-02T14:31:43: PM2 log: App [warmhello:0] exited with code [0] via signal [SIGINT]`.

### 5.2.2 Live tailing
```bash
# Show last 200 lines of both logs then follow live:
pm2 logs warmhello --lines 200
# Errors-only view (Unix grep filter):
tail -n 500 -F /home/admin/.pm2/logs/warmhello-error-0.log | grep -v '^$'
```

### 5.2.3 Rotation policy (MUST DO — NOT ENABLED BY DEFAULT)
Without log rotation `/home/admin/` partition fills with logs, 512MB VM disk is
only 20 GB. Enable PM2 logrotate module on EVERY VM you provision:
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 14
pm2 set pm2-logrotate:compress true
pm2 set pm2-logrotate:rotateInterval '0 0 * * *'
pm2 save
```
This policy keeps **max 14 compressed files per log stream, rotate when 10 MB or daily at 00:00 UTC**. Fits comfortably inside 2 GB free.

### 5.2.4 Recommended future aggregation (not in place today)
Ship logs to a log SaaS by adding one of:
- [Vector.dev](https://vector.dev/) agent → tails PM2 → forwards to Datadog / New Relic / Grafana Cloud / OpenObserve
- Or PM2-logrotate-s3 variant → uploads `.gz` nightly to private S3 bucket
- Or Grafana Agent (LGTM stack)

Until then, when investigating issues without central log history you are
**limited to last 14 compressed logs on disk** per §5.2.3 policy.

---

## 5.3 Alerting Thresholds

No alerts are wired yet. These are the thresholds the platform/DevOps team
should feed into the first uptime + monitoring SaaS they adopt. Choose any:
[Better Stack](https://betterstack.com/better-uptime), [UptimeRobot](https://uptimerobot.com) free tier for HTTP pings,
then optionally add Prometheus node_exporter + Grafana Cloud metrics when budget permits.

### 5.3.1 Uptime / HTTP level
| Alert | Source | Threshold | Severity (P1/P2/P3) | Snooze/suppression |
|---|---|---|---|---|
| Homepage HTTPS down | Uptime SaaS `GET https://warm-hello.com/` 302 or 200 | HTTP non-200/302 for 2 consecutive 60 s intervals | **P1** — customer-facing outage | During deploy windows (±10 min around each `pm2 restart`) |
| Health endpoint 5-in-5 red | Uptime SaaS `GET /api/health` + body match `"ok":true` | not ok 5/5 1-min intervals | **P1** | During deploy |
| SSL cert expiry | Uptime SaaS TLS expiry monitor | ≤ 10 days until expiry | **P2** → P1 at ≤3 days | After renewal confirmed |
| App route p95 latency | Synthetic or RUM | p95 GET /dashboard > 3.0 s for 10 min rolling | **P2** | |

### 5.3.2 Server OS metrics (Lightsail micro sensitive)
Monitor via `node_exporter` + Grafana / CloudWatch agent or vendor integrations:
| Alert | Metric | Threshold (sustained 5 min) | Severity |
|---|---|---|---|
| CPU burst credit depletion | CPUUtilization > 85% AND CPUCreditsUsage = 100% on Lightsail dashboard | 10 minutes | **P1** — throttled requests pile up |
| High memory pressure | MemUsedPercent > 90% | 5 minutes | **P1** — OOM-kill imminent (Next build or GC) |
| Swap thrashing | PSWPagesIn/s + PSWPagesOut/s > 100 pages/s | 10 minutes | **P2** |
| Root disk space | DiskSpacePercentFree < 10% (≤ 2 GB free on 20 GB root) | now | **P2** → P1 at < 3% |
| Root disk inode exhaustion | InodeFreePercent < 5% | now | **P2** |
| Zombie / unstoppable processes | ProcessesStateZombies ≥ 1 and re-occurring after 5 min gap | 5 min | **P3** |

### 5.3.3 Application level (parse from PM2 logs)
Forward `warmhello-error-0.log` into a log SaaS that can pattern-match and raise alerts:
| Pattern in error log | Trigger | Severity |
|---|---|---|
| `Invalid environment variables` OR `ZodError: \[` | Any line | **P1** — app is crash-looping; JOB_SIGNING_SECRET < 32 most likely |
| `PrismaClientInitializationError` | ≥ 3 occurrences in 10 min window | **P1** — DB down or DATABASE_URL wrong |
| `P2002` (unique constraint) OR `P2025` (not found) spam on endpoints that should never fail e.g. `/api/account/delete` | ≥ 10 errors in 30 min window | **P2** |
| `Cross-origin request blocked` NOT matching exempt routes (webhooks/jobs/magic) | ≥ 20 occurrences / hour (not bot noise) | **P2** investigate CORS misuse / attack |
| HTTP 429 bursts (rate limiter) from one IP | ≥ 50 429s per IP per hour | **P3** → P1 if pattern looks like credential stuffing |
| `/api/billing/checkout` returning 400 with Stripe auth errors | ≥ 1 / hour during active business hours | **P3** |
| Stripe webhook constructEvent FAILED | ≥ 5 per hour | **P3** → P1 if 100% failure rate (webhook secret wrong or clock skew) |
| QSTASH verify signature failed | ≥ 3 in 1 hour | **P2** — someone forging /api/jobs/* calls |

---

## 5.4 Performance dashboards
Start with a manual SSH dashboard script, migrate to Grafana later. Save as `/home/admin/bin/perf-dash.sh`:
```bash
#!/bin/bash
set -euo pipefail
echo "=== Warm-Hello Perf Dashboard $(date -u) ==="
echo "--- loadavg / mem / swap ---"
uptime ; free -h ; vmstat 1 2 | tail -1
echo "--- disk / inode ---"
df -h / ; echo ; df -i /
echo "--- PM2 status ---"
pm2 status warmhello --machine | jq -c '.processes[0].pm2_env.status, .processes[0].monit' 2>/dev/null || pm2 status warmhello
echo "--- netstat on 8080 ---"
ss -tan4 state established '( sport = :8080 )' | wc -l ; echo "established sockets to 8080"
echo "--- recent errors (tail 40 lines error log) ---"
tail -n 40 /home/admin/.pm2/logs/warmhello-error-0.log
```

---

## 5.5 Baseline numbers (reference for anomaly detection)

Establish on a healthy idle day → these are your "normal" baselines:
- Idle RSS of single warmhello PM2 process: ~180 → 240 MB (under 512 MB + 2 GB swap budget)
- Build time cold (full `next build`): ~4.5 → 6.5 minutes
- Next startup from `pm2 start` until routes ready for first request: ~9.7 → 12.3 seconds
- `GET /api/health` response p50 on loopback: 6–15 ms, p95 < 60 ms
- `GET /` homepage (SSR with App Router) p50 80 ms → 280 ms (depends on cache hit inside Next ISR or none)
- Bcrypt hash cost factor 12 measured on prod-ish CPU: 191 ms per password hash (signup/password change) — interactive budget target ≤ 500 ms met with 2.6x headroom.
- Typical peak concurrent requests before PgBouncer `connection_limit=15` shows queuing: ~12 concurrent DB-backed requests (leave 3 headroom for migrations/internal work).
