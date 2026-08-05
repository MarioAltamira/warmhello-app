import { NextResponse } from "next/server";
import { z } from "zod";
import { cancelSubscriptionAtPeriodEnd } from "@/lib/stripe";
import { getSubscriberSession } from "@/lib/subscriber-session";
import { prisma } from "@/lib/prisma";
import { sendThankYouForSubscriptionEmail } from "@/lib/trial-emails";

const bodySchema = z.object({
  subscriberId: z.string().min(1),
});

export async function POST(request: Request) {
  const { subscriberId } = await getSubscriberSession();
  if (!subscriberId) {
    return NextResponse.json(
      { ok: false, message: "You must be signed in to cancel your subscription." },
      { status: 401 },
    );
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Invalid request." }, { status: 400 });
  }

  if (parsed.data.subscriberId !== subscriberId) {
    return NextResponse.json(
      { ok: false, message: "You can only cancel your own subscription." },
      { status: 403 },
    );
  }

  const result = await cancelSubscriptionAtPeriodEnd({ subscriberId });
  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }

  try {
    if (prisma) {
      const subscriber = await prisma.subscriber.findUnique({
        where: { id: subscriberId },
        select: { id: true, email: true, fullName: true },
      });
      if (subscriber) {
        await sendThankYouForSubscriptionEmail(subscriber.id);
      }
    }
  } catch {
    // ignore email send failure
  }

  return NextResponse.json(result);
}
