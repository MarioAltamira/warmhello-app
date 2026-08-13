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

type AdvanceDayResultEnqueue = {
  firstJobMessageId: string | null;
  reminderJobMessageId: string | null;
  escalationJobMessageId: string | null;
  firstSmsDeliveredImmediately: boolean;
  enqueueErrors: string[];
  enqueueOk: number;
  enqueueFailed: number;
};

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
  enqueue?: AdvanceDayResultEnqueue;
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
    let totalEnqueueOk = 0;
    let totalEnqueueFailed = 0;
    let immediateSmsDeliveredCount = 0;

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
      const from = now;
      const scheduledFor = getNextOccurrenceAtHourInTimeZone({
        timeZone,
        hour: senior.checkInHour,
        minute: senior.checkInMinute,
        from,
      });

      const localHour = parseInt(
        new Intl.DateTimeFormat("en-CA", {
          timeZone,
          hour: "2-digit",
          hour12: false,
        }).format(scheduledFor),
        10,
      );
      const localMinute = parseInt(
        new Intl.DateTimeFormat("en-CA", {
          timeZone,
          minute: "2-digit",
        }).format(scheduledFor),
        10,
      );
      const localSecond = parseInt(
        new Intl.DateTimeFormat("en-CA", {
          timeZone,
          second: "2-digit",
        }).format(scheduledFor),
        10,
      );
      const msSinceSeniorMidnight =
        (localHour * 60 * 60 + localMinute * 60 + localSecond) * 1000;
      const dayStart = new Date(scheduledFor.getTime() - msSinceSeniorMidnight);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
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

      if (created.ok) {
        totalEnqueueOk += created.enqueue.enqueueOk;
        totalEnqueueFailed += created.enqueue.enqueueFailed;
        if (created.enqueue.firstSmsDeliveredImmediately) immediateSmsDeliveredCount += 1;
      }

      results.push({
        seniorId: senior.id,
        subscriberId: senior.subscriberId,
        seniorName: `${senior.firstName} ${senior.lastName}`,
        scheduledFor: created.ok ? created.checkIn.scheduledFor.toISOString() : scheduledFor.toISOString(),
        created: created.ok,
        skipped: false,
        ok: created.ok,
        message: created.ok ? undefined : created.message,
        enqueue: created.ok ? created.enqueue : undefined,
      });
    }

    const createdCount = results.filter((r) => r.created).length;
    const skippedCount = results.filter((r) => r.skipped).length;
    const failedCount = results.filter((r) => !r.ok).length;
    const rowsWithAnyEnqueueFailure = results.filter(
      (r) => r.enqueue && r.enqueue.enqueueFailed > 0,
    ).length;

    return NextResponse.json({
      ok: true,
      totalSeniors: seniors.length,
      created: createdCount,
      skipped: skippedCount,
      failed: failedCount,
      enqueueSummary: {
        totalEnqueueOk,
        totalEnqueueFailed,
        rowsWithAnyEnqueueFailure,
        immediateSmsDeliveredCount,
      },
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
