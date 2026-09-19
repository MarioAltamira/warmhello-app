import { NextResponse } from "next/server";
import { createCheckInSession } from "@/lib/checkins";
import { prisma } from "@/lib/prisma";
import { verifyJobSecret } from "@/lib/qstash";
import { shouldSendCheckInMessaging } from "@/lib/subscriber-lifecycle";
import { isSeniorActive } from "@/lib/senior-active";

export async function POST(request: Request) {
  if (!verifyJobSecret(request)) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  if (!prisma) {
    return NextResponse.json(
      { ok: false, message: "Database is not configured yet." },
      { status: 500 },
    );
  }

  try {
    const now = new Date();
    const seniors = await prisma.senior.findMany({
      where: { active: true },
      include: {
        subscriber: {
          select: {
            id: true,
            subscriptionStatus: true,
            created: true,
            currentPeriodEndsAt: true,
            unsubscribedAt: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const results = [];
    let delivered = 0;
    const dayWindowStart = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const dayWindowEnd = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

    for (const senior of seniors) {
      const name = `${senior.firstName} ${senior.lastName}`;
      if (!senior.subscriber || senior.subscriber.unsubscribedAt != null) {
        results.push({ name, phone: senior.phoneNumber, skipped: true, reason: senior.subscriber?.unsubscribedAt != null ? "unsubscribed" : "subscriber_missing" });
        continue;
      }
      if (!isSeniorActive(senior)) {
        results.push({ name, phone: senior.phoneNumber, skipped: true, reason: "inactive" });
        continue;
      }
      if (!shouldSendCheckInMessaging({
        subscriptionStatus: senior.subscriber.subscriptionStatus as any,
        created: senior.subscriber.created,
        currentPeriodEndsAt: senior.subscriber.currentPeriodEndsAt,
        now,
      })) {
        results.push({ name, phone: senior.phoneNumber, skipped: true, reason: `subscription_ineligible_${senior.subscriber.subscriptionStatus}` });
        continue;
      }

      const staleDeleted = await prisma.checkIn.deleteMany({
        where: {
          seniorId: senior.id,
          scheduledFor: { gte: dayWindowStart, lte: dayWindowEnd },
          status: "PENDING",
          firstSmsSentAt: null,
          firstJobMessageId: null,
        },
      });

      const created = await createCheckInSession({
        subscriberId: senior.subscriberId,
        seniorId: senior.id,
        scheduledFor: now,
        skipRemindersAndEscalation: false,
        requireSmsSuccess: false,
      });

      if (created.ok) {
        if (created.enqueue.firstSmsDeliveredImmediately) delivered += 1;
        results.push({
          name,
          phone: senior.phoneNumber,
          scheduledFor: created.checkIn.scheduledFor.toISOString(),
          smsDeliveredImmediately: created.enqueue.firstSmsDeliveredImmediately,
          enqueueOk: created.enqueue.enqueueOk,
          enqueueFailed: created.enqueue.enqueueFailed,
          checkInId: created.checkIn.id,
          staleOnetimeDeletedCount: staleDeleted.count,
        });
      } else {
        results.push({ name, phone: senior.phoneNumber, error: created.message });
      }
    }

    return NextResponse.json({
      ok: true,
      totalSeniors: seniors.length,
      smsDeliveredImmediately: delivered,
      results,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
