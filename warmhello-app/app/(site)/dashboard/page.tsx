import Link from "next/link";
import { redirect } from "next/navigation";
import { SmartBuyNowButton } from "@/components/smart-buy-now-button";
import { DashboardDisclaimerBanner } from "@/components/dashboard-disclaimer-banner";
import { getDashboardSnapshot } from "@/lib/checkins";
import { FREE_TRIAL_DOES_NOT_AUTO_CONVERT } from "@/lib/constants";
import { pricingPlanFor } from "@/lib/pricing";
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
    select: { dashboardDisclaimerDismissedAt: true, billingInterval: true },
  });
  const initiallyDismissed = Boolean(row?.dashboardDisclaimerDismissedAt);

  const billingCurrency = snapshot.billingCurrency;
  const plan = pricingPlanFor(billingCurrency ?? "USD");
  const billingInterval =
    (row?.billingInterval as "MONTHLY" | "ANNUAL" | null) ?? "MONTHLY";

  const normalizedStatus = (snapshot.subscriptionStatus ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
  const isTrialExpired =
    snapshot.isTrialExpired ||
    normalizedStatus === "PAST_DUE" ||
    normalizedStatus === "TRIAL_PERIOD_IS_OVER";

  const monthlyUrl = snapshot.subscriberId
    ? `/subscribe/${snapshot.subscriberId}?interval=monthly`
    : null;
  const annualUrl = snapshot.subscriberId
    ? `/subscribe/${snapshot.subscriberId}?interval=annual`
    : null;

  return (
    <main className="shell">
      <DashboardDisclaimerBanner
        subscriberId={subscriberId}
        initiallyDismissed={initiallyDismissed}
      />

      {isTrialExpired ? (
        <section
          className="card"
          style={{
            marginTop: 24,
            border: "1px solid rgba(255,214,102,0.35)",
            background:
              "linear-gradient(180deg, rgba(255,214,102,0.08) 0%, rgba(255,214,102,0.02) 60%)",
          }}
          id="trial-ended"
        >
          <p
            className="eyebrow"
            style={{ color: "rgba(255,214,102,0.95)", letterSpacing: "0.08em" }}
          >
            Free Trial
          </p>
          <h1 style={{ marginTop: 8 }}>Your free trial has ended</h1>
          <p className="lede" style={{ marginTop: 8 }}>
            Continue using Warm-Hello by selecting a subscription. No automatic
            charge will happen at trial end — you must actively choose a plan
            below to continue.
          </p>

          <blockquote
            className="notice-block"
            style={{
              borderColor: "rgba(255,214,102,0.3)",
              background: "rgba(255,214,102,0.08)",
              marginTop: 14,
            }}
          >
            <strong>{FREE_TRIAL_DOES_NOT_AUTO_CONVERT}</strong>
          </blockquote>

          <div
            className="trial-end-plan-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 14,
              marginTop: 20,
            }}
          >
            <article
              className="card"
              style={{
                margin: 0,
                border:
                  billingInterval === "MONTHLY"
                    ? "1.5px solid rgba(123, 227, 169, 0.6)"
                    : "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <p className="eyebrow">Monthly</p>
              <h2 style={{ marginTop: 6 }}>
                {plan.monthlyLabel}
              </h2>
              <p className="section-meta" style={{ marginTop: 4 }}>
                {plan.dailyLabel}, billed once per month.
              </p>
              <ul className="prompt-list" style={{ marginTop: 12 }}>
                <li>Scheduled daily SMS check-ins.</li>
                <li>Friendly follow-up reminders.</li>
                <li>Notifications to trusted escalation contacts if a check-in is missed.</li>
                <li>Cancel anytime from Dashboard → Settings.</li>
              </ul>
              <div className="actions" style={{ marginTop: 16 }}>
                {monthlyUrl ? (
                  <Link href={monthlyUrl as any} className="button primary">
                    Choose Monthly — {plan.monthlyLabel}
                  </Link>
                ) : (
                  <SmartBuyNowButton className="button primary" />
                )}
              </div>
            </article>

            <article
              className="card"
              style={{
                margin: 0,
                border:
                  billingInterval === "ANNUAL"
                    ? "1.5px solid rgba(123, 227, 169, 0.6)"
                    : "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <p className="eyebrow">Annual</p>
              <h2 style={{ marginTop: 6 }}>{plan.yearlyLabel}</h2>
              <p className="section-meta" style={{ marginTop: 4 }}>
                Same service, billed once per year — works out to ~{plan.dailyLabel} on average.
              </p>
              <ul className="prompt-list" style={{ marginTop: 12 }}>
                <li>Everything in the Monthly plan.</li>
                <li>Renewal reminder email 14 days before each annual renewal.</li>
                <li>Single yearly invoice for easier tax/expense records.</li>
                <li>Cancel anytime — coverage continues until the end of the paid year.</li>
              </ul>
              <div className="actions" style={{ marginTop: 16 }}>
                {annualUrl ? (
                  <Link href={annualUrl as any} className="button buy-now-button">
                    Choose Annual — {plan.yearlyLabel}
                  </Link>
                ) : (
                  <SmartBuyNowButton className="button buy-now-button" />
                )}
              </div>
            </article>
          </div>

          <p
            className="section-meta"
            style={{
              marginTop: 18,
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(255,255,255,0.02)",
              fontSize: 13,
            }}
          >
            <strong style={{ color: "rgba(255,214,102,0.95)" }}>Important:</strong>{" "}
            Warm-Hello does not and will not automatically charge you at the end
            of the free trial. Check-ins stop after your trial ends until you
            pick a plan above. If you don&rsquo;t see a plan you like, email{" "}
            <a
              href="mailto:sales@warm-hello.com?subject=Warm-Hello%20plan%20question"
              className="inline-link"
            >
              sales@warm-hello.com
            </a>
            .
          </p>
        </section>
      ) : null}

      <div className="card">
        <p className="eyebrow">Subscriber Dashboard</p>
        <h1>{snapshot.subscriberName}</h1>
        <p className="lede">
          Monitor the senior, billing state, and the reminder/escalation workflow from one place.
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
            When Warm-Hello reaches out to your trusted contacts, the message clearly explains
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
          <h2>Trusted escalation contacts</h2>
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
            <SmartBuyNowButton className="button buy-now-button" />
          </div>
        ) : null}
      </section>
    </main>
  );
}
