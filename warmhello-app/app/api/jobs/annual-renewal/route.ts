import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJobSecret } from "@/lib/qstash";
import { getStripeClient } from "@/lib/stripe";
import { sendAnnualRenewalReminderEmail } from "@/lib/trial-emails";
import { addDays } from "@/lib/dates";

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

  try {
    const now = new Date();
    const windowStart = addDays(now, 13);
    const windowEnd = addDays(now, 15);

    const candidates = await prisma.subscriber.findMany({
      where: {
        OR: [
          { subscriptionStatus: "ACTIVE" },
          { subscriptionStatus: "CANCELED" },
          { subscriptionStatus: "PAST_DUE" },
        ],
        stripeSubscriptionId: { not: null },
        currentPeriodEndsAt: { gte: windowStart, lt: windowEnd },
      },
      select: {
        id: true,
        email: true,
        stripeSubscriptionId: true,
        currentPeriodEndsAt: true,
      },
      orderBy: { currentPeriodEndsAt: "asc" },
    });

    const results: Array<{
      subscriberId: string;
      annual: boolean;
      emailOk: boolean;
      message?: string;
      messageId?: string | null;
    }> = [];

    const stripe = getStripeClient();

    for (const subscriber of candidates) {
      let annualInterval = false;
      if (stripe && subscriber.stripeSubscriptionId) {
        try {
          const sub = await stripe.subscriptions.retrieve(subscriber.stripeSubscriptionId, {
            expand: ["items.data.price"],
          });
          annualInterval = sub.items.data.some((item) => {
            const p = item.price as any;
            if (!p?.recurring) return false;
            return (
              p.recurring.interval === "year" ||
              (p.recurring.interval === "month" && Number(p.recurring.interval_count) >= 12)
            );
          });
        } catch {
          annualInterval = subscriber.currentPeriodEndsAt != null;
        }
      } else {
        annualInterval = subscriber.currentPeriodEndsAt != null;
      }

      if (!annualInterval) {
        results.push({
          subscriberId: subscriber.id,
          annual: false,
          emailOk: false,
          message: "Skipped — subscription interval not annual.",
        });
        continue;
      }

      const sent = await sendAnnualRenewalReminderEmail(subscriber.id);
      const emailOk = sent.ok;
      const messageId = "id" in sent ? sent.id : null;
      const errorMsg = !sent.ok && "message" in sent ? sent.message : undefined;

      results.push({
        subscriberId: subscriber.id,
        annual: true,
        emailOk,
        messageId: messageId ?? undefined,
        message: emailOk ? "Reminder sent." : errorMsg,
      });
    }

    return NextResponse.json({
      ok: true,
      windowDays14Start: windowStart.toISOString(),
      windowDays14End: windowEnd.toISOString(),
      totalCandidates: candidates.length,
      remindersSent: results.filter((r) => r.emailOk).length,
      remindersSkippedNotAnnual: results.filter((r) => !r.annual).length,
      remindersFailed: results.filter((r) => !r.emailOk && r.annual).length,
      results,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { ok: false, message: `Annual renewal reminder job failed: ${message}` },
      { status: 500 },
    );
  }
}
