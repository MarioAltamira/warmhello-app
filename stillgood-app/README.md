# StillGood

StillGood is a clean rebuild around this stack:

- TypeScript
- Next.js App Router
- PostgreSQL via Supabase
- Prisma ORM
- Twilio SMS
- Stripe Billing
- Upstash QStash-style delayed jobs

## Local setup

1. Copy `.env.example` to `.env`.
2. Fill in `DATABASE_URL` and `DIRECT_URL` from Supabase.
3. Run `npx pnpm install`.
4. Run `npx pnpm run prisma:generate`.
5. Run `npx pnpm run prisma:push` after adding a real database URL.
6. Run `npx pnpm run db:seed` to load the demo household.
7. Run `npx pnpm run dev`.
8. Open `http://localhost:8080`.

## Key routes

- `/`: product overview and architecture summary
- `/dashboard`: subscriber operations dashboard
- `/onboard`: subscriber onboarding and checkout launcher
- `/checkin/demo-token`: demo senior check-in page
- `/api/health`: configuration health endpoint
- `/api/subscribers`: subscriber, senior, and contact creation
- `/api/billing/checkout`: Stripe checkout session creation
- `/api/checkins`: check-in session creation
- `/api/checkins/[token]/confirm`: secure check-in confirmation
- `/api/jobs/reminder`: delayed reminder handler
- `/api/jobs/escalation`: delayed escalation handler
- `/api/webhooks/stripe`: Stripe webhook endpoint

## Notes

- The UI stays usable without live secrets, but live billing, SMS, and job dispatch require env vars.
- Database-backed flows fall back to safe demo responses until `DATABASE_URL` is configured.
- The seed command is intended for Supabase or any PostgreSQL instance reachable through Prisma.
