import { NextResponse } from "next/server";
import { createCheckoutSession } from "@/lib/stripe";
import { getSubscriberSession } from "@/lib/subscriber-session";

export async function POST(
  _request: Request,
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

  const result = await createCheckoutSession({ subscriberId });

  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json(result);
}
