import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ · Warm-Hello",
  description: "Frequently asked questions about Warm-Hello's check-in service.",
  robots: "noindex,nofollow",
};

export default function FaqPage() {
  return (
    <main className="shell">
      <article
        className="card longform"
        style={{ textAlign: "left", maxWidth: 860, margin: "0 auto" }}
      >
        <p className="eyebrow">Warm-Hello</p>
        <h1>FAQ</h1>
        <ul className="longform-list">
          <li>
            <strong>Is Warm-Hello an emergency service?</strong> No. Warm-Hello is a routine check-in and notification service. It does not contact 911 or emergency services.
          </li>
          <li>
            <strong>What happens if a check-in is missed?</strong> Warm-Hello may notify the designated contacts according to the account&apos;s configuration.
          </li>
          <li>
            <strong>Does a missed check-in mean there is an emergency?</strong> No. A missed check-in may happen for many reasons and does not establish that an emergency has occurred.
          </li>
          <li>
            <strong>Does the free trial automatically become paid?</strong> No. The 7-day free trial does not automatically convert to a paid subscription. You must actively select and purchase a paid subscription to continue.
          </li>
          <li>
            <strong>Do paid subscriptions renew?</strong> Yes. Paid subscriptions automatically renew at the applicable billing interval unless cancelled before the next renewal date.
          </li>
          <li>
            <strong>How much does it cost?</strong> United States: $14.99 USD/month or $144 USD/year. Canada: $19.99 CAD/month or $180 CAD/year. Plus applicable taxes.
          </li>
          <li>
            <strong>What devices work?</strong> Any phone capable of sending and receiving SMS messages can use Warm-Hello.
          </li>
        </ul>
      </article>
    </main>
  );
}
