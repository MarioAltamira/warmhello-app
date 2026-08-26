import { NextResponse } from "next/server";
import { z } from "zod";
import { createCheckoutSession } from "@/lib/stripe";
import { getSubscriberSession } from "@/lib/subscriber-session";
import { parseJsonBody } from "@/lib/zod-parse";
import { coerceInterval } from "@/lib/visitor-currency";

const bodySchema = z.object({
  customerEmail: z.string().email(),
  subscriberId: z.string().min(1),
  billing_interval: z.unknown().optional(),
});

export async function POST(request: Request) {
  const { subscriberId: sessionSubscriberId, sessionExpired } = await getSubscriberSession();
  if (sessionExpired) {
    return NextResponse.json(
      { ok: false, message: "Your session expired. Please log in again." },
      { status: 401 },
    );
  }

  const parsed = await parseJsonBody(request, bodySchema);
  if (!parsed.ok) return parsed.response;

  if (!sessionSubscriberId || sessionSubscriberId !== parsed.data.subscriberId) {
    return NextResponse.json(
      { ok: false, message: "You are not authorized to create a checkout for this subscriber." },
      { status: 403 },
    );
  }

  const billingInterval = coerceInterval(parsed.data.billing_interval);

  const result = await createCheckoutSession({
    subscriberId: parsed.data.subscriberId,
    billingInterval,
  });

  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json(result);
}
