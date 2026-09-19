import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJobSecret } from "@/lib/qstash";
import { aggregateDailyStats, getYesterdayDailyRange } from "@/lib/reports";
import { sendDailySalesReport } from "@/lib/report-emails";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!verifyJobSecret(request)) {
    return NextResponse.json(
      { ok: false, message: "Unauthorized job request." },
      { status: 401 },
    );
  }

  if (!prisma) {
    return NextResponse.json(
      { ok: false, message: "Database is not configured yet." },
      { status: 500 },
    );
  }

  try {
    const range = getYesterdayDailyRange();
    const summary = await aggregateDailyStats(range);
    const emailResult = await sendDailySalesReport(summary);

    if (!emailResult.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: `Report generated but email failed: ${emailResult.message}`,
          dateLabel: summary.dateLabel,
          emailResult,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      message: `Daily report sent successfully for ${summary.dateLabel}`,
      dateLabel: summary.dateLabel,
      range: { start: summary.rangeStartIso, end: summary.rangeEndIso },
      subscriberTotals: summary.subscriberTotals,
      newSubscribers: summary.newSubscribers.count,
      paidCheckouts: summary.paidCheckouts.count,
      paidTotals: {
        usd: summary.paidCheckouts.totalUsd,
        cad: summary.paidCheckouts.totalCad,
      },
      checkIns: summary.checkIns,
      complianceSms: summary.complianceSms,
      emailMessageId: emailResult.id,
      recipients: emailResult.recipients,
      subject: emailResult.subject,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { ok: false, message: `Daily sales report job failed: ${message}` },
      { status: 500 },
    );
  }
}
