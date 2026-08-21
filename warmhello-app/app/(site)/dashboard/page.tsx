import Link from "next/link";
import { redirect } from "next/navigation";
import { BuyNowButton } from "@/components/buy-now-button";
import { DashboardDisclaimerBanner } from "@/components/dashboard-disclaimer-banner";
import { getDashboardSnapshot } from "@/lib/checkins";
import { prisma } from "@/lib/prisma";
import { getSubscriberSession } from "@/lib/subscriber-session";

export default async function DashboardPage() {
  const { subscriberId, sessionExpired } = await getSubscriberSession();

  if (!subscriberId) {
    redirect(
      sessionExpired
        ? "/auth?mode=login&redirect=%2Fdashboard&source=dashboard&session=expired"
        : "/auth?mode=login&redirect=%2Fdashboard&source=dashboard",
    );
  }

  const snapshot = await getDashboardSnapshot(subscriberId);

  const row = await prisma?.subscriber.findUnique({
    where: { id: subscriberId },
    select: { dashboardDisclaimerDismissedAt: true },
  });
  const initiallyDismissed = Boolean(row?.dashboardDisclaimerDismissedAt);

  return (
    <main className="shell">
      <DashboardDisclaimerBanner
        subscriberId={subscriberId}
        initiallyDismissed={initiallyDismissed}
      />
      <div className="card">
        <p className="eyebrow">Subscriber Dashboard</p>
        <h1>{snapshot.subscriberName}</h1>
        <p className="lede">
          Monitor the protected senior, billing state, and the reminder/escalation workflow from one
          place.
        </p>
      </div>

      <section className="dashboard-grid" style={{ marginTop: 24 }}>
        <article className="card">
          <h2>Coverage</h2>
          <p>
            <strong>Subscriber:</strong> {snapshot.subscriberName}
          </p>
          <p>
            <strong>Subscriber email:</strong> {snapshot.subscriberEmail}
          </p>
          <p>
            <strong>Subscriber phone:</strong> {snapshot.subscriberPhone}
          </p>
          <p>
            <strong>Senior:</strong> {snapshot.seniorName}
          </p>
          <p>
            <strong>Plan status:</strong> {snapshot.subscriptionStatus}
          </p>
          <p>
            <strong>Plan:</strong> {snapshot.billingPlanLabel}
          </p>
          <p>
            <strong>Next check-in:</strong> {snapshot.nextCheckInLabel}
          </p>
        </article>

        <article className="card">
          <h2>How we step in for you</h2>
          <p>
            Every morning at the time you chose, your loved one receives a gentle, one-tap check-in
            text. No passwords, no apps to open - just one confirmation that everything is fine.
          </p>
          <p>
            <strong>How the warm follow-up works:</strong>
          </p>
          <ul className="prompt-list" style={{ marginTop: 10 }}>
            <li>{snapshot.escalationPolicy}</li>
          </ul>
          <p>
            When Warm-Hello reaches out to your emergency contacts, the message clearly explains
            that two gentle check-in attempts have gone unanswered, so your trusted circle can
            check in with care.
          </p>
        </article>
      </section>

      <section className="dashboard-grid" style={{ marginTop: 24 }}>
        <article className="card">
          <h2>Latest check-in</h2>
          <p>
            <strong>Status:</strong> {snapshot.latestCheckInStatus}
          </p>
          {snapshot.latestConfirmedLabel ? (
            <p>
              <strong>Confirmed at:</strong> {snapshot.latestConfirmedLabel}
            </p>
          ) : null}
          {snapshot.latestCheckInToken ? (
            <p>
              <strong>Token:</strong> {snapshot.latestCheckInToken}
            </p>
          ) : null}
          {snapshot.latestCheckInToken ? (
            <div className="actions" style={{ marginTop: 16 }}>
              <Link href={`/checkin/${snapshot.latestCheckInToken}?preview=1`} className="button secondary">
                Open Check-In Link
              </Link>
            </div>
          ) : null}
        </article>

        <article className="card">
          <h2>Emergency contacts</h2>
          <div className="status-list">
            {snapshot.contacts.map((contact) => (
              <div key={`${contact.fullName}-${contact.phoneNumber}`} className="status-row">
                <span>
                  {contact.fullName} ({contact.relationship})
                </span>
                <span>{contact.phoneNumber}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="card" style={{ marginTop: 24 }}>
        <h2>Next actions</h2>
        <div className="actions" style={{ marginTop: 16 }}>
          <Link href="/onboard?mode=edit" className="button primary">
            {snapshot.hasHousehold ? "Edit Household" : "Create Household"}
          </Link>
          <Link href="/dashboard/timeline" className="button secondary">
            View 7-Day Timeline
          </Link>
          <Link href="/dashboard/settings" className="button secondary">
            Settings
          </Link>
          <Link href="/checkin/demo-token?preview=1" className="button secondary">
            Preview Demo Check-In
          </Link>
        </div>
        {(snapshot.subscriberId ?? subscriberId) ? (
          <div style={{ marginTop: 16 }}>
            <BuyNowButton
              subscriberId={snapshot.subscriberId ?? subscriberId}
              intent={snapshot.buyNowIntent}
              timeRemainingLabel={snapshot.timeRemainingLabel}
            />
          </div>
        ) : null}
      </section>
    </main>
  );
}
