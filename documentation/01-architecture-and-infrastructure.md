# 01 — Architecture & Infrastructure Map

Warm-Hello (`warmhello-app`) is a standalone, single-instance Next.js 16 full-stack
application for family check-ins. It has no microservices, no kubernetes, no
service mesh, no internal queue daemon, and no load balancer today. It is a
"deploy a git pull + pm2 restart" topology.

---

## 1.1 System Diagram (Text)

```
   ┌───────────────────────────────────────────────────────────────────────┐
   │                         END USER / BROWSER                            │
   │  https://warm-hello.com  │  account pages │  checkout / settings     │
   └───────────────────────────┬───────────────────────────────────────────┘
                               │ HTTPS :443
                               ▼
   ┌───────────────────────────────────────────────────────────────────────┐
   │               AWS LIGHTSAIL SINGLE MICRO INSTANCE                     │
   │  Region/AZ:            us-east-1 (or PLACEHOLDER_AZ)                  │
   │  Hostname:             PLACEHOLDER_LIGHTSAIL_HOSTNAME                 │
   │  Public IPv4:          PLACEHOLDER_LIGHTSAIL_PUBLIC_IPV4              │
   │  Public IPv6:          (optional / disabled by default)              │
   │                                                                       │
   │  ┌─────────────────────────────────────────────────────────────────┐  │
   │  │  O/S + Resources                                                 │  │
   │  │   Distro          =  Debian GNU/Linux 12 (bookworm)             │  │
   │  │   Kernel          =  Linux 6.x (aws standard)                   │  │
   │  │   RAM             =  512 MB (447 MB usable)                     │  │
   │  │   Swap            =  2 GB file (always enabled; mandatory)      │  │
   │  │   vCPUs           =  1 shared                                   │  │
   │  │   Root Disk       =  20 GB SSD, 3 GB free (typical)            │  │
   │  │   Node.js runtime =  Node 20 LTS (required ≥ Next 16 min)      │  │
   │  │   Package mgr     =  pnpm 10.17.1 (packageManager field)       │  │
   │  │   Process mgr     =  PM2 (pm2) – manages Next.js stand-alone   │  │
   │  └─────────────────────────────────────────────────────────────────┘  │
   │                                                                       │
   │  ┌─────────────────────────────────────────────────────────────────┐  │
   │  │  APPLICATION STACK                                               │  │
   │  │                                                               │  │
   │  │   Port 8080 / TCP (bind 127.0.0.1 only)                      │  │
   │  │   ┌────────────────────────────────────────────────────────┐  │  │
   │  │   │  Next.js 16 "standalone" start (next start -p 8080)    │  │  │
   │  │   │   - App Router (App/ directory style, no pages dir)    │  │  │
   │  │   │   - React 19, TypeScript 5, Webpack bundler            │  │  │
   │  │   │   - In-memory single-process sliding-window rate limiter│ │  │
   │  │   │   - Sessions: HMAC-signed, v2 = subId|iat, 7d TTL      │  │  │
   │  │   │   - Passwords: bcryptjs v3, cost factor 12 (≈ 191 ms)  │  │  │
   │  │   │   - CSRF Origin/Referer check on all non-webhook POSTs │  │  │
   │  │   │   - HSTS / CSP / X-Frame / Permissions / COOP / CORP   │  │  │
   │  │   └───────────────────────────────┬────────────────────────┘  │  │
   │  │                                   │ localhost outbound only   │  │
   │  └───────────────────────────────────┼────────────────────────────┘  │
   │                                      │                               │
   │  APP REPO LOCATION (DOUBLE-NESTED – historical):                    │
   │     /home/admin/warmhello/warmhello-app/warmhello-app/              │
   │     ├── .env (secrets, MODE 0600 owner admin only)                 │
   │     ├── .next/ (build output, regenerated every deploy)            │
   │     ├── prisma/ (schema.prisma + migrations/)                      │
   │     └── package.json / pnpm-lock.yaml                              │
   └──────────────────────────────────────┬──────────────────────────────┘
                                          │ TLS outbound (egress :443)
                                          ▼
   ┌───────────────────────────────────────────────────────────────────────┐
   │                        EXTERNAL INTEGRATIONS                          │
   │  Each integration's status is surfaced via /api/health as a boolean  │
   │  "integrations": { prisma, stripe, sms, email, qstash }.            │
   │                                                                     │
   │  ┌─────────────────────────────────┐  ┌──────────────────────────────┐│
   │  │ SUPABASE POSTGRESQL (pooled)    │  │ STRIPE                      ││
   │  │ Host: aws-0-ca-central-1.pooler│  │ Billing · Checkout Sessions  ││
   │  │       .supabase.com :5432       │  │ Subscription mgmt            ││
   │  │ User: postgres.mjcgmecafwhlz…   │  │ Webhook: /api/webhooks/...   ││
   │  │ SSL-only, PgBouncer transaction │  │ Uses STRIPE_SECRET_KEY       ││
   │  │ mode. DIRECT_URL used for DDL.  │  └──────────────────────────────┘│
   │  └─────────────────────────────────┘  ┌──────────────────────────────┐│
   │                                        │ AWS SES (SMTP)               ││
   │  ┌─────────────────────────────────┐   │ email-smtp.*.amazonaws.com   ││
   │  │ TELNYX SMS                      │   │ Port 465, TLS mandatory      ││
   │  │ Outbound SMS delivery           │   │ SMTP_USERNAME = AKIA… IAM   ││
   │  │ Telnyx Messaging API v2         │   │ SMTP_PASSWORD = IAM smtp pass││
   │  │ Webhook: /api/webhooks/telnyx   │   │ From: sales@warm-hello.com   ││
   │  └─────────────────────────────────┘   └──────────────────────────────┘│
   │                                                                       │
   │  ┌─────────────────────────────────────────────────────────────────┐  │
   │  │ UPSTASH QSTASH                                                   │  │
   │  │ Scheduled jobs / cron (in-app timers use QStash, not node cron) │  │
   │  │ Posts to /api/jobs/*, authenticates via X-Job-Signature HMAC.   │  │
   │  │ Uses JOB_SIGNING_SECRET (min 32 chars, NO DEFAULT)              │  │
   │  └─────────────────────────────────────────────────────────────────┘  │
   └───────────────────────────────────────────────────────────────────────┘
```

No load balancer, no CDN, no Redis, no container runtime (no Docker, no OCI,
no containerd), no queue worker (no separate process, no BullMQ, no Sidekiq).
All background scheduling is delegated **externally** to Upstash QStash which
POSTs back into `/api/jobs/*`. Every inbound request (web page, API, webhook)
terminates in the **same single** Next.js Node process under PM2.

---

## 1.2 Hosting & Resources

| Item | Value |
|---|---|
| Cloud provider | AWS Lightsail |
| Instance plan | **$3.50/month / 512 MB / 1 vCPU / 20 GB SSD** (micro) |
| Region / AZ | `PLACEHOLDER_REGION` — e.g. `us-east-1a`. Retrieve with `aws lightsail get-instances` on CLI or Lightsail Console → Instance → Details tab. |
| Distro / OS | **Debian 12 (bookworm)** |
| Installed prerequisites | Node.js 20+ LTS, pnpm 10.17.1 (corepack enable required if node <22), git, PM2 global, 2 GB swapfile |
| Swapfile | **Mandatory**. Location `/swapfile` 2 GB, `swapon` in `/etc/fstab`. Without swap, Next build reliably OOMs with SIGABRT at ~170 MB RSS even with `max-old-space-size=2048`. |
| Container / Runtime | No containers. Node.js **bare metal on host OS**. `next start -p 8080` is the process. |
| Reverse proxy | NONE TODAY. App listens on loopback 127.0.0.1:8080. Lightsail default networking exposes the public IP via its own managed frontend / HTTPS wrapper. If custom TLS/Certbot is ever added, install nginx or caddy and proxy_pass 8080. |
| Disk free threshold | Warn at < 4 GB, critical at < 2 GB. `.next/cache/webpack` and `node_modules` dominate space. |
| CPU burst budget | Very low on micro plan. Sustained >80% CPU over 10 min → Lightsail starts throttling burst credits → latency 3× normal. Threshold documented in §5.3. |

---

## 1.3 Network Topology

### 1.3.1 IP allocations
```
Public IPv4 (Lightsail Elastic IP):  PLACEHOLDER_LIGHTSAIL_PUBLIC_IPV4   (SSH + HTTPS from internet)
Private IPv4 (VPC / Lightsail VPC): PLACEHOLDER_LIGHTSAIL_PRIVATE_IPV4  (irrelevant single-node, no peering)
IPv6:                               disabled-by-default (enable only after CSP tested)
```
> Update placeholders by running on the SSH host:
> ```bash
> curl -4 ifconfig.co          # Public IPv4
> hostname -I                 # Private + VPC
> ```

### 1.3.2 Port requirements

Open firewall **INBOUND** (Lightsail console → Networking → Firewall):

| Port | Protocol | Source CIDR | Purpose | Required? |
|---|---|---|---|---|
| 22 | TCP | `0.0.0.0/0` (restrict to admin office IP in Stage 2 hardening) | SSH admin access | Yes, mandatory today |
| 80 | TCP | `0.0.0.0/0`, `::/0` | HTTP-01 ACME (Certbot) + redirect to HTTPS | Yes if custom TLS; no if using Lightsail managed HTTPS only |
| 443 | TCP | `0.0.0.0/0`, `::/0` | HTTPS user traffic | Yes (user-facing) |
| 8080 | TCP | **127.0.0.1/32 only, NOT WIDE OPEN** | Node.js Next.js stand-alone listener. NEVER expose 8080 to the internet; always loopback only or filtered to reverse-proxy host. | Yes, but do NOT add to Lightsail firewall |

OUTBOUND EGRESS (required by the app for integrations, DNS already open in default Lightsail):

| Port | Protocol | Dest | Purpose |
|---|---|---|---|
| 53 | UDP+TCP | AWS/VPC resolver / 8.8.8.8 fallback | DNS (do not block — Next build fetches packages via pnpm using DNS) |
| 443 | TCP | `*.supabase.com` `*.pooler.supabase.com` | Postgres over TLS via PgBouncer (all DB is TLS) |
| 443 | TCP | `api.stripe.com` `js.stripe.com` `checkout.stripe.com` `hooks.stripe.com` | Stripe billing + hosted checkout links + webhook signing |
| 443 | TCP | `api.telnyx.com` | Telnyx SMS sends outbound check-in links |
| 465 | TCP | `email-smtp.*.amazonaws.com` | SES SMTP TLS send (password auth via IAM creds) |
| 443 | TCP | `qstash.upstash.io` `*.qstash.upstash.io` | Upstash QStash schedule + publish |
| 443 | TCP | `registry.npmjs.org` `get.pnpm.io` `nodejs.org` `github.com` | Only needed during build / deploy (pinned versions via lockfile) |

### 1.3.3 Firewall / Security group rules (Lightsail default firewall)
Default template rules already work; for hardening additionally add:
1. Restrict SSH :22 CIDR from `0.0.0.0/0` → `/32` admin workstation static IP.
2. Confirm `8080` is NEVER in the firewall list (double-check this; leaks kill CSRF defense).

### 1.3.4 Domain & DNS

| Record | Type | Target / Value | TTL |
|---|---|---|---|
| `warm-hello.com` | **A** | `PLACEHOLDER_LIGHTSAIL_PUBLIC_IPV4` | 300 (5 min, low for rollover) |
| `www.warm-hello.com` | CNAME | `warm-hello.com.` | 300 |
| (optional mail) | MX | `PLACEHOLDER_MX_PROVIDER` e.g. `aspmx.l.google.com` for Google Workspace if using Google mail | 3600 |
| (DKIM/SES) | `PLACEHOLDER_DKIM_SELECTOR._domainkey` | CNAME → AWS SES DKIM record generated in SES console → Verified identities → DKIM tab | 1800 |
| (SPF/TXT) | `warm-hello.com TXT` | `"v=spf1 include:amazonses.com ~all"` (combine carefully if using other MX providers, use `~all` during cutover then `-all` after confirmed) | 3600 |
| (DMARC/TXT) | `_dmarc.warm-hello.com TXT` | `"v=DMARC1; p=quarantine; sp=quarantine; rua=mailto:postmaster@warm-hello.com; pct=100"` → after 30 days green → `p=reject` | 3600 |

Confirm DNS live from your laptop before first HTTPS cutover:
```bash
dig +short A warm-hello.com
dig +short CNAME www.warm-hello.com
dig TXT +short warm-hello.com
```

---

## 1.4 Horizontal Scaling Caveat (Today = NOT SUPPORTED)

The rate limiter uses an in-memory `Map<string, number[]>` — no Redis. On a
single PM2 process this is deterministic and works. If a second Lightsail VM
or a second `pm2 start -i max` (cluster mode) is ever added:
1. Session cookies still work (they are HMAC-signed + server-verified, not server-stored).
2. **Rate limiter buckets will not synchronize**, meaning each process will track rates independently → limits become effectively N× looser per load balancer split.
3. Fix: move `lib/rate-limit.ts` from `Map` → Upstash Redis or use Upstash `SET` + `EXPIRE` `INCR` Lua sliding window.

Until this is addressed, **only run a single PM2 process, single VM instance**.
Do not add horizontal replicas before swapping the rate limiter store.
