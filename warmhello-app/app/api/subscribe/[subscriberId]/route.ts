import { NextResponse } from "next/server";
import { createCheckoutSession } from "@/lib/stripe";
import { getSubscriberSession } from "@/lib/subscriber-session";
import { coerceInterval } from "@/lib/visitor-currency";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ subscriberId: string }> },
) {
  const { subscriberId: sessionSubscriberId, sessionExpired } = await getSubscriberSession();
  if (sessionExpired) {
    return NextResponse.json(
      { ok: false, message: "Your session expired. Please log in again." },
      { status: 401 },
    );
  }

  const { subscriberId } = await params;

  if (!sessionSubscriberId || sessionSubscriberId !== subscriberId) {
    return NextResponse.json(
      {
        ok: false,
        message: "You are not authorized to start checkout for this subscriber.",
      },
      { status: 403 },
    );
  }

  let body: {
    tos_version?: string;
    caregiver_ack?: boolean;
    billing_interval?: unknown;
  } = {};
  try {
    body = (await request.json()) as {
      tos_version?: string;
      caregiver_ack?: boolean;
      billing_interval?: unknown;
    };
  } catch {
    body = {};
  }

  const billingInterval = coerceInterval(body.billing_interval);

  const result = await createCheckoutSession({
    subscriberId,
    billingInterval,
    metadata: {
      tos_version: body.tos_version ?? "v2026-08-21",
      caregiver_ack: body.caregiver_ack ? "1" : "0",
    },
  });

  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json(result);
}
