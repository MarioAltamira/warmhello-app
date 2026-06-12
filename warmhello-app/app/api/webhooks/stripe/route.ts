import { NextResponse } from "next/server";
import { applyStripeEvent } from "@/lib/billing";
import { verifyStripeWebhookSignature } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");
  const event = verifyStripeWebhookSignature(payload, signature);

  if (!event) {
    return NextResponse.json(
      { ok: false, message: "Stripe is not fully configured for webhook verification." },
      { status: 400 },
    );
  }

  const result = await applyStripeEvent(event);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
