import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "HowTo · Warm-Hello",
  description: "How Warm-Hello's daily check-in and escalation routine works.",
  robots: "noindex,nofollow",
};

export default function HowToPage() {
  return (
    <main className="shell">
      <article
        className="card longform"
        style={{ textAlign: "left", maxWidth: 860, margin: "0 auto" }}
      >
        <p className="eyebrow">Warm-Hello</p>
        <h1>HowTo</h1>
        <ul className="longform-list">
          <li>
            <strong>1. Set Up Your Profile:</strong> Choose your check-in time
            and schedule.
          </li>
          <li>
            <strong>2. Add Trusted Escalation Contacts:</strong> Assign people who
            should be notified if the senior misses a check-in.
          </li>
          <li>
            <strong>3. Respond To Daily Texts:</strong> Reply to the SMS or tap
            the secure validation link.
          </li>
          <li>
            <strong>4. Escalation:</strong> If no reply arrives in time, Warm-Hello
            notifies your trusted escalation contacts by SMS and email.
          </li>
        </ul>
      </article>
    </main>
  );
}
