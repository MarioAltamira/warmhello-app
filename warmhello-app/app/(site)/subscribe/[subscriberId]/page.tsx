import type { Metadata } from "next";
import SubscribeClient from "./subscribe-client";
import { resolveCurrencyForCurrentVisitor } from "@/lib/visitor-currency";
import { pricingPlanFor } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Activate your Warm-Hello subscription",
  description:
    "Secure your Warm-Hello subscription with monthly or annual billing. Two-plan pricing: Monthly Standard or Annual Peace of Mind with ~20% savings.",
  robots: { index: false, follow: false },
};

export default async function SubscribePage({
  params,
}: {
  params: Promise<{ subscriberId: string }>;
}) {
  const { subscriberId } = await params;
  const resolved = await resolveCurrencyForCurrentVisitor({ subscriberId });
  const plan = pricingPlanFor(resolved.currency);
  void plan;

  return (
    <SubscribeClient subscriberId={subscriberId} currency={resolved.currency} />
  );
}
