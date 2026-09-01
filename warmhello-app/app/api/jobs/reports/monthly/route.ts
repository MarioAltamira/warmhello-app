import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJobSecret } from "@/lib/qstash";
import { aggregateMonthlyStats, getPreviousMonthlyRange } from "@/lib/reports";
import { sendMonthlySalesReport } from "@/lib/report-emails";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  runImmediately: z.boolean().default(false),
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
      { status: 500 },
    );
  }

  const raw = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(raw);
  void parsed;

  try {
    const range = getPreviousMonthlyRange();
    const summary = await aggregateMonthlyStats(range);
    const emailResult = await sendMonthlySalesReport(summary);

    if (!emailResult.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: `Monthly report generated but email failed: ${emailResult.message}`,
          monthLabel: summary.monthLabel,
          emailResult,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      message: `Monthly report sent successfully for ${summary.monthLabel}`,
      monthLabel: summary.monthLabel,
      range: { start: summary.firstDayIso, end: summary.lastDayIso },
      revenue: {
        totalUsd: summary.revenue.totalUsd,
        totalCad: summary.revenue.totalCad,
        transactions: summary.revenue.rows.length,
      },
      trials: {
        created: summary.trials.createdCount,
        convertedToPaid: summary.trials.convertedToPaid,
        expiredWithoutPurchase: summary.trials.expiredWithoutPurchase,
      },
      churned: summary.churned.count,
      checkIns: summary.checkIns,
      escalations: summary.escalations,
      operationalCounts: summary.operationalCounts,
      snapshotEndOfMonth: summary.snapshotEndOfMonth,
      emailMessageId: emailResult.id,
      recipients: emailResult.recipients,
      subject: emailResult.subject,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { ok: false, message: `Monthly sales report job failed: ${message}` },
      { status: 500 },
    );
  }
}
