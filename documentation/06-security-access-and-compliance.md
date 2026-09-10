# 06 — Security, Access & Compliance

---

## 6.1 Access Control

### 6.1.1 Server access (SSH)

| Access type | Role(s) | Mechanism | Notes |
|---|---|---|---|
| SSH to Lightsail host | Owner / Admin (currently 1 person) | Ed25519 SSH keypair + password login DISABLED (`/etc/ssh/sshd_config PasswordAuthentication no`) | Default Lightsail Debian image ships key only — KEEP THIS — do not re-enable passwords. |
| Sudo on host | Owner / Admin | User `admin` in sudo group (password-less or password-on-sudo per Lightsail policy) | No secondary admins today. Add new users via `useradd -m -s /bin/bash <newadmin> ; usermod -aG sudo <newadmin>` + install their Ed25519 pubkey to `/home/<newadmin>/.ssh/authorized_keys` |
| MFA on SSH | **NOT ENABLED today** | Recommend: `google-authenticator-libpam` + TOTP on sudo (low-priority hardening; not required for ops handoff) | |

**Audit quarterly:**
```bash
# Who can login via SSH keys
grep -vE '^#|^$' /home/admin/.ssh/authorized_keys | wc -l
# Who is in sudo group
getent group sudo
# Last 5 successful SSH logins + last failed attempts:
last -5 -a
lastb -5 -a
```

### 6.1.2 Database access
| Who | Access | Mechanism |
|---|---|---|
| App server (Prisma ORM) | Read/write on ALL tables | Shared role `postgres.mjcgmecafwhlzqglcmqj` + password embedded in `DATABASE_URL` and `DIRECT_URL` |
| Manual ops team | Read + write, DDL | Supabase console → SQL Editor (web) OR `DIRECT_URL` `psql` CLI |
| Browser / end users | NO DIRECT DATABASE ACCESS | Supabase anon key + Supabase SDK entirely **disabled / unused**. All data access goes through app server endpoints with explicit row ownership checks via signed session cookies. |

### 6.1.3 Admin panels
- **No back-office / Django-style admin / Retool / Metabase dashboard deployed today.** Supabase Console → Table editor substitutes for ad-hoc manual ticket fixes.
- Application account delete endpoint exists (user self-service `/api/account/delete`). Support/ops-initiated delete requires direct SQL update via Supabase console until an admin panel is added.

### 6.1.4 Access rotation schedule (SHOULD policy)
1. SSH keypairs: rotate when an admin leaves OR every 12 months.
2. Supabase DB password (re-generate in Supabase Console → Project Settings → Database → Reset password for `postgres.mjcgmecafwhlzqglcmqj` role): **once per year OR on personnel change**. After reset, update `.env` DATABASE_URL + DIRECT_URL password segment → rebuild → `pm2 restart warmhello --time`.
3. Stripe secret key: rotate every 12 months. Old key revoked in Stripe Dashboard → Developers → API keys 5 minutes after new key activated on both server side `.env` STRIPE_SECRET_KEY + any embedded test keys.
4. AWS SES SMTP credentials (IAM user `ses-smtp-prod`): delete and regenerate SMTP password every 12 months.
5. JOB_SIGNING_SECRET: treat as any other signing secret — rotate every 6 months minimum. **When you rotate, be aware:** all outstanding unsubscribe links older than 1h expire, all in-flight onboarding grant tokens expire (10 min anyway so acceptable 6-min downtime once you pm2 restart), all existing v2 session cookies will have their signature fail → users are logged out (acceptable once per 6 months; if NOT acceptable → implement secret rotation with 2 keys then switch — out of scope today).

---

## 6.2 SSL/TLS & Domain Setup

### 6.2.1 HTTPS today — Lightsail managed
Warm-Hello runs behind Lightsail's managed HTTPS termination by default.
- **Inbound connection:** Browser ⇄ Lightsail public front (TLS 1.2+) ⇄ HTTP to our VM loopback 8080.
- **HSTS header** is added by app middleware at [middleware.ts:91-93](file:///C:/Users/mario/Documents/trae_projects/WarmHello/warmhello-app/middleware.ts#L91-L93): `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` (2 years).
- If you ever run on a non-HTTPS environment locally in `NODE_ENV=production` → middleware also injects HSTS. In local dev (http localhost) HSTS omitted.

### 6.2.2 Recommended production hardening — custom Certbot + nginx reverse proxy
When adopting a custom domain / naked www redirect / direct TLS:
1. Point A record at Lightsail public IPv4 per §1.3.4.
2. Install nginx + certbot:
```bash
sudo apt-get install -y nginx certbot python3-certbot-nginx
```
3. Drop nginx config `/etc/nginx/sites-available/warmhello`:
```nginx
server {
    server_name warm-hello.com www.warm-hello.com;

    # Security headers that nginx sets BEFORE app sees request (redundant with middleware but safe)
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Reverse proxy to Next.js loopback only (8080 NOT internet-reachable)
    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
        client_max_body_size 12m;
    }

    # ACME HTTP-01 challenge pass-through for certbot
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
}
```
4. Enable: `sudo ln -sf /etc/nginx/sites-available/warmhello /etc/nginx/sites-enabled/ ; sudo nginx -t && sudo systemctl reload nginx`
5. Issue certificate + auto-renew:
```bash
sudo certbot --nginx -d warm-hello.com -d www.warm-hello.com --redirect --hsts --uir --agree-tos -m admin@warm-hello.com
# certbot installs a systemd timer that auto-renews 30 days before expiry
```
6. Validate auto-renew: `sudo certbot renew --dry-run`

### 6.2.3 TLS protocols / ciphers (modern profile)
Certbot nginx auto-enforces TLS 1.2+, disables weak RSA-3DES suites. After install confirm with:
```bash
nmap --script ssl-enum-ciphers -p 443 warm-hello.com | grep -E "TLSv|Negotiation"
```
Acceptable → only `TLSv1.2` and `TLSv1.3` present, no `TLSv1.0` / `TLSv1.1`.

---

## 6.3 Compliance & Data Privacy

### 6.3.1 Personal Data Inventory (what the app stores, data classification)

| Table / Column | Data category | PII? | Retention | Deletion mechanism |
|---|---|---|---|---|
| `subscribers.email` | Contact email | ✅ Yes (EU GDPR art 4) | Until user account deleted OR 7y since last login without explicit opt-in marketing consent | `POST /api/account/delete` sets `deletedAt` + nulls; final purge after 30 days manual SQL run OR Supabase batch delete job |
| `subscribers.phoneNumber` | Mobile phone for SMS check-ins | ✅ Yes | Same as email above | Same delete endpoint nulls column |
| `subscribers.firstName / lastName / birthday` | Personal identifiers | ✅ Yes | Same | Same |
| `subscribers.address / city / postalCode / province / country` | Home address (optional, for alternate dispatch) | ✅ Yes | Same | Same |
| `households.name` | Household display name (often PII-adjacent, e.g. "Altamira Family") | ⚠️ Adjacent | Same | Cascaded to household deletion |
| `checkins.checkinAt / token / respondedAt / response` | Check-in response data, response can contain free-text "message" | ⚠️ Possibly PII if user writes PII (designed not to) | 2 years after user account deletion OR 7y from creation, whichever is shorter | `prisma.checkin.deleteMany({where:{subscriber:{email:...}}})` |
| `subscribers.passwordHash` | Bcrypt hash v12, NEVER PLAINTEXT | ⚠️ Credential-derived | Same as subscriber lifetime | Delete subscriber removes hash |
| `subscribers.passwordResetTokenHash` | Bcrypt 1-way hash of reset token | ⚠️ Credential-derived | TTL 1 hour at app level; row-level tokenExpiresAt expires; garbage cleanup SQL monthly prunes | Update NULL after token use or expiry |
| `authMagic` rows (future) | Magic link tokens (if path ever restored) | ⚠️ Credential-derived | 15-minute absolute TTL | Prisma deleteMany past expiration |
| `smsMessages` / `emailsSent` tables (if added) | Message logs | ✅ Possibly PII | 12 months after send then purge | Nightly batch SQL |

### 6.3.2 Encryption at rest
- **Database (Supabase):** AES-256 at rest enabled automatically by Supabase on all paid tiers; free tier too per AWS EBS encryption default under-the-hood.
- **Server disk:** AWS Lightsail root EBS volumes **encrypted by default** since 2023. Confirm via `aws lightsail get-instances --query 'instances[].{name:name,encryption:addOns[?name=="Auto Snapshot"].enabled}'` or console → Storage → Encrypted = Yes. If No → migrate plan by snapshot-restore onto an encrypted volume (mandatory for compliance).
- **Backups:** Supabase automated snapshots inherit at-rest encryption. If you take pg_dump locally per §4.3.2, encrypt them **before** uploading to 3rd party storage:
  ```bash
  age -r AGE_PUBKEY_YOURTEAM < warmhello-prod-backup-….dump > warmhello-prod-backup-….dump.age
  ```
- **Secret keys on disk:** `.env` `chmod 0600` — only. Not filesystem-encrypted separately (no LUKS / eCryptfs / fscrypt today; acceptable on single-owner single-VM, document gap).

### 6.3.3 Encryption in transit
- Browser ⇄ server: **TLS 1.2+**, HSTS 2yr pinned
- Server ⇄ Supabase Postgres: TLS `sslmode=require` by Prisma, port 5432
- Server ⇄ Stripe/Telnyx/QStash: HTTPS, TLS 1.2+, cert chain validated
- Server ⇄ SES SMTP: TLS wrapper on **port 465** (not STARTTLS 587; wrapper is mandatory — no cleartext handshakes)
- Session cookies: `HttpOnly; SameSite=Lax; Secure` flags when served HTTPS; `maxAge=7 days`. Cookie payload contains ONLY `subscriberId|issuedAtEpochMs` HMAC signature (no name/email/PII baked in).
- Passwords: `bcryptjs v3, cost=12`, unique salt per row, never visible in logs or API responses.

### 6.3.4 Laws & frameworks alignment (current status — "best effort, not audited")
- **GDPR (EU):** App supports:
  - Right of access (self-service dashboard shows account data → export JSON endpoint not built yet; ops manual SQL dump via Supabase console today)
  - Right to be forgotten → `POST /api/account/delete` endpoint sets subscriber.deletedAt + checkins anonymize
  - Unsubscribe of marketing email via `/unsubscribe/[token]` (GET → confirmation page → POST mutates state, 1h CSRF signed token)
  - Legal pages deployed: `/privacy`, `/terms`, `/data-processing-agreement`
- **CAN-SPAM / CASL (SMS + email):** Every marketing email has clear List-Unsubscribe header + one-click unsubscribe link (uses short-TTL tokens). Telnyx 10DLC SMS: STOP reply to opt-out handled by Telnyx profile auto-opt-out + sync to subscriber.subscribedAt = NULL via Telnyx webhook once added.
- **HIPAA / PHI:** App does NOT process PHI today (no insurance, diagnosis, prescription fields). If the roadmap ever adds medical-alert integration data flows → sign BAA with Supabase + Stripe + AWS first. Not applicable to today's system.
- **PCI DSS:** Payments flow via Stripe Checkout Sessions (hosted pages on stripe.com domain, never WARMHELLO server or browser JS touches card PAN). No card storage on servers, no PCI SAQ A-EP burden, falls under **SAQ A** level (easier). Maintain Stripe PCI attestation via Stripe compliance console; nothing local to Warm-Hello server beyond storing Stripe API keys.

### 6.3.5 Data breach response (§7.6 Troubleshooting also references)
If `.env` file exposure, database backup leak, or SSH key compromise is suspected:
1. Isolate instance: immediately add UFW deny-in rule to all but SSH admin IP OR stop PM2 process.
2. Rotate ALL 11 secret keys from §3.1.1 list — batch, in parallel via provider consoles.
3. Notify subscribers (legal: privacy@warm-hello.com + legal counsel) within statutory notification windows:
   - GDPR: ≤ 72 hours after discovery to Supervisory Authority
   - CCPA / US state breach laws vary, most 30–45 days to residents
   - PCI: if PAN ever exposed beyond hosted checkout → notify Stripe within 24 h
4. Log every step, preserve system state (snapshot Lightsail) for forensics, rebuild from clean backups.
