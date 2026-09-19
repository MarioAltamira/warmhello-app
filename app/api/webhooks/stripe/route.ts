import { NextResponse } from "next/server";
import { applyStripeEvent } from "@/lib/billing";
import { verifyStripeWebhookSignature } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const t0 = Date.now();
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");
  const event = verifyStripeWebhookSignature(payload, signature);

  if (!event) {
    console.error(
      `[stripe-webhook] FAIL signature verification. payload_length=${payload.length} signature_present=${Boolean(signature)} signature_length=${signature?.length ?? 0} dt_ms=${Date.now() - t0}. Returning 400.`,
    );
    return NextResponse.json(
      { ok: false, message: "Stripe is not fully configured for webhook verification." },
      { status: 400 },
    );
  }

  console.log(
    `[stripe-webhook] RECEIVED id=${event.id} type=${event.type} livemode=${String(event.livemode)} request_id=${request.headers.get("request-id") ?? "n/a"} payload_bytes=${payload.length} dt_verify_ms=${Date.now() - t0}`,
  );

  try {
    const result = await applyStripeEvent(event);
    if (!result.ok) {
      console.error(
        `[stripe-webhook] APPLY_FAIL id=${event.id} type=${event.type} message=${result.message} total_ms=${Date.now() - t0}`,
      );
    } else {
      console.log(
        `[stripe-webhook] APPLY_OK id=${event.id} type=${event.type} total_ms=${Date.now() - t0}`,
      );
    }
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (err) {
    console.error(
      `[stripe-webhook] UNHANDLED_ERR id=${event.id} type=${event.type}:`,
      err instanceof Error ? err.constructor.name + " :: " + err.message : String(err),
    );
    if (err instanceof Error && typeof err.stack === "string") {
      console.error(`[stripe-webhook] UNHANDLED_ERR stack=${err.stack.slice(0, 1200)}`);
    }
    return NextResponse.json(
      { ok: false, message: "Internal webhook handler error." },
      { status: 500 },
    );
  }
}
