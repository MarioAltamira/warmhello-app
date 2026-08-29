import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyJobSecret } from "@/lib/qstash";
import { prisma } from "@/lib/prisma";
import { getSubscriberPlanSummary } from "@/lib/subscriber-plan";
import { buildThankYouSmsBody, shouldSendCheckInMessaging } from "@/lib/subscriber-lifecycle";
import { parseJsonBody } from "@/lib/zod-parse";

const bodySchema = z.object({
  subscriberId: z.string().min(1),
});

export async function POST(request: Request) {
  if (!verifyJobSecret(request) && process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { ok: false, message: "Unauthorized job request." },
      { status: 401 },
    );
  }

  if (!prisma) {
    return NextResponse.json(
      { ok: false, message: "Database is not configured yet." },
      { status: 400 },
    );
  }

  const parseRes = await parseJsonBody(request, bodySchema);
  if (!parseRes.ok) return parseRes.response;
  const parsed = parseRes.data;

  try {
    const subscriber = await prisma.subscriber.findUnique({
      where: { id: parsed.subscriberId },
      include: {
        seniors: {
          orderBy: { createdAt: "asc" },
          take: 1,
        },
      },
    });

    if (!subscriber) {
      return NextResponse.json(
        { ok: false, message: "Subscriber was not found." },
        { status: 400 },
      );
    }

    const summary = getSubscriberPlanSummary({
      created: subscriber.created,
      subscriptionStatus: subscriber.subscriptionStatus,
      currentPeriodEndsAt: subscriber.currentPeriodEndsAt,
    });

    if (subscriber.subscriptionStatus !== "TRIAL") {
      return NextResponse.json({
        ok: true,
        message: `No change needed. Subscriber status is ${subscriber.subscriptionStatus}.`,
      });
    }

    let newStatus: "TRIAL" | "ACTIVE" | "PAST_DUE" | "CANCELED" = subscriber.subscriptionStatus as any;
    if (summary.isFreeTrial && summary.isTrialExpired) {
      await prisma.subscriber.update({
        where: { id: subscriber.id },
        data: {
          subscriptionStatus: "PAST_DUE",
          currentPeriodEndsAt: summary.trialEndsAt,
          trialEndedAt: summary.trialEndsAt,
          trialStartedAt: subscriber.trialStartedAt ?? subscriber.created,
        },
      });
      newStatus = "PAST_DUE";
    }

    const canSendSms = shouldSendCheckInMessaging({
      subscriptionStatus: newStatus,
      created: subscriber.created,
      currentPeriodEndsAt: subscriber.currentPeriodEndsAt ?? summary.trialEndsAt,
    });

    const shouldSendTrialThankYouSms = summary.isFreeTrial && summary.isTrialExpired;

    if (subscriber.seniors[0] && shouldSendTrialThankYouSms) {
      const body = buildThankYouSmsBody({
        seniorFirstName: subscriber.seniors[0].firstName,
        subscriberName: subscriber.fullName,
      });
      const { sendSms } = await import("@/lib/sms");
      await sendSms(subscriber.seniors[0].phoneNumber, body, {
        subscriberId: subscriber.id,
        seniorId: subscriber.seniors[0].id,
        kind: "trial_thank_you_sms",
      });
    }

    return NextResponse.json({
      ok: true,
      message: "Day-8 lifecycle event processed.",
    });
  } catch {
    return NextResponse.json(
      { ok: false, message: "Database is not reachable right now." },
      { status: 400 },
    );
  }
}
