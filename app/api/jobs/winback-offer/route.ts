import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJobSecret } from "@/lib/qstash";
import { sendWinbackOfferEmail } from "@/lib/trial-emails";
import { subDays } from "@/lib/dates";

export async function POST(request: Request) {
  if (!verifyJobSecret(request)) {
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
    const windowStart = subDays(now, 21);
    const windowEnd = subDays(now, 20);

    const candidates = await prisma.subscriber.findMany({
      where: {
        subscriptionStatus: "PAST_DUE",
        trialEndedAt: { gte: windowStart, lt: windowEnd },
        winbackEmailSentAt: null,
        unsubscribedAt: null,
      },
      select: {
        id: true,
        email: true,
        trialEndedAt: true,
      },
      orderBy: { trialEndedAt: "asc" },
    });

    const results: Array<{
      subscriberId: string;
      emailOk: boolean;
      message?: string;
      messageId?: string | null;
    }> = [];

    const BATCH_SIZE = 5;
    for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
      const batch = candidates.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(async (subscriber) => {
          const sent = await sendWinbackOfferEmail(subscriber.id);
          const emailOk = sent.ok;
          const messageId = "id" in sent ? sent.id : null;
          const errorMsg = !sent.ok && "message" in sent ? sent.message : undefined;

          if (emailOk) {
            await prisma!.subscriber.update({
              where: { id: subscriber.id },
              data: { winbackEmailSentAt: new Date() },
            });
          }

          return {
            subscriberId: subscriber.id,
            emailOk,
            messageId: messageId ?? undefined,
            message: emailOk ? "Winback offer email sent." : errorMsg,
          };
        }),
      );
      results.push(...batchResults);
    }

    return NextResponse.json({
      ok: true,
      windowStart: windowStart.toISOString(),
      windowEnd: windowEnd.toISOString(),
      totalCandidates: candidates.length,
      emailsSent: results.filter((r) => r.emailOk).length,
      emailsFailed: results.filter((r) => !r.emailOk).length,
      results,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { ok: false, message: `Winback offer job failed: ${message}` },
      { status: 500 },
    );
  }
}
