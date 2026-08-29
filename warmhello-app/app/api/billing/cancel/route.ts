import { NextResponse } from "next/server";
import { z } from "zod";
import { cancelSubscriptionAtPeriodEnd } from "@/lib/stripe";
import { getSubscriberSession } from "@/lib/subscriber-session";
import { prisma } from "@/lib/prisma";
import { sendSubscriptionCancelledAtPeriodEndEmail } from "@/lib/trial-emails";

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
        select: {
          id: true,
          email: true,
          fullName: true,
          currentPeriodEndsAt: true,
        },
      });
      if (subscriber) {
        const now = new Date();
        const cancellationDate = subscriber.currentPeriodEndsAt ?? undefined;
        await prisma.subscriber
          .update({
            where: { id: subscriber.id },
            data: {
              cancellationStatus: "PENDING_AT_PERIOD_END",
              cancellationRequestedAt: now,
              cancellationDate,
            },
          })
          .catch(() => null);
        await sendSubscriptionCancelledAtPeriodEndEmail(subscriber.id).catch(() => null);
      }
    }
  } catch {
    // ignore email send failure
  }

  return NextResponse.json({
    ok: true,
    message:
      result.message ??
      "Auto-renewal is now OFF. Your subscription remains active until the end of your current billing period, and no future renewal charges will be made.",
  });
}
