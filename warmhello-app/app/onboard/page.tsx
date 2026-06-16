import Link from "next/link";
import { OnboardingForm } from "@/components/onboarding-form";

export default function OnboardPage() {
  return (
    <main className="shell">
      <section className="card">
        <p className="eyebrow">Subscriber Setup</p>
        <h1>Create a household and launch your free trial.</h1>
        <p className="lede">
          Use the form below to setup your household and click the Create Household.
        </p>
        <p>
          That's all no need for a credit card or anything else.
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
