# Emergency Contacts & Escalation Path

Keep this page open during any P1 incident alongside §7.9 Disaster Recovery.
Call / escalate in this order.

---

## 8.1 Internal Escalation Path — Warm-Hello

| Step | Role | Name | Contact (phone / email) | Authority | Response SLA |
|---|---|---|---|---|---|
| 1 | Incident Commander / Primary on-call | PLACEHOLDER_PRIMARY_ONCALL_NAME | 📱 PLACEHOLDER_PHONE_PRIMARY / ✉️ PLACEHOLDER_EMAIL_PRIMARY | All decisions, final word | 15 min |
| 2 | Secondary on-call backup | PLACEHOLDER_SECONDARY_ONCALL_NAME | 📱 PLACEHOLDER_PHONE_SECONDARY / ✉️ PLACEHOLDER_EMAIL_SECONDARY | Fill if primary unreachable | 25 min |
| 3 | Owner / Executive signoff | PLACEHOLDER_OWNER_NAME | 📱 PLACEHOLDER_PHONE_OWNER | Legal communications, GDPR breach notice signoff, spend authorization for new VMs/licenses | 1 h |

---

## 8.2 Third-Party Vendor Support Channels

Each vendor's severity is mapped to Warm-Hello P1/P2/P3. Open a ticket with **exact**
ticket severity = matching column; vendors have SLA response windows per plan.

| Vendor | What they own for us | Support Portal URL | Severity to open ticket | Known account / plan IDs (fill placeholders) |
|---|---|---|---|---|
| **AWS Lightsail** | VM, attached block storage, VPC firewall, Static IP, Snapshot backups | [https://support.console.aws.amazon.com/support/home](https://support.console.aws.amazon.com/support/home) (Business plan required for < 1 h P1; free tier only forum) | VM unreachable / attach volume failure → P1 Business | Account ID PLACEHOLDER_AWS_ACCOUNT_ID. Region PLACEHOLDER_AWS_REGION. Lightsail instance name PLACEHOLDER_LIGHTSAIL_INSTANCE_NAME. |
| **AWS SES** | SMTP TLS relay, IAM SMTP users, DKIM/SPF signing, deliverability & bounce feedback loops | Same AWS support above → Create case → Service: Simple Email Service | Bounce rate > 10% on a campaign, or "550 Mailbox unavailable" for known-good recipients → P2 | Identity ARN: PLACEHOLDER_SES_IDENTITY_ARN. Region for SES: PLACEHOLDER_SES_REGION. SMTP username AKIA… last 4 digits PLACEHOLDER_SMTP_USER_LAST4. |
| **Supabase** | PostgreSQL hosting, PgBouncer, PITR backups, project auto-pause on free tier | [https://supabase.com/dashboard/support](https://supabase.com/dashboard/support) — Pro + Team plans have email SLA. | DB project in "Paused" state and cannot resume / restore failing / PITR restore hung → P1 Team/P1 Enterprise | Project Ref = `mjcgmecafwhlzqglcmqj` (this is the string embedded in role `postgres.mjcgmecafwhlzqglcmqj`). Org = PLACEHOLDER_SUPABASE_ORG_NAME. |
| **Stripe** | Billing, Checkout Sessions, Subscription state, Webhook signing | [https://support.stripe.com/](https://support.stripe.com/) | Billing outage (Checkout Session creation 100% failure rate with Stripe-side 5xx) → P1 Enterprise/Premium. Webhook signature 100% failure on app-side we handle first then escalate only if all docs checked. | Account ID (acct_…): PLACEHOLDER_STRIPE_ACCT_ID. Live mode publishable key prefix pk_live_… : PLACEHOLDER_STRIPE_PUBLISHABLE_KEY_PREFIX. |
| **Telnyx** | 10DLC SMS, 10DLC campaign registration, SMS webhooks, long-code numbers | [https://portal.telnyx.com/#/support/tickets](https://portal.telnyx.com/#/support/tickets) | 10DLC campaign approval delayed past T+14 biz days / SMS delivery ratio < 50% for ≥1h → P2 Pro | Messaging Profile ID: PLACEHOLDER_TELNYX_MSG_PROFILE_ID. Number order DID: PLACEHOLDER_TELNYX_FROM_DID. Connection Webhook ID: PLACEHOLDER_TELNYX_CONNECTION_ID. |
| **Upstash (QStash)** | Scheduled jobs and queue fan-out → calls our /api/jobs/* routes | [https://console.upstash.com/support](https://console.upstash.com/support) | QStash 429 rate limit on our token, or 100% delivery error rate → P2 Pro | QStash namespace (copy from console): PLACEHOLDER_UPSTASH_NAMESPACE. Last 6 chars of token stored in .env (NEVER full): PLACEHOLDER_QSTASH_TOKEN_LAST6. |
| **Domain Registrar** | warm-hello.com domain ownership, DNSSEC, nameserver glue records if self-hosted DNS | Registrars vary: GoDaddy → [godaddy.com/help](https://www.godaddy.com/help) ; Namecheap → [namecheap.com/support](https://www.namecheap.com/support/) ; AWS Route53 → same AWS account case as Lightsail | Nameserver change not propagating in 48 h, DNSSEC bogus, domain about to expire and auto-renew didn't run → P2 | Registrar name: PLACEHOLDER_DOMAIN_REGISTRAR. Registrant email on file: PLACEHOLDER_REGISTRANT_EMAIL. Expiry date (YYYY-MM-DD): PLACEHOLDER_DOMAIN_EXPIRY_DATE. Auth code (EPP): OFFLINE ONLY — stored in physical safe / 1Password vault, NOT in this doc. |
| **CDN / WAF (future if Cloudflare / Fastly adopted)** | TLS, WAF rules, cache eviction, DDoS mitigation upstream | [Cloudflare support](https://dash.cloudflare.com/?to=/:account/support) | DDoS layer-3/4 saturating the single micro instance, HTTPS cert issuance failing → P1 Business/ENT | Zone ID: PLACEHOLDER_CDN_ZONE_ID. Account: PLACEHOLDER_CDN_ACCOUNT_EMAIL. |

---

## 8.3 Legal / Compliance / Breach Notification Contacts

| Role | Name / Firm | Contact | Trigger |
|---|---|---|---|
| Data Protection Officer (EU GDPR rep if no in-house) | PLACEHOLDER_DPO_NAME | ✉️ PLACEHOLDER_DPO_EMAIL | User personal data breach → within 72h notify Supervisory Authority (Ireland/UK/DE where users live) |
| Outside Privacy & Corporate Counsel | PLACEHOLDER_LEGAL_FIRM | ✉️ PLACEHOLDER_LEGAL_EMAIL 📱 PLACEHOLDER_LEGAL_PHONE | Breach affecting ≥ 500 EU users, or regulatory inquiry, or PCI audit subpoena |
| Insurance (Cyber / E&O if policy in place) | PLACEHOLDER_INSURANCE_CARRIER | Claim # PLACEHOLDER_CYBER_CLAIM_PHONE | Ransomware incident, PCI forensic investigation required, or any incident > $10k damages estimate |
| PR / Communications lead | PLACEHOLDER_PR_CONTACT | ✉️ PLACEHOLDER_PR_EMAIL | Press inquiry about a breach or long outage |

---

## 8.4 P1 Incident Call Bridge Information

Keep pre-created and ready — do not fumble with setup during P1:
- **Zoom / Teams link:** PLACEHOLDER_INCIDENT_VIDEO_LINK
- **Bridge dial-in (US):** PLACEHOLDER_PHONE_BRIDGE (access code PLACEHOLDER_BRIDGE_PIN)
- **Shared live incident notes doc (Google Docs / Notion):** PLACEHOLDER_INCIDENT_NOTES_LINK
- **Public status page (Better Uptime / Instatus):** PLACEHOLDER_PUBLIC_STATUS_PAGE_URL (OPTIONAL — if none, use pinned @warmhelloco Twitter/X or LinkedIn account + update every 30 min during active outage)

---

## 8.5 Open a P1 incident checklist

Copy paste this list into the shared incident notes doc. Check off within first 15 min of declaration:

- [ ] Declare severity **P1** on video bridge, assign single Incident Commander.
- [ ] Scribe appointed (someone separate from IC writes timestamped notes).
- [ ] Host affected identified: `hostname -a` on lightsail + Supabase project status page captured (screenshots saved).
- [ ] Timeline: **When did it start happening? When was it first reported?** (minutes matter for PITR recovery target)
- [ ] Impact statement drafted: 1-sentence what's broken, % of users affected, ETA to preliminary fix.
- [ ] Communications: first 30-min-window status posted publicly (status page + socials) within 30 min of P1 declaration, updated every 30 min until resolved, final "resolved + postmortem forthcoming" post.
- [ ] Vendor tickets OPENED in parallel for each suspected vendor (DO NOT wait to open them sequentially; open all within 10 min).
- [ ] Snapshot VM disk + Supabase DB before any rollback attempt (forensics if later breach).
- [ ] Once fix applied, 15 min soak of live traffic, then close P1 → downgrade to P2 → P3 over following 24h.
- [ ] Within 3 business days → full Root Cause Analysis document + action items assignees. Share with leadership.

---

## 8.6 Placeholder Fill-In Table — Once Before Go-Live

Before you consider documentation complete, sit down with a text editor and replace every `PLACEHOLDER_*` token in the entire `documentation/` folder with actual values. The list below enumerates the tokens:

| Token name | Where it appears | How to get the real value |
|---|---|---|
| `PLACEHOLDER_LIGHTSAIL_HOSTNAME` | §01 architecture | `hostname -f` in SSH |
| `PLACEHOLDER_LIGHTSAIL_PUBLIC_IPV4` | §01, 02, 06, emergency contacts | `curl -4 ifconfig.co` |
| `PLACEHOLDER_LIGHTSAIL_PRIVATE_IPV4` | §01 | `hostname -I \| awk '{print $1}'` |
| `PLACEHOLDER_REGION` | §01 architecture | Lightsail Console → Instance → Region line |
| `PLACEHOLDER_MX_PROVIDER` | §01 DNS | Google Workspace / Fastmail / Microsoft 365 — pick one |
| `PLACEHOLDER_DKIM_SELECTOR` | §01 DNS | AWS SES → Verified Identities → DKIM section prints the 3 selector CNAMEs to create |
| `PLACEHOLDER_SUPABASE_POOLER_PASSWORD` | §03 env matrix production block | Supabase → Project Settings → Database → Pooler connection string |
| `PLACEHOLDER_SUPABASE_DIRECT_PASSWORD` | §03 env matrix production block | Same → Database → Session mode direct connection string |
| `PLACEHOLDER_JOB_SIGNING_SECRET_MIN_32_CHARS_GENERATED_VIA_NODE_ABOVE` | §03 env | `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |
| `PLACEHOLDER_TELNYX_WEBHOOK_SECRET` | §03 env | Telnyx portal → Connections → your webhook → Signing Secret |
| `PLACEHOLDER_UPSTASH_QSTASH_TOKEN_PROD` | §03 env | Upstash Console → QStash → Project → API Keys tab |
| `PLACEHOLDER_ENCRYPTED_BACKUPS_BUCKET` | §04 manual backup command | Create S3 bucket → copy bucket name |
| `PLACEHOLDER_PRIMARY_ONCALL_NAME / PHONE / EMAIL` | §8.1 | Your contact details + backup |
| `PLACEHOLDER_AWS_ACCOUNT_ID` | §8.2 vendor support | `aws sts get-caller-identity --query 'Account' --output text` |
| `PLACEHOLDER_AWS_REGION` | §8.2 vendor support | Console top-right us-east-1 etc |
| `PLACEHOLDER_LIGHTSAIL_INSTANCE_NAME` | §8.2 vendor support | Lightsail Console → Instances list |
| `PLACEHOLDER_SES_IDENTITY_ARN` | §8.2 vendor support | SES → Verified identities → click domain → ARN at top |
| `PLACEHOLDER_SES_REGION` | §8.2 vendor support | SES → drop down region selector |
| `PLACEHOLDER_SMTP_USER_LAST4` | §8.2 vendor support | `.env SMTP_USERNAME=AKIAxxxx` copy the last 4 chars of the 20 char key |
| `PLACEHOLDER_SUPABASE_ORG_NAME` | §8.2 vendor support | Supabase → Org switcher → Org name |
| `PLACEHOLDER_STRIPE_ACCT_ID` | §8.2 vendor support | Stripe Dashboard → top right avatar → Profile → Account settings → Account ID starts `acct_` |
| `PLACEHOLDER_STRIPE_PUBLISHABLE_KEY_PREFIX` | §8.2 vendor support | Stripe → Developers → API keys → Publishable key → copy `pk_live_…` first 12 chars |
| `PLACEHOLDER_TELNYX_MSG_PROFILE_ID` | §8.2 vendor support | Telnyx → Messaging → Messaging Profiles → click profile → URL path UUID |
| `PLACEHOLDER_TELNYX_FROM_DID` | §8.2 vendor support | `.env TELNYX_FROM_NUMBER=…` |
| `PLACEHOLDER_TELNYX_CONNECTION_ID` | §8.2 vendor support | Telnyx Portal → Connections → your app → UUID in URL bar |
| `PLACEHOLDER_UPSTASH_NAMESPACE` | §8.2 vendor support | Upstash Console → Namespace dropdown |
| `PLACEHOLDER_QSTASH_TOKEN_LAST6` | §8.2 vendor support | `.env QSTASH_TOKEN` last 6 chars |
| `PLACEHOLDER_DOMAIN_REGISTRAR / PLACEHOLDER_REGISTRANT_EMAIL / PLACEHOLDER_DOMAIN_EXPIRY_DATE` | §8.2 vendor support | WHOIS query + registar account → Domains → list |
| `PLACEHOLDER_CDN_ZONE_ID / PLACEHOLDER_CDN_ACCOUNT_EMAIL` | §8.2 vendor support | Populate only if Cloudflare/Fastly added later; leave as-is now |
| Legal/PR/Insurance rows in §8.3 | §8.3 | Populate if/when you retain outside counsel; leave today as TODOs |
| Video bridge / notes doc / status page | §8.4 | Create once, leave URL links here |
