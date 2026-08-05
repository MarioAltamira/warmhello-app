import Link from "next/link";
import { redirect } from "next/navigation";
import { getDashboardSnapshot } from "@/lib/checkins";
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

  return (
    <main className="shell">
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
            <strong>Next check-in:</strong> {snapshot.nextCheckInLabel}
          </p>
        </article>

        <article className="card">
          <h2>Escalation policy</h2>
          <p>{snapshot.escalationPolicy}</p>
          <p>
            Reminder, escalation, and trial follow-up jobs are designed to be triggered via delayed
            QStash delivery.
          </p>
          <p>
            <strong>Billing:</strong> {snapshot.billingCustomerLabel}
          </p>
          {snapshot.stripePrice?.displayLabel ? (
            <p>
              <strong>Checkout price:</strong> {snapshot.stripePrice.displayLabel}
            </p>
          ) : null}
          {snapshot.stripePrice && !snapshot.stripePrice.aligned ? (
            <p style={{ marginTop: 12 }}>
              <strong>Heads up:</strong> the checkout price above does not match the expected plan
              ({snapshot.stripePrice.expectedLabel}). Update <code>STRIPE_PRICE_ID</code> on AWS to
              match the $6/month price before accepting payments.
            </p>
          ) : null}
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
              <Link href={`/checkin/${snapshot.latestCheckInToken}`} className="button secondary">
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
          <Link href="/checkin/demo-token" className="button secondary">
            Preview Demo Check-In
          </Link>
        </div>
        {snapshot.showBuyNow && (snapshot.subscriberId ?? subscriberId) ? (
          <div style={{ marginTop: 16 }}>
            <Link
              href={`/subscribe/${snapshot.subscriberId ?? subscriberId}`}
              className="button buy-now-button"
            >
              Buy Now
            </Link>
          </div>
        ) : null}
      </section>
    </main>
  );
}
