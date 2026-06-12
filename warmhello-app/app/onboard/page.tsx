import Link from "next/link";
import { OnboardingForm } from "@/components/onboarding-form";

export default function OnboardPage() {
  return (
    <main className="shell">
      <section className="card">
        <p className="eyebrow">Subscriber Setup</p>
        <h1>Create a household and launch billing.</h1>
        <p className="lede">
          Use this page to create a real subscriber, senior, and primary emergency
          contact, then open Stripe checkout for the new household.
        </p>
        <p>
          Seed a Supabase database later with <code>npx pnpm run db:seed</code> once
          your Postgres connection is configured.
        </p>
        <div className="actions">
          <Link href="/dashboard" className="button secondary">
            Back to Dashboard
          </Link>
          <Link href="/checkin/demo-token" className="button secondary">
            Preview Check-In
          </Link>
        </div>
      </section>

      <div style={{ marginTop: 24 }}>
        <OnboardingForm />
      </div>
    </main>
  );
}
