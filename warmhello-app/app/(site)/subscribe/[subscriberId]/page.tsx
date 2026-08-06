import CurrencyToggle from "@/components/currency-toggle";
import { expectedMonthlyLabelFor, pricingPlanFor } from "@/lib/pricing";
import { resolveCurrencyForCurrentVisitor } from "@/lib/visitor-currency";
import SubscribeClient from "./subscribe-client";

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
        <div style={{ marginTop: 16, display: "flex", justifyContent: "center" }}>
          <CurrencyToggle initial={resolved.currency} compact />
        </div>
        <div style={{ marginTop: 20 }}>
          <SubscribeClient subscriberId={subscriberId} />
        </div>
      </div>
    </main>
  );
}
