import { NextResponse } from "next/server";
import { addDays } from "@/lib/dates";
import {
  createCheckInSession,
  type createCheckInSession as _createCheckInSessionType,
} from "@/lib/checkins";
import { prisma } from "@/lib/prisma";
import { shouldSendCheckInMessaging } from "@/lib/subscriber-lifecycle";
import { getNextOccurrenceAtHourInTimeZone } from "@/lib/dates";
import { normalizeTimeZone } from "@/lib/timezones";
import { verifyJobSecret } from "@/lib/qstash";
import { z } from "zod";

const bodySchema = z.object({
  runImmediately: z.boolean().default(false),
});

type AdvanceDayResult = {
  seniorId: string;
  subscriberId: string;
  seniorName: string;
  scheduledFor: string | null;
  created: boolean;
  skipped: boolean;
  skipReason?: string;
  ok: boolean;
  message?: string;
};

export async function POST(request: Request) {
  if (!verifyJobSecret(request) && process.env.NODE_ENV === "production") {
    return NextResponse.json({ ok: false, message: "Unauthorized job request." }, { status: 401 });
  }

  if (!prisma) {
    return NextResponse.json(
      { ok: false, message: "Database is not configured yet." },
      { status: 500 },
    );
  }

  const raw = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(raw);
  const runImmediately = parsed.success ? parsed.data.runImmediately : false;

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
            unsubscribedAt: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const results: AdvanceDayResult[] = [];

    for (const senior of seniors) {
      if (!senior.subscriber || senior.subscriber.unsubscribedAt != null) {
        results.push({
          seniorId: senior.id,
          subscriberId: senior.subscriberId,
          seniorName: `${senior.firstName} ${senior.lastName}`,
          scheduledFor: null,
          created: false,
          skipped: true,
          skipReason: senior.subscriber?.unsubscribedAt != null ? "subscriber_unsubscribed" : "subscriber_missing",
          ok: true,
        });
        continue;
      }

      const canSend = shouldSendCheckInMessaging({
        subscriptionStatus: senior.subscriber.subscriptionStatus as
          | "TRIAL"
          | "ACTIVE"
          | "PAST_DUE"
          | "CANCELED",
        created: senior.subscriber.created,
        now,
      });
      if (!canSend) {
        results.push({
          seniorId: senior.id,
          subscriberId: senior.subscriberId,
          seniorName: `${senior.firstName} ${senior.lastName}`,
          scheduledFor: null,
          created: false,
          skipped: true,
          skipReason: `subscription_ineligible_${senior.subscriber.subscriptionStatus}`,
          ok: true,
        });
        continue;
      }

      const timeZone = normalizeTimeZone(senior.timezone);
      const from = runImmediately ? now : addDays(now, 1);
      const scheduledFor = getNextOccurrenceAtHourInTimeZone({
        timeZone,
        hour: senior.checkInHour,
        minute: senior.checkInMinute,
        from,
      });

      const dayStart = new Date(scheduledFor);
      dayStart.setUTCHours(0, 0, 0, 0);
      const dayEnd = addDays(dayStart, 1);
      const existingSameDay = await prisma.checkIn.findFirst({
        where: {
          seniorId: senior.id,
          scheduledFor: { gte: dayStart, lt: dayEnd },
        },
        select: { id: true, token: true, scheduledFor: true },
      });
      if (existingSameDay) {
        results.push({
          seniorId: senior.id,
          subscriberId: senior.subscriberId,
          seniorName: `${senior.firstName} ${senior.lastName}`,
          scheduledFor: existingSameDay.scheduledFor.toISOString(),
          created: false,
          skipped: true,
          skipReason: "already_scheduled_same_day",
          ok: true,
        });
        continue;
      }

      const created = await createCheckInSession({
        subscriberId: senior.subscriberId,
        seniorId: senior.id,
        scheduledFor,
      });

      results.push({
        seniorId: senior.id,
        subscriberId: senior.subscriberId,
        seniorName: `${senior.firstName} ${senior.lastName}`,
        scheduledFor: created.ok ? created.checkIn.scheduledFor.toISOString() : scheduledFor.toISOString(),
        created: created.ok,
        skipped: false,
        ok: created.ok,
        message: created.ok ? undefined : created.message,
      });
    }

    const createdCount = results.filter((r) => r.created).length;
    const skippedCount = results.filter((r) => r.skipped).length;
    const failedCount = results.filter((r) => !r.ok).length;

    return NextResponse.json({
      ok: true,
      totalSeniors: seniors.length,
      created: createdCount,
      skipped: skippedCount,
      failed: failedCount,
      results,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { ok: false, message: `Advance day job failed: ${message}` },
      { status: 500 },
    );
  }
}
