# Tasks: Password Auth End-to-End

This plan maps every Acceptance Criterion in `spec.md` to atomic, dependency-ordered vertical slices. Priority `high` = gating for launch; `medium` = nice-to-have before launch.

---

## Task 1: Prisma schema `password_hash` column + migration SQL

**Priority:** high  
**Dependencies:** none  
**Acceptance Criteria Covered:** AC-01, AC-06  
**Files to change:** `warmhello-app/prisma/schema.prisma` (+ auto-generated migration in `prisma/migrations/YYYYMMDD_*`)

### Work Description
1. In `Subscriber` model inside schema.prisma add one new nullable column:
   ```prisma
   passwordHash  String?  @db.VarChar(255)  @map("password_hash")
   ```
2. Run `pnpm exec prisma migrate dev --name add_subscriber_password_hash --create-only` to generate a migration SQL file WITH `ALTER TABLE "Subscriber" ADD COLUMN "password_hash" VARCHAR(255);`. Do NOT apply the SQL to production Supabase during migrate dev (local only or --create-only so DBA can review). Commit both the Prisma schema change and the generated migration.
3. Run `pnpm exec prisma generate` to refresh Prisma client types so TypeScript `Subscriber.passwordHash?: string | null` is available.

### Test Requirements
- **rule TR-1.1:** `pnpm exec prisma validate` passes with exit 0.
- **rule TR-1.2:** `pnpm exec prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script` output shows ONLY the 1 new nullable column ALTER — no other schema drift (uniques, indexes, other columns).
- **rule TR-1.3:** Running the migration on a copy of prod Supabase schema with existing Subscribers — existing rows get `password_hash = NULL`; migrate status success, zero data loss.
- **Completion Evidence:** Output of `prisma validate` (exit 0), schema.prisma diff showing the single new line, prisma generate output confirming client regeneration.

---

## Task 2: Add pure-JS password hashing helpers (`lib/password.ts`) + install bcryptjs

**Priority:** high  
**Dependencies:** Task 1 complete  
**Acceptance Criteria Covered:** AC-01, AC-02, NFR-05 (no native build)  
**Files to change:** new `warmhello-app/lib/password.ts`; modify `warmhello-app/package.json` (new dep `bcryptjs` + dev types `@types/bcryptjs`); modify `warmhello-app/pnpm-lock.yaml` via pnpm install.

### Work Description
1. Install bcryptjs pure-JS (no node-gyp, no native build) + dev types:
   ```
   pnpm add bcryptjs@^2.4.3
   pnpm add -D @types/bcryptjs
   ```
2. Create `lib/password.ts` that exports:
   - `hashPassword(plaintext: string): Promise<string>` — wraps bcrypt.hash with work factor 10, input validation: max 128 chars, throws if empty or >128.
   - `verifyPassword(plaintext: string, hash: string | null | undefined): Promise<boolean>` — bcrypt.compare. Returns `false` immediately (constant-time-ish) if hash is null (legacy account) so caller can return generic 401 rather than leaking the null-hash status.
   - `validatePasswordStrength(pwd: string): { valid: boolean; error?: string }` — server-side validation rules: length >= 8 && <= 128; contains at least 2 of [A-Z, a-z, 0-9, !@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?].
3. Helper NEVER logs passwords or includes them in any error messages.

### Test Requirements
- **rule TR-2.1:** TypeScript `pnpm exec tsc --noEmit` shows 0 errors after package install + helper write.
- **rule TR-2.2:** Local smoke via Node REPL: `await hashPassword("Abcd1234!")` returns a string starting with `$2a$10$` (bcryptjs marker).
- **rule TR-2.3:** `await verifyPassword("Abcd1234!", result22) === true`; `await verifyPassword("wrong", sameHash) === false`; `await verifyPassword("anything", null) === false`.
- **rule TR-2.4:** `validatePasswordStrength("short1")` → `valid:false, error:"at least 8 characters"`.
- **rule TR-2.5:** `validatePasswordStrength("12345678")` → `valid:false, error:"need letters + numbers or symbols"` (no 2-class rule met — all digits → only 1 class).
- **rule TR-2.6:** `validatePasswordStrength("Abcdefgh")` → `valid:false` (lower+upper = 2 classes, but no digit/symbol; we should make the rule actually require one char from at least two distinct categories — so this should PASS because uppercase+lowercase = 2 classes. Test this per design.)
- **Completion Evidence:** REPL output of hash/verify; validation function unit-call results in dev server logs or inline test log.

---

## Task 3: New `/api/auth/login` (password verify → set session)

**Priority:** high  
**Dependencies:** Tasks 1 + 2 complete  
**Acceptance Criteria Covered:** AC-02 (a, b, c, d)  
**Files to change:** new `warmhello-app/app/api/auth/login/route.ts`; possibly small tweaks in `lib/subscriber-session.ts` to export existing session create logic if it's not already exported for reuse.

### Work Description
1. Create POST handler `app/api/auth/login/route.ts`:
   - `NextRequest` body: `{ email: string, password: string }`, validated with Zod:
     - `email: z.string().trim().toLowerCase().email()`
     - `password: z.string().min(1).max(128)`
   - Session guard: NOT already logged in (or allow re-auth anyway, simple).
   - Lookup `subscriber = await prisma.subscriber.findUnique({ where: { email }})` — select `passwordHash` explicitly.
   - **Account-enumeration-proof logic:**
     - If `subscriber === null` → do NOT return early; synthesize a fake password hash comparison (run bcrypt compare against a fixed dummy hash + random delay) so attacker can't distinguish "email doesn't exist" from "wrong password" by request timing or response shape. Return same 401 generic message: `{ ok:false, message:"Incorrect email or password." }`.
     - If `subscriber` exists but `subscriber.passwordHash === null` → `return NextResponse.json({ ok:false, message:"Incorrect email or password. If you created your account before passwords were enabled, use 'Email me a secure sign-in link' to set your first password and log in." }, { status:401 })`.
     - If `passwordHash` set: `await verifyPassword(reqBody.password, subscriber.passwordHash)`. If match → call the existing `createSubscriberSession` logic (from `lib/auth.ts` or wherever it lives that sets refresh + access cookies). Return 200 `{ ok:true, redirect:"/dashboard" }`. If not match → 401 same generic enumeration-safe message.
   - Log to console.info (to PM2 out.log) non-sensitive info only: `[auth-login] result=ok subscriber_id=... ip=... ua_family=...` / `result=wrong_password subscriber_id=...` / `result=no_subscriber_or_wrong_email`.
2. Make absolutely NO reference to passwords in the JSON response beyond messages specified above.

### Test Requirements
- **rule TR-3.1 (AC-02b):** POST {"email":"does-not-exist@example.com","password":"any"} → status 401 + message "Incorrect email or password." (No "account does not exist" leaked.)
- **rule TR-3.2 (AC-02c):** POST {"email":"legacy-null-hash@example.com","password":"any"} → 401 + message exactly guides user to use forgot link.
- **rule TR-3.3 (AC-02a):** POST {"email":"correct@example.com","password":"WRONG"} → status 401 + same generic enumeration-safe message as non-existent email. Response length difference between 3.1 and 3.3 <= 20 bytes (prevents side-channel).
- **rule TR-3.4 (AC-02d):** POST {"email":"correct@example.com","password":"Abcd1234!"} → status 200 + set-cookie headers contain refresh + access (via pattern `Set-Cookie: __Secure-auth_refresh=...` and `auth_access=...`). Body `ok:true, redirect:"/dashboard"`.
- **rule TR-3.5:** Rate limit: no new brute attempts if client hits more than 10 401/minute from same x-forwarded-for IP. (Optional — if no existing rate limiter yet, mark this as a later task and TR-3.5 can be waived for MVP with TODO comment.)
- **Completion Evidence:** curl commands with output headers + response body of all 4 cases; Set-Cookie visible for success.

---

## Task 4: Signup `/api/subscribers` write passwordHash on new household create

**Priority:** high  
**Dependencies:** Task 1, 2  
**Acceptance Criteria Covered:** AC-01  
**Files to change:** `warmhello-app/app/api/subscribers/route.ts`. Client form submit `components/onboarding-form.tsx` (only to start SENDING the password value in POST body — previously it was read, validated for minimum length locally, then ignored).

### Work Description
1. **Server `POST /api/subscribers` route.ts**:
   - Extend Zod request body schema to include optional (for backward compat) `password?: string`. If present: run `validatePasswordStrength(password)`. If invalid → 400 `{field: "password", message: error}`. If valid → run `hashPassword(pwd)`; store in prisma create data `passwordHash: hashedValue`.
   - If password omitted (e.g. older mobile client calling the route): leave passwordHash NULL (legacy accounts). No break.
2. **Client `onboarding-form.tsx` submit handler**:
   - In `handleSubmit()` build POST body JSON with the `password` field the user actually typed into the password input box (not empty). So server receives the password to hash.
   - Client-side minimum validation before submit: same 8 chars length warning inline in statusMessage.

### Test Requirements
- **rule TR-4.1:** POST subscriber with password "Short" → 400 password error.
- **rule TR-4.2:** POST subscriber with password "Abcd1234!" → 200 ok, prisma query `password_hash NOT NULL` on that row AND starts with `$2a$10$`.
- **rule TR-4.3:** Newly created subscriber can immediately log in via Task 3 `/api/auth/login` with their password.
- **rule TR-4.4:** POST subscriber without password field (backward compat) → row created passwordHash NULL; same as legacy.
- **Completion Evidence:** curl POST to /api/subscribers (or via UI form submit → devtools network → payload JSON shows password key; Postgres SELECT showing password_hash column filled bcrypt marker).

---

## Task 5: Rewire Log In client form to POST `/api/auth/login` with password (not the old `/api/session` email-only path)

**Priority:** high  
**Dependencies:** Task 3 complete  
**Acceptance Criteria Covered:** AC-02 (UI integration)  
**Files to change:** `warmhello-app/components/auth-page-content.tsx:handleLogin()` line 105-138

### Work Description
1. Modify `handleLogin()` (the "Log In" button click) to:
   - Read the password field: `loginForm.password`.
   - Validation before submit locally: if password is empty → `setLoginStatus("Enter your password. If you created your account before passwords, use 'Email me a secure sign-in link' below to set one.")` return;
   - POST to `/api/auth/login` instead of the old `/api/session`.
   - Body: `{ email: trimmedEmail, password: loginForm.password }`.
   - On 200 `ok:true`: router.push `/dashboard` as before.
   - On 401: show response message in status bar inline (inline the guidance string for legacy users).
   - Apply AbortController 20s timeout pattern consistent with other forms.
2. Update footer copy of "Can't log in? Email me a secure sign-in link" — keep text as-is or optionally rename to "Forgot password or first-time login?" for clarity (minor copy tweak optional).

### Test Requirements
- **rule TR-5.1:** Fill Log In form email + wrong password → inline red error "Incorrect email or password."
- **rule TR-5.2:** Fill Log In form email for legacy account (null hash) + any password → inline error contains guidance string "Email me a secure sign-in link to set your first password."
- **rule TR-5.3:** Fill Log In form correct email+password → success: router navigates to `/dashboard` without ever sending a magic link email (network monitor shows 0 call to /api/session).
- **rule TR-5.4:** Empty password field submit → inline message, no POST sent.
- **Completion Evidence:** DevTools Network tab screenshots of /api/auth/login POST for all 4 cases; navigation changes.

---

## Task 6: Forgot → email link → Set New Password page (new `/reset-password?token=…`) + `/api/auth/reset-password`

**Priority:** high  
**Dependencies:** Tasks 1, 2, 3  
**Acceptance Criteria Covered:** AC-03, AC-05  
**Files to change:**
- New `warmhello-app/app/(site)/reset-password/page.tsx` (SERVER async page)
- New `warmhello-app/app/(site)/reset-password/reset-password-form.tsx` (CLIENT `"use client"` form)
- New `warmhello-app/app/api/auth/reset-password/route.ts` (server POST handler)
- Modify `warmhello-app/lib/trial-emails.ts:sendPasswordResetLinkMagicEmail` → change the button href from the old `/auth/magic?token=` → `/reset-password?token=` (this is THE line that makes the forgot email now go to set-new-password, not to direct-log-in).
- (Optional) Keep old `/auth/magic` page working too but have it redirect to `/reset-password?token=` with same query token so old bookmarked magic links still function → repurposed to set-password flow.

### Work Description
1. **New server page `reset-password/page.tsx`**: Exact same canonical pattern as `/forgot` and `/auth/magic` from commit 6db120a + 7814672 — `async function ResetPasswordPage({ searchParams: Promise<{ token?:string }> })` → `await searchParams` → sanitize token → `<ResetPasswordForm token={token ?? null} />`. No Suspense, no useSearchParams.
2. **New client form `reset-password-form.tsx`**:
   - Props `{ token: string | null }`. If `token === null`: render red warning "The password reset link is missing its token. Please request a new reset link."
   - Form with: New password input (type="password") → Confirm new password input → Set new password CTA button.
   - Submit POST to `/api/auth/reset-password`: body `{ token, newPassword, confirmPassword }`.
   - On success `ok:true`: router.push(`/auth?mode=login&reset=1`) (navigate to Log In).
   - Inline all validation errors (length < 8, passwords don't match, server message like "link expired/reused").
   - Use standard 20s AbortController.
3. **New server POST `/api/auth/reset-password` route.ts**:
   - Zod body: `{ token: z.string.min(1), newPassword: z.string.min(1).max(128), confirmPassword: z.string.min(1).max(128) }`.
   - Validate `newPassword === confirmPassword` → 400 if no match.
   - Run `validatePasswordStrength(newPassword)` → 400 if too weak.
   - Redeem token against `auth_tokens` table using EXISTING `redeemSubscriberMagicToken` logic (type MAGIC_LOGIN or optionally add new `PASSWORD_RESET` — either works; reuse same logic to avoid writing new code). Token must be not expired + usedAt IS NULL.
   - If token valid → row update atomic: `prisma.subscriber.update({ where: {id: subscriberId}, data: { passwordHash: newHashedValue } })`.
   - Set `token.usedAt = NOW()` atomically same optimistic lock pattern as today.
   - Return `{ ok:true, message:"Password set successfully." }`; optionally auto-create session and log them in per OQ-2 decision.
4. **`trial-emails.ts` href swap**: Change the magic email template CTA `href` from `/auth/magic?token=` to `/reset-password?token=`. The subject line can optionally rename from "Your Warm-Hello log-in link" → "Set your Warm-Hello password" (copy tweak).
5. (Optional redirect): Rewrite `/auth/magic?token=…` page to redirect users to `/reset-password?token=…` for 30 days to catch any in-flight old-emails in user inboxes.

### Test Requirements
- **rule TR-6.1:** GET `/reset-password` (no token param) → page renders red guidance missing-token state, submit disabled.
- **rule TR-6.2:** Submit new password "Short" → 400 inline length error; row password_hash unchanged.
- **rule TR-6.3:** Submit mismatch `Abcd1234!` and `Abcd1234@` → 400 inline "Passwords do not match."
- **rule TR-6.4:** Submit valid + match against a valid token → password_hash writes bcrypt; same token reused on 2nd submit → server 400 "This reset link was already used or has expired."
- **rule TR-6.5:** After valid reset, `/api/auth/login` works with new password; old password no longer works.
- **rule TR-6.6:** Submit against expired/revoked token → server 400 "expired" guidance + user told to re-request via /forgot.
- **rule TR-6.7 (AC-05):** Legacy user NULL-hash account clicks forgot link → gets reset-password email → sets password, then login works (AC-05: flow works for legacy).
- **Completion Evidence:** curl of /api/auth/reset-password with all cases (invalid/valid/reuse/expire) responses; DB row showing password_hash value change.

---

## Task 7: `/auth/magic` link page (old email route) now redirects or repurposes to set-password flow

**Priority:** medium  
**Dependencies:** Task 6 complete  
**Acceptance Criteria Covered:** AC-05 (one-time enforce passwords for users clicking magic emails next time)  
**Files to change:** `warmhello-app/app/(site)/auth/magic/page.tsx`, `warmhello-app/app/(site)/auth/magic/magic-form.tsx`

### Work Description
Make the old `/auth/magic?token=` landing page:
- OPTION A (simplest, keeps logic): redirect NEXT/Permanent to `/reset-password?token=…` so in-flight old magic emails still work.
- OPTION B (one-time gentle enforcement for existing users): render the same set-new-password form as ResetPasswordForm directly inside MagicForm now with header "Welcome back. Please set a secure password for your account to log in with a password next time." This gives every user clicking the magic link after deploy a one-shot password set flow.

### Test Requirements
- **rule TR-7.1:** GET `/auth/magic?token=xxx` → either HTTP 308 redirect with location `/reset-password?token=xxx` (Option A) OR page renders New/Confirm password inputs (Option B).
- **rule TR-7.2:** Token reuse after password set → reused denied inline.
- **Completion Evidence:** curl -I /auth/magic?token=xxx showing redirect OR screenshot of password form.

---

## Task 8: "Change password" card in Dashboard → Settings (3-input form for logged-in users with existing password)

**Priority:** high  
**Dependencies:** Tasks 1, 2, 3  
**Acceptance Criteria Covered:** AC-04, AC-05 (optional 2-input variant for legacy NULL hash users on same settings card)

**Files to change:**
- `warmhello-app/app/(site)/dashboard/settings/page.tsx` (need to pass password-set status to the settings card, or look it up inline from the session subscriber row)
- `warmhello-app/components/subscription-management-card.tsx` (add new card ABOVE subscription section, separate section — OR create a NEW dedicated `PasswordCard` component)
- New `warmhello-app/app/api/auth/change-password/route.ts` (server POST handler)
- New component `components/change-password-card.tsx`

### Work Description
1. **New server POST `/api/auth/change-password` route.ts**:
   - Session owner guard: retrieve current subscriber from session.
   - Zod body: `{ currentPassword: z.string.min(1).max(128), newPassword: z.string.min(1).max(128), confirmNewPassword: z.string.min(1).max(128) }`
   - If subscriber.passwordHash === NULL:
     - This path is for "setting first password" (variant of FR-05 Settings section): ignore `currentPassword` field, run validate strength + match, hash, write.
   - Else if subscriber.passwordHash !== NULL:
     - Run verifyPassword against currentPassword → 401 "Current password incorrect" if no match.
     - Validate new password rules strength, match confirm → write new hash.
   - Audit log message in server logs.
2. **New client component `ChangePasswordCard`**:
   - Mounted in Settings page.
   - Render gating via `passwordHash` status:
     - If `hasPassword === true`: 3-input form (Current / New / Confirm), submit calls POST above.
     - If `hasPassword === false` (legacy user): headline "Set a password to secure your account" with 2 inputs (New / Confirm), CTA "Set first password".
   - Inline status messages for all cases (wrong old password, mismatch, too short, success message "Password updated.").
   - AbortController 15s timeout.
3. **Settings page SSR loader** `dashboard/settings/page.tsx`:
   - Already fetches subscriber by ID — just select `passwordHash` column and pass a boolean `hasPassword: !!passwordHash` prop into card.

### Test Requirements
- **rule TR-8.1 (AC-04 step 2):** POST change-password with WRONG currentPassword → 401 inline error. Row password_hash not updated.
- **rule TR-8.2 (AC-04 step 3):** Mismatch new/confirm → 400 mismatch.
- **rule TR-8.3 (AC-04 step 4):** Short / weak new → 400 validation.
- **rule TR-8.4 (AC-04 step 5):** Correct old + valid new/confirm → 200 ok, row password_hash updated to new, old password fails login now.
- **rule TR-8.5 (AC-05):** Legacy account (NULL passwordHash) POST with first-password flow → writes new hash, then login works.
- **Completion Evidence:** curl of POST /api/auth/change-password 4 cases; DB row after updates; Settings screenshot of both variants of the card (has-password=yes / =no).

---

## Task 9: Hardened old `/api/session` POST endpoint (prevents password bypass)

**Priority:** high  
**Dependencies:** Task 3 complete  
**Acceptance Criteria Covered:** FR-03 (prevent password set accounts bypassing their own password by calling the old email-only endpoint)

**Files to change:** old POST `/api/session/route.ts`

### Work Description
Current `/api/session` takes only `{ email }` and emails a magic link. After passwords roll out, an attacker with NO password but knowledge of a victim email address could still call this endpoint and spam magic link emails to victim (not good but not a bypass — victim still clicks to log in). More importantly: after the email link goes to reset-password flow, they need access to victim inbox anyway. The main hardening rule is:
1. Rate-limit `/api/session` by email (max 5 per 15 minutes) via simple in-memory or Prisma log check.
2. Optionally, for subscribers WITH passwordHash set, return 200 OK still (so UI can't enumerate) but DON'T EMAIL — because a password-set user should use Log In form and they shouldn't get flooded with reset emails if an attacker is spamming this endpoint.

At minimum: add a TODO comment + rate limit on email to prevent abuse.

### Test Requirements
- **rule TR-9.1:** 6th POST within 15 min for same email → 429 "Too many requests. Please wait 15 minutes."
- **rule TR-9.2 (optional password-hash-set no-send):** POST for user where password_hash IS NOT NULL → response 200 `ok:true` + friendly message body "If that email is registered..." but NO email actually sent (no SMTP MAIL FROM sent, check SES metrics or server log of send skipped).
- **Completion Evidence:** curl of 6 POSTs with last showing 429 or log line "send skipped".

---

## Task 10: Password Changed / Password Set audit emails (optional nice-to-have)

**Priority:** medium  
**Dependencies:** Tasks 4, 6, 8  
**Acceptance Criteria Covered:** AC-08 (rubric 0→1→2)  
**Files to change:** `warmhello-app/lib/trial-emails.ts` (add 2 new templates: passwordSet, passwordChanged), call sites in /reset-password route and /change-password route.

### Work Description
1. `sendPasswordSetAuditEmail(subscriberEmail, ip, timestamp)` → Subject: "Your Warm-Hello password has been set." Body: IP, timestamp, "If you did not set this password, immediately use the forgot link to regain control and contact sales@warm-hello.com."
2. `sendPasswordChangedAuditEmail(...)` → Similar body, "Your password was changed." Call from /change-password handler after success.
3. No template contains the actual password.

### Test Requirements
- **rule TR-10.1:** Successful password reset via /forgot → `/reset-password` token: audit email sent (inspect server logs: `SUCCESS_EMAIL_SENT` with correct subject).
- **rule TR-10.2:** Successful Settings change-password: audit email.
- **Completion Evidence:** Gmail screenshots of the 2 audit emails. OR grep of SUCCESS_EMAIL_SENT in PM2 out.log for the right subject keys.

---

## Task 11: End-to-end tsc + Prisma checks + lint passes

**Priority:** high  
**Dependencies:** ALL of 1-10 complete  
**Acceptance Criteria Covered:** AC-06 (strict)  
**Files changed:** none expected (unless new TypeScript errors introduced earlier, in which case fix them).

### Work Description
Run:
```
pnpm exec tsc --noEmit
pnpm exec prisma validate
pnpm exec next lint
```

### Test Requirements
- **rule TR-11.1:** `tsc --noEmit` exit 0.
- **rule TR-11.2:** `prisma validate` exit 0.
- **rule TR-11.3:** `next lint` exit 0 with <= 1 warning (or 0 warnings stricter).
- **Completion Evidence:** Terminal output of all 3 commands pasted.
