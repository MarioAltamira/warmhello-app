import { NextResponse } from "next/server";
import { z } from "zod";
import { createCheckoutSession } from "@/lib/stripe";
import { getSubscriberSession } from "@/lib/subscriber-session";

const bodySchema = z.object({
  customerEmail: z.string().email(),
  subscriberId: z.string().min(1),
});

export async function POST(request: Request) {
  const { subscriberId: sessionSubscriberId, sessionExpired } = await getSubscriberSession();
  if (sessionExpired) {
    return NextResponse.json(
      { ok: false, message: "Your session expired. Please log in again." },
      { status: 401 },
    );
  }

  const parsed = bodySchema.parse(await request.json());

  if (!sessionSubscriberId || sessionSubscriberId !== parsed.subscriberId) {
    return NextResponse.json(
      { ok: false, message: "You are not authorized to create a checkout for this subscriber." },
      { status: 403 },
    );
  }

  const result = await createCheckoutSession(parsed);

  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json(result);
}
