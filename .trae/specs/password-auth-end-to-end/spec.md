# Spec: End-to-End Password Authentication + Change Password in Settings

## Problem
Currently Warm-Hello's Sign Up + Log In cards show password inputs ("Create a password" / "Enter your password") but the values are completely ignored by client submit handlers and never sent to any API route. No password hashing or storage exists in the database. All authentication falls back to magic-link emails, which:
1. Misleads users into believing their account has a "something-you-know" password defense layer when it doesn't.
2. Any attacker with temporary access to a user's Gmail inbox (unlocked laptop, stolen session) can log in silently with no audit trail of a password change / reset event.
3. Users who create passwords on signup and later attempt to log in with that password get a confusing experience: their password is silently discarded, a magic link is emailed anyway, but users don't understand why a password they created wasn't "recognized."

## Users
- **New sign-ups**: Family caregivers creating a Warm-Hello household. They create a password they expect to log in with later.
- **Returning subscribers**: ACTIVE/TRIAL/PAST_DUE/CANCELED subscribers returning to manage their household, check-ins, and billing. They enter the password they created on signup and expect it to be verified.
- **Users with forgotten passwords**: Subscribers who can't recall their password. They use the "Can't log in? Email me a secure sign-in link" flow and expect that link to let them SET A NEW PASSWORD (not just log them in silently without changing anything, so the next login can use the new password normally).
- **Authenticated subscribers in Settings**: Users who remember their password but want to rotate it (good hygiene, suspected breach, shared computer used).

## Goals
1. Make passwords actually work end-to-end: created at signup, verified on login, hashed & stored safely in Supabase, never sent to client.
2. Convert the existing magic-link "forgot" flow from a "log-in directly" behavior to the standard passworded-SaaS behavior: "email link -> land on SET A NEW PASSWORD page -> submit twice + complexity check -> password written -> then log in with it or redirect to Log In."
3. Add "Change password" card/section in Dashboard -> Settings that verifies the CURRENT password before allowing a NEW password to be set.
4. Remove all UI inconsistencies: the Log In button must now actually verify password (not ignore it), the magic login from email becomes a "set new password" flow NOT a direct log in flow.
5. Preserve defense-in-depth: constant-time hash verification, no password ever returned in API responses, bcrypt/scrypt with standard work factors, password-length complexity min 8 char requirement.

## Non-goals (intentionally out of scope)
- No TOTP / WebAuthn / Passkey / MFA second factors.
- No "Sign In with Google / Apple / OIDC SSO" social buttons.
- No password-strength live meter. Only min length + min 1 of uppercase/lowercase/digit/symbol classes as server check.
- No "remember this device" 30-day vs 1-day session extension UI. Existing session TTLs preserved.
- No admin password resets by sales@ via dashboard. Admin change still done via supabase SQL or new password-forgot flow same as user.
- No bulk password rotation enforcement / "Password expires every 90 days."
- No shared-household multi-user password per caregiver. Each subscriber account password is per primary account owner.

## Functional Requirements

### FR-01: Password column stored hashed + salted
Subscriber DB table has a nullable `password_hash` column (PostgreSQL `varchar(255)`). Only bcrypt work factor 10 (or Node.js native `crypto.scrypt` with per-row random 16-byte salt) hashes are stored. Plaintext passwords are never logged or persisted.

### FR-02: Sign Up creates password hash for new household subscriber
Existing Sign Up form (Full name + Email + "Create a password") on `/auth`:
- Client now INCLUDES the password value in the POST body to new `/api/subscribers` (or existing route).
- Server validates:
  - password length >= 8
  - contains at least 2 of: uppercase letter, lowercase letter, digit, non-alphanumeric symbol
  - max length 128
- Server runs constant-time `bcrypt.hash(password, 10)` → writes to new Subscriber row `password_hash`.
- If password fails validation → return 400 with inline field error "Use a password at least 8 characters with letters + numbers or symbols."
- Remaining signup flow (onboard redirect / magic emails) is unchanged.

### FR-03: Log In page now verifies password
Log In form on `/auth`:
- `handleLogin()` client now INCLUDES `password` string field in POST body to NEW `/api/auth/login` route.
- New server route `/api/auth/login` (POST):
  - Zod schema: `{ email: z.trim.toLowerCase.email, password: z.string.min(1).max(128) }`.
  - Lookup Subscriber by lowercase email.
  - If row missing OR `password_hash IS NULL` (legacy subscriber created before this deploy):
    - Return 401 generic: "Incorrect email or password. If you created your account before passwords were enabled, use 'Email me a secure sign-in link' to set your first password and log in." Never leak which of the two (email not found vs null hash) caused failure — prevents account enumeration.
  - If `password_hash` present: run `timingSafeEqual` bcrypt.compare against input.
    - Match: `createSubscriberSession()` write cookies → return `{ ok:true, redirect:"/dashboard" }`.
    - No match: 401 generic "Incorrect email or password." Log to security audit (not to client).
- Existing magic-link path (POST `/api/session` email-only): KEEP it working but ONLY for use-case where subscriber's `password_hash IS NULL` (legacy / not set yet). For password_hash set accounts → return 400 "Password is set on this account. Use Log In with your password, or click 'Forgot' to reset it via email." — so password-set accounts can NOT bypass their own password by just POSTing to the old email-only endpoint.

### FR-04: Forgot link flow becomes SET-NEW-PASSWORD flow (not direct log in)
Existing `/forgot` page ("Email me a secure sign-in link") → SENDS EMAIL but the magic link clicked goes to NEW `SET PASSWORD` page:
- NEW PAGE `/reset-password?token=…`:
  - Server page pattern same as `/auth/magic`: `async page await searchParams.token` sanitize → pass as string prop into `<ResetPasswordForm token=… />` (no Suspense, no useSearchParams).
  - Form with 2 password inputs: "New password" + "Confirm new password", CTA "Set new password".
  - On submit POSTs to NEW `/api/auth/reset-password` route with `{ token, newPassword, confirmPassword }`.
  - Server:
    1. Validate token against `auth_tokens` table `type = MAGIC_LOGIN` or NEW type `PASSWORD_RESET` (re-use existing infrastructure) — not expired, not usedAt.
    2. Validate newPassword == confirmPassword, length >= 8 class rules same as signup.
    3. If pass: write new bcrypt hash to subscriber.password_hash, set `token.usedAt = now()` atomically.
    4. Optionally send audit email "Your Warm-Hello password was recently changed."
    5. Return `{ ok:true, redirect:"/auth?mode=login&passwordReset=true" }` (or auto-login with session set, safer to redirect to log in page with a success banner).
- EXISTING MAGIC `/auth/magic?token=…` page behavior REPURPOSED to now do SET NEW PASSWORD flow same as /reset-password (the same component can be reused). If a legacy MAGIC_LOGIN token is used, we still show "Set a new password to secure your account" form, so users get hashed passwords after this deploy. This way post-deploy there is a one-time gentle enforcement of password column population for all users next time they use magic link.

### FR-05: Change Password card in Dashboard Settings
New **"Change your password"** section/card rendered in the settings page, inside `/dashboard/settings` inside an appropriate authenticated area:
- Render guard: ONLY if the user actually has a valid ACTIVE session.
- Form with 3 inputs:
  1. "Current password" (type=password)
  2. "New password" (type=password)
  3. "Confirm new password" (type=password)
- CTA: "Update password".
- On submit POST NEW `/api/auth/change-password` route with `{currentPassword, newPassword, confirmPassword}`:
  1. Session guard: owner session.
  2. bcrypt compare currentPassword vs stored hash.
  3. Validate new password length/classes, same as signup.
  4. New hash write to subscriber row.
  5. Return 200 { ok:true, message:"Password updated." }
  6. Optionally send password-changed audit email.
- If subscriber's password_hash IS NULL (legacy account that never set one yet): instead of the 3-input form, Settings shows a smaller variant: "Set your first password to secure your account (you currently log in via email link only)." → 2 inputs: New + Confirm, calls `/api/auth/reset-password` with a server-side generated token OR a special "set first password" server route authenticated by existing session. This is a soft onramp for legacy accounts, so they can set a password the next time they visit Settings without having to log out and use forgot.

### FR-06: Defense-in-depth security rules for all password endpoints
- All password APIs:
  - Rate limit 10 req/IP/minute via Upstash/Rate limit (or simple server timestamp Prisma log as a minimal first pass). (If we don't have an existing rate limiter in the repo, skip the rate limiter for MVP, but do NOT expose per-endpoint "why it failed" for account enumeration protection.)
  - All compare checks: constant time (bcrypt compare is always constant-time internally; ensure we don't do early return string ==).
  - Passwords max length 128 bytes before hashing (DoS guard on bcrypt with huge strings).
  - Log to security audit (if lib/security-audit.ts exists) — login success, login failed wrong password, password set, password change, password reset via token used. Do NOT log passwords.
  - Never return `password_hash` in any API response. Always explicitly select it out or strip before serialize.

## Non-functional Requirements
- NFR-01: TypeScript strict. `pnpm exec tsc --noEmit` pass at end.
- NFR-02: 0 new lint warnings.
- NFR-03: Prisma schema migration is backwards-compatible: new column `password_hash` nullable. Existing rows have NULL, which is handled gracefully by the login endpoint ("use email link" message).
- NFR-04: Existing magic-link token email template (trial-emails.ts) can be reused unchanged; only the page behavior when you click the link changes (from "direct log in" → "set / reset password page"). No need to redesign the email.
- NFR-05: Session cookies (subscriber-session.ts) preserved unchanged. After successful password login, create subscriber session exactly like magic login does today.

## Constraints
- **Constraint 1 (VERBATIM user): "this is a problem if password do nothing the anyone with my email can change my data"** — addresses by making passwords ACTUALLY REQUIRED for login on accounts that have a password_hash set.
- **Constraint 2:** User's current deployment commit 7814672 includes the fixed /forgot + /auth/magic server-async searchParams patterns; reuse those EXACT same patterns for new reset-password page. No Suspense, no useSearchParams.
- **Constraint 3:** Hashes use Node stdlib if possible. If a package is needed prefer no new deps — use Node.js built-in `crypto.scrypt` + per-row salt stored with hash in string format `$scrypt$N=16384,r=8,p=1$<b64 salt>$<b64 hash>`. If scrypt is ruled out, install bcryptjs (pure JS, no native build step needed on 512MB Lightsail micro, which often fails native bcrypt node-gyp builds). Prefer pure JS to avoid deploy build failures on micro.

## Assumptions
- Supabase PostgreSQL supports varchar(255) new nullable column via Prisma migrate with zero data loss / zero downtime for existing subscribers.
- Existing subscriber-session cookie logic works identically whether login came from magic link or password verify.
- No SMS text password reset codes offered. Only email token (per existing email-only system).
- Mail templates already have the correct Warm-Hello logo + legal footer from the Option A email fix.

## Open Questions
1. **OQ-1**: Should we install pure-JS `bcryptjs` or roll `crypto.scrypt`? (Recommendation: bcryptjs pure-JS, matches the industry standard for password hashing, no native compilation, proven on low-RAM micro instances.)
2. **OQ-2**: After successful password reset via token → should user be auto-logged-in (convenience) or redirected to /auth with "Password set. Now log in." banner (security, forces user to demonstrate they know the new password)? (Recommendation: Auto-log-in with new short session — standard for B2C SaaS, better UX, and security tradeoff is acceptable because the email token link already proved inbox ownership.)

## Acceptance Criteria

### rule AC-01: Sign Up endpoint hashes and persists password
When a new household is created via POST /api/subscribers with a `password` field in the request body:
- Response row Subscriber has password_hash set (Prisma select confirms non-null bcrypt or scrypt-formatted hash string).
- Row password_hash string starts with `$2a$` (bcrypt) or `$scrypt$` per choice made in Constraint 3.
- Logging / audit does NOT contain plaintext password values.

### rule AC-02: Log In endpoint rejects wrong + missing password uniformly (no enumeration)
When POST /api/auth/login with:
  a) correct email + WRONG password → 401 status + generic message "Incorrect email or password" (no specifics leaked)
  b) non-existent email + any password → 401 status + same exact generic message
  c) correct email + password for an account where password_hash IS NULL legacy → same 401 message + guidance to use forgot link to SET FIRST password
  d) correct email + CORRECT password → status 200 + set session cookies (SameSite/Lax/HttpOnly/Secure) + redirect to /dashboard.

### rule AC-03: Forgot → Email Link → Reset Password Page → Password Persists
End-to-end flow:
1. Go to /forgot → enter email → submit.
2. Magic link email sent (same template today).
3. Click link in email → lands on /reset-password (or /auth/magic repurposed form to "Set new password") with token valid.
4. Enter "Short1!" into new + confirm → validation error "at least 8 characters".
5. Enter "Abcd1234!" into new + confirm mismatch → error "Passwords do not match."
6. Enter "Abcd1234!" into new + confirm correctly → submit.
7. Row password_hash updated, token usedAt stamped.
8. Can log in via /auth Log In with email + Abcd1234! → 200 OK session.
9. Attempt to reuse the SAME reset-password token again → POST returns "This reset link was already used or has expired." and no password change occurs.

### rule AC-04: Change Password in Settings works for password-set accounts
Log in as an ACTIVE subscriber with known password_hash:
1. Go to Dashboard → Settings → "Change your password" card renders with 3 inputs.
2. Current password wrong, new and confirm valid → 401 "Current password is incorrect."
3. Current correct, new valid, confirm does not match new → 400 "Passwords do not match."
4. Current correct, new "too short" → 400 validation.
5. Current correct, new valid + match → 200 { ok:true, message:"Password updated." } → row password_hash new value written, old hash no longer verifies.
6. Next login: Old password → 401. New password → 200 login works.

### rule AC-05: Legacy accounts (password_hash NULL) get guided to SET their first password without friction
A subscriber row created BEFORE this deploy has password_hash NULL. For this account:
1. /auth Log In with any password → 401 generic + guidance "Use Email me a secure sign-in link to set your first password." No enumeration.
2. Use forgot flow → email link → set password page. After submit password set, then log in works (AC-02d).
3. (Bonus/Optional): Next time subscriber signs in via magic link before setting a password: the /auth/magic page shows "First, set a password to secure your account." page (the same reset password UI) with inputs New + Confirm password, so they immediately fill it and then the account is password protected.

### rule AC-06: TypeScript + Prisma validate clean
- `pnpm exec prisma validate` passes with updated schema.
- `pnpm exec tsc --noEmit` → 0 TS errors.
- 0 lint errors from `pnpm exec next lint` (or default lint).

### rubric AC-07: UX clarity (0-2; pass threshold = 2)
- 2: Every inline field error message is user-actionable and matches real server validation. Copy tells legacy users exactly why their "old password" doesn't work (never set).
- 1: Errors are OK but generic / no hint for legacy users.
- 0: Confusing "your password is wrong" for accounts that never had a password set.

### rubric AC-08: Audit trail quality (0-2; pass threshold = 1)
- 2: Security events written to existing security-audit.ts or a new audit table with timestamp, subscriber_id, IP, event type.
- 1: `console.info` lines in server routes with subscriber IDs for password-set/change/reset/use events.
- 0: No logging at all — no way to audit if account was recently password-changed during a future incident investigation.
