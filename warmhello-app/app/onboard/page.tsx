import Link from "next/link";
import { OnboardingForm } from "@/components/onboarding-form";
import { getHouseholdForSubscriber } from "@/lib/households";
import { getSubscriberSessionId } from "@/lib/subscriber-session";

type OnboardPageProps = {
  searchParams?: Promise<{
    mode?: string;
    subscriberName?: string;
    subscriberEmail?: string;
  }>;
};

export default async function OnboardPage({ searchParams }: OnboardPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const subscriberId = await getSubscriberSessionId();
  const currentHousehold = subscriberId
    ? await getHouseholdForSubscriber(subscriberId)
    : null;
  const editMode = resolvedSearchParams.mode === "edit" && Boolean(currentHousehold);
  const heading = editMode
    ? "Edit your household details."
    : "Create a household and launch your free trial.";
  const lede = editMode
    ? "Update the form below and click Update Household to save your changes."
    : "Use the form below to setup your household and click the Create Household.";
  const supportingCopy = editMode
    ? "Your current subscriber, senior, and contact details are prefilled below."
    : "That's all no need for a credit card or anything else.";

  return (
    <main className="shell">
      <section className="card">
        <p className="eyebrow">Subscriber Setup</p>
        <h1>{heading}</h1>
        <p className="lede">{lede}</p>
        <p>{supportingCopy}</p>
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
        <OnboardingForm
          editMode={editMode}
          currentHousehold={currentHousehold}
          signupDefaults={{
            subscriberName: resolvedSearchParams.subscriberName,
            subscriberEmail: resolvedSearchParams.subscriberEmail,
          }}
        />
      </div>
    </main>
  );
}
