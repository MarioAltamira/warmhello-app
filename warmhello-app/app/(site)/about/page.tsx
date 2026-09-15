import type { Metadata } from "next";
import { NON_EMERGENCY_POSITIONING_LINE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "About Us · Warm-Hello",
  description:
    "Warm-Hello was created to help families stay in touch with loved ones living independently every day without being intrusive.",
  robots: "noindex,nofollow",
};

export default function AboutPage() {
  return (
    <main className="shell">
      <article
        className="card longform"
        style={{ textAlign: "left", maxWidth: 860, margin: "0 auto" }}
      >
        <p className="eyebrow">Warm-Hello</p>
        <h1>About Us</h1>
        <p className="section-meta">
          <strong>Simple check-ins. Families stay connected.</strong>
        </p>
        <p>
          Warm-Hello was created to help families stay in touch with loved ones
          living independently every day without being intrusive.
        </p>
        <p>
          We built a quiet, software-driven daily routine that uses a quick SMS
          response so families know their loved one started their day, and
          notifies trusted escalation contacts if a check-in is missed.
        </p>
        <blockquote
          className="notice-block"
          style={{
            borderColor: "rgba(255,214,102,0.25)",
            background: "rgba(255,214,102,0.06)",
          }}
        >
          <strong>{NON_EMERGENCY_POSITIONING_LINE}</strong>
        </blockquote>
        <p>
          Our goal is to keep families connected with reliable, secure, and
          affordable technology.
        </p>
      </article>
    </main>
  );
}
