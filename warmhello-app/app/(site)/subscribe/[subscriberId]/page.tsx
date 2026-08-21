import Link from "next/link";
import { expectedMonthlyLabelFor, pricingPlanFor } from "@/lib/pricing";
import { resolveCurrencyForCurrentVisitor } from "@/lib/visitor-currency";
import SubscribeClient from "./subscribe-client";
import {
  CPA_AUTO_RENEW_BULLETS,
  LEGAL_DISCLAIMER_UNIVERSAL,
} from "@/lib/constants";

export default async function SubscribePage({
  params,
}: {
  params: Promise<{ subscriberId: string }>;
}) {
  const { subscriberId } = await params;
  const resolved = await resolveCurrencyForCurrentVisitor({ subscriberId });
  const billingPlanLabel = expectedMonthlyLabelFor(resolved.currency);
  const plan = pricingPlanFor(resolved.currency);
  const monthlyLabel = `${plan.currencySymbol}${plan.monthlyAmount}/month`;

  return (
    <main className="shell">
      <div className="card" style={{ textAlign: "center" }}>
        <p className="eyebrow">Warm-Hello</p>
        <h1>Activate your Warm-Hello subscription</h1>
        <p className="lede" style={{ marginTop: 12 }}>
          Secure your account for {monthlyLabel} and keep your daily check-ins running without
          interruption.
        </p>
        <p style={{ marginTop: 10, fontSize: 14, color: "var(--muted)" }}>
          {billingPlanLabel} · equivalent to {plan.yearlyLabel} · {plan.dailyLabel}
        </p>

        <section
          className="card"
          style={{
            marginTop: 24,
            textAlign: "left",
            border: "2px solid var(--accent-muted)",
            background: "rgba(250, 204, 21, 0.06)",
          }}
        >
          <p style={{ marginTop: 0 }}>
            <strong>Auto-renewal &amp; billing transparency (Ontario CPA):</strong>
          </p>
          <ul className="prompt-list" style={{ marginTop: 10, textAlign: "left" }}>
            {CPA_AUTO_RENEW_BULLETS.map((bullet, i) => (
              <li key={i}>
                <strong>{bullet}</strong>
              </li>
            ))}
          </ul>
        </section>

        <section
          className="card"
          style={{
            marginTop: 20,
            textAlign: "left",
            border: "2px solid rgb(250, 204, 21)",
            background: "rgba(250, 204, 21, 0.10)",
          }}
        >
          <blockquote className="notice-block" style={{ marginTop: 0, marginBottom: 0 }}>
            {LEGAL_DISCLAIMER_UNIVERSAL}
          </blockquote>
          <p style={{ marginTop: 8, fontSize: 13, color: "var(--muted)" }}>
            Read the full{" "}
            <Link href="/terms" className="inline-link">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="inline-link">
              Privacy Policy
            </Link>
            .
          </p>
        </section>

        <div style={{ marginTop: 20 }}>
          <SubscribeClient subscriberId={subscriberId} />
        </div>
      </div>
    </main>
  );
}
