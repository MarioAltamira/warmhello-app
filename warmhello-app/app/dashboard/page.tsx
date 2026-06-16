import Link from "next/link";
import { getDashboardSnapshot } from "@/lib/checkins";

export default async function DashboardPage() {
  const snapshot = await getDashboardSnapshot();

  return (
    <main className="shell">
      <div className="card">
        <p className="eyebrow">Subscriber Dashboard</p>
        <h1>{snapshot.subscriberName}</h1>
        <p className="lede">
          Monitor the protected senior, billing state, and the reminder/escalation
          workflow from one place.
        </p>
      </div>

      <section className="dashboard-grid" style={{ marginTop: 24 }}>
        <article className="card">
          <h2>Coverage</h2>
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
            Reminder, escalation, and trial follow-up jobs are designed to be triggered
            via delayed QStash delivery.
          </p>
          <p>
            <strong>Billing:</strong> {snapshot.billingCustomerLabel}
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
              <Link
                href={`/checkin/${snapshot.latestCheckInToken}`}
                className="button secondary"
              >
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
        <h2>Integration readiness</h2>
        <div className="status-list">
          {Object.entries(snapshot.integrationStatus).map(([name, ready]) => (
            <div key={name} className="status-row">
              <span>{name}</span>
              <span className={`badge ${ready ? "ready" : "missing"}`}>
                {ready ? "configured" : "env needed"}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="card" style={{ marginTop: 24 }}>
        <h2>Next actions</h2>
        <ul>
          <li>Run <code>npx pnpm install</code> with the new dependency set.</li>
          <li>Add Supabase Postgres URLs to <code>.env</code>.</li>
          <li>Run <code>npx pnpm run prisma:generate</code> and <code>npx pnpm run prisma:push</code>.</li>
          <li>Run <code>npx pnpm run db:seed</code> to load the starter household into Supabase.</li>
          <li>Add Stripe, Telnyx, email, and QStash secrets to enable live integrations.</li>
        </ul>
        <div className="actions" style={{ marginTop: 16 }}>
          <Link href="/onboard" className="button primary">
            Create Household
          </Link>
          <Link href="/checkin/demo-token" className="button secondary">
            Preview Demo Check-In
          </Link>
        </div>
      </section>
    </main>
  );
}
