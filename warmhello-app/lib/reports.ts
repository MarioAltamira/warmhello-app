import { prisma } from "@/lib/prisma";
import type { SubscriptionStatus } from "@prisma/client";

export type DailySummary = {
  dateLabel: string;
  rangeStartIso: string;
  rangeEndIso: string;
  subscriberTotals: {
    total: number;
    trial: number;
    active: number;
    pastDue: number;
    canceled: number;
  };
  newSubscribers: {
    count: number;
    rows: Array<{
      createdAt: string;
      fullName: string;
      email: string;
      billingCurrency: "USD" | "CAD" | string;
      subscriptionStatus: SubscriptionStatus | string;
      seniorName: string | null;
      seniorPhone: string | null;
    }>;
  };
  trialExpiredToday: {
    count: number;
    rows: Array<{
      fullName: string;
      email: string;
      trialEndedAt: string | null;
    }>;
  };
  paidCheckouts: {
    count: number;
    totalUsd: number;
    totalCad: number;
    rows: Array<{
      createdAt: string;
      fullName: string;
      email: string;
      amountUsd: number;
      amountCad: number;
      billingCurrency: string;
      billingInterval: string;
    }>;
  };
  checkIns: {
    totalScheduled: number;
    okay: number;
    callRequested: number;
    escalated: number;
    expired: number;
    pending: number;
  };
  complianceSms: {
    stopCount: number;
    helpCount: number;
  };
};

export type MonthlySummary = {
  year: number;
  month: number;
  monthLabel: string;
  firstDayIso: string;
  lastDayIso: string;
  revenue: {
    totalUsd: number;
    totalCad: number;
    rows: Array<{
      createdAt: string;
      fullName: string;
      email: string;
      amountUsd: number;
      amountCad: number;
      billingCurrency: string;
      billingInterval: string;
    }>;
  };
  churned: {
    count: number;
    rows: Array<{
      fullName: string;
      email: string;
      cancellationRequestedAt: string | null;
      cancellationDate: string | null;
    }>;
  };
  trials: {
    createdCount: number;
    convertedToPaid: number;
    expiredWithoutPurchase: number;
    newRows: Array<{
      createdAt: string;
      fullName: string;
      email: string;
      billingCurrency: string;
    }>;
  };
  checkIns: {
    totalScheduled: number;
    okay: number;
    callRequested: number;
    escalated: number;
    expired: number;
  };
  escalations: {
    totalAlertJobs: number;
    succeeded: number;
    failed: number;
  };
  operationalCounts: {
    smsSentCount: number;
    stopCount: number;
    helpCount: number;
    activeSeniors: number;
  };
  snapshotEndOfMonth: {
    totalSubscribers: number;
    activePaid: number;
    trial: number;
    pastDue: number;
    canceled: number;
  };
};

const EASTERN = "America/Toronto";

function ymdTz(date: Date, tz = EASTERN): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function monthTz(date: Date, tz = EASTERN): { year: number; month: number } {
  const y = Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric" }).format(date);
  const m = Intl.DateTimeFormat("en-CA", { timeZone: tz, month: "2-digit" }).format(date);
  return { year: Number(y), month: Number(m) };
}

function monthName(year: number, month: number): string {
  return new Date(year, month - 1, 1).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function startOfDayTz(date: Date, tz = EASTERN): Date {
  const isoParts = ymdTz(date, tz).split("-");
  const [y, m, d] = isoParts.map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function getYesterdayRange(tz = EASTERN): { start: Date; end: Date; dateLabel: string } {
  const now = new Date();
  const yesterday = startOfDayTz(addDays(startOfDayTz(now, tz), -1), tz);
  const start = yesterday;
  const end = addDays(start, 1);
  const dateLabel = ymdTz(start, tz);
  return { start, end, dateLabel };
}

function getMonthRangeFor(
  year: number,
  month: number,
  tz = EASTERN,
): {
  year: number;
  month: number;
  firstDay: Date;
  lastDay: Date;
  firstDayIso: string;
  lastDayIso: string;
  monthLabel: string;
} {
  const firstDay = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const lastDay = new Date(year, month, 1, 0, 0, 0, 0);
  return {
    year,
    month,
    firstDay,
    lastDay,
    firstDayIso: ymdTz(firstDay, tz),
    lastDayIso: ymdTz(addDays(lastDay, -1), tz),
    monthLabel: monthName(year, month),
  };
}

export function getYesterdayDailyRange(nowOverride?: Date) {
  void nowOverride;
  return getYesterdayRange();
}

export function getPreviousMonthlyRange(nowOverride?: Date) {
  const now = nowOverride ?? new Date();
  const { year, month } = monthTz(now);
  const d = new Date(year, month - 1, 1);
  d.setMonth(d.getMonth() - 1);
  const prev = monthTz(d);
  return getMonthRangeFor(prev.year, prev.month);
}

function currencyLabel(c: unknown): string {
  const s = String(c ?? "USD");
  if (s === "USD") return "USD ($)";
  if (s === "CAD") return "CAD ($)";
  return s;
}

async function countSubscribersByStatus(): Promise<Record<string, number>> {
  if (!prisma) throw new Error("DB not configured");
  const grouped = await prisma.subscriber.groupBy({
    by: ["subscriptionStatus"],
    _count: { _all: true },
  });
  const out: Record<string, number> = {};
  for (const row of grouped) {
    out[String(row.subscriptionStatus)] = row._count._all;
  }
  return out;
}

async function countCheckInsByStatus(range: { start: Date; end: Date }): Promise<Record<string, number>> {
  if (!prisma) throw new Error("DB not configured");
  const grouped = await prisma.checkIn.groupBy({
    by: ["status"],
    where: { scheduledFor: { gte: range.start, lt: range.end } },
    _count: { _all: true },
  });
  const out: Record<string, number> = {};
  for (const row of grouped) {
    out[String(row.status)] = row._count._all;
  }
  return out;
}

async function countAlertJobsByStatus(range: { start: Date; end: Date }): Promise<Record<string, number>> {
  if (!prisma) throw new Error("DB not configured");
  const grouped = await prisma.alertJob.groupBy({
    by: ["status"],
    where: { createdAt: { gte: range.start, lt: range.end } },
    _count: { _all: true },
  });
  const out: Record<string, number> = {};
  for (const row of grouped) {
    out[String(row.status)] = row._count._all;
  }
  return out;
}

async function countCallRequestedCheckIns(range: { start: Date; end: Date }): Promise<number> {
  if (!prisma) return 0;
  const rows = await prisma.alertJob.findMany({
    where: {
      createdAt: { gte: range.start, lt: range.end },
      kind: "confirmation_sms_call_request",
    },
    select: { checkInId: true },
    distinct: ["checkInId"],
  });
  return rows.length;
}

async function complianceSmsCounts(range: { start: Date; end: Date }): Promise<{ stop: number; help: number }> {
  if (!prisma) return { stop: 0, help: 0 };
  const grouped = await prisma.smsLog.groupBy({
    by: ["kind"],
    where: { direction: "IN", createdAt: { gte: range.start, lt: range.end } },
    _count: { _all: true },
  });
  const stop =
    grouped.find((r) => String(r.kind) === "sms_compliance_stop_reply")?._count._all ?? 0;
  const help =
    grouped.find((r) => String(r.kind) === "sms_compliance_help_reply")?._count._all ?? 0;
  return { stop, help };
}

function buildPaidCheckoutRowsFromSubscribers(
  rows: Array<{
    subscriptionStartedAt: Date | null;
    fullName: string;
    email: string;
    billingCurrency: string;
    billingInterval: string;
    subscriptionPriceAmount: number | null;
  }>,
): {
  rows: DailySummary["paidCheckouts"]["rows"];
  totalUsd: number;
  totalCad: number;
} {
  const out: DailySummary["paidCheckouts"]["rows"] = [];
  let totalUsd = 0;
  let totalCad = 0;
  for (const s of rows) {
    const amount = Number(s.subscriptionPriceAmount ?? 0);
    const isCad = String(s.billingCurrency).toUpperCase() === "CAD";
    const rowAmountUsd = isCad ? 0 : amount;
    const rowAmountCad = isCad ? amount : 0;
    totalUsd += rowAmountUsd;
    totalCad += rowAmountCad;
    out.push({
      createdAt: s.subscriptionStartedAt ? s.subscriptionStartedAt.toISOString() : new Date().toISOString(),
      fullName: s.fullName,
      email: s.email,
      amountUsd: rowAmountUsd,
      amountCad: rowAmountCad,
      billingCurrency: String(s.billingCurrency ?? "USD"),
      billingInterval: String(s.billingInterval ?? "MONTHLY"),
    });
  }
  return { rows: out, totalUsd, totalCad };
}

export async function aggregateDailyStats(range: {
  start: Date;
  end: Date;
  dateLabel: string;
}): Promise<DailySummary> {
  if (!prisma) {
    throw new Error("Database is not configured.");
  }

  const { start, end, dateLabel } = range;

  const [byStatus, totalSubsCount, newRowsRaw, trialExpiredTodayRaw, paidSubsRaw, totalCheckInsScheduled, ciByStatus, callRequestedCount, complianceIn] =
    await Promise.all([
      countSubscribersByStatus(),
      prisma.subscriber.count(),
      prisma.subscriber.findMany({
        where: { createdAt: { gte: start, lt: end } },
        select: {
          createdAt: true,
          fullName: true,
          email: true,
          billingCurrency: true,
          subscriptionStatus: true,
          seniors: {
            orderBy: { createdAt: "asc" },
            take: 1,
            select: { firstName: true, lastName: true, phoneNumber: true },
          },
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.subscriber.findMany({
        where: { trialEndedAt: { gte: start, lt: end } },
        select: { fullName: true, email: true, trialEndedAt: true },
        orderBy: { trialEndedAt: "asc" },
      }),
      prisma.subscriber.findMany({
        where: {
          subscriptionStartedAt: { gte: start, lt: end },
          subscriptionStatus: { in: ["ACTIVE", "PAST_DUE", "CANCELED"] },
        },
        select: {
          subscriptionStartedAt: true,
          fullName: true,
          email: true,
          billingCurrency: true,
          billingInterval: true,
          subscriptionPriceAmount: true,
        },
        orderBy: { subscriptionStartedAt: "asc" },
      }),
      prisma.checkIn.count({ where: { scheduledFor: { gte: start, lt: end } } }),
      countCheckInsByStatus({ start, end }),
      countCallRequestedCheckIns({ start, end }),
      complianceSmsCounts({ start, end }),
    ]);

  const newRows = newRowsRaw.map((s) => ({
    createdAt: s.createdAt.toISOString(),
    fullName: s.fullName,
    email: s.email,
    billingCurrency: String(s.billingCurrency ?? "USD"),
    subscriptionStatus: String(s.subscriptionStatus),
    seniorName: s.seniors[0] ? `${s.seniors[0].firstName} ${s.seniors[0].lastName}`.trim() : null,
    seniorPhone: s.seniors[0]?.phoneNumber ?? null,
  }));

  const trialExpiredToday = trialExpiredTodayRaw.map((s) => ({
    fullName: s.fullName,
    email: s.email,
    trialEndedAt: s.trialEndedAt ? s.trialEndedAt.toISOString() : null,
  }));

  const { rows: paidRows, totalUsd, totalCad } = buildPaidCheckoutRowsFromSubscribers(
    paidSubsRaw.map((s) => ({
      ...s,
      billingCurrency: String(s.billingCurrency),
      billingInterval: String(s.billingInterval),
      subscriptionPriceAmount: s.subscriptionPriceAmount ? Number(s.subscriptionPriceAmount) : null,
    })),
  );

  return {
    dateLabel,
    rangeStartIso: start.toISOString(),
    rangeEndIso: end.toISOString(),
    subscriberTotals: {
      total: totalSubsCount,
      trial: byStatus.TRIAL ?? 0,
      active: byStatus.ACTIVE ?? 0,
      pastDue: byStatus.PAST_DUE ?? 0,
      canceled: byStatus.CANCELED ?? 0,
    },
    newSubscribers: {
      count: newRows.length,
      rows: newRows,
    },
    trialExpiredToday: {
      count: trialExpiredToday.length,
      rows: trialExpiredToday,
    },
    paidCheckouts: {
      count: paidRows.length,
      totalUsd,
      totalCad,
      rows: paidRows,
    },
    checkIns: {
      totalScheduled: totalCheckInsScheduled,
      okay: ciByStatus.CONFIRMED ?? 0,
      callRequested: callRequestedCount,
      escalated: ciByStatus.ESCALATED ?? 0,
      expired: ciByStatus.EXPIRED ?? 0,
      pending: ciByStatus.PENDING ?? 0,
    },
    complianceSms: { stopCount: complianceIn.stop, helpCount: complianceIn.help },
  } satisfies DailySummary;
}

export async function aggregateMonthlyStats(range: {
  year: number;
  month: number;
  firstDay: Date;
  lastDay: Date;
  firstDayIso: string;
  lastDayIso: string;
  monthLabel: string;
}): Promise<MonthlySummary> {
  if (!prisma) throw new Error("Database is not configured.");

  const { year, month, firstDay, lastDay, firstDayIso, lastDayIso, monthLabel } = range;

  const [
    paidSubsRaw,
    churnedRaw,
    trialsCreatedRaw,
    expiredWithoutPurchase,
    totalCheckInsScheduled,
    ciByStatus,
    callRequestedMonth,
    totalAlertJobs,
    escByStatus,
    smsSentCount,
    complianceInMonth,
    activeSeniors,
    snapByStatus,
    totalSnap,
  ] = await Promise.all([
    prisma.subscriber.findMany({
      where: {
        subscriptionStartedAt: { gte: firstDay, lt: lastDay },
        subscriptionStatus: { in: ["ACTIVE", "PAST_DUE", "CANCELED"] },
      },
      select: {
        subscriptionStartedAt: true,
        fullName: true,
        email: true,
        billingCurrency: true,
        billingInterval: true,
        subscriptionPriceAmount: true,
      },
      orderBy: { subscriptionStartedAt: "asc" },
    }),
    prisma.subscriber.findMany({
      where: {
        OR: [
          { cancellationRequestedAt: { gte: firstDay, lt: lastDay } },
          { cancellationDate: { gte: firstDay, lt: lastDay } },
        ],
        subscriptionStatus: { in: ["CANCELED", "PAST_DUE"] },
      },
      select: {
        fullName: true,
        email: true,
        cancellationRequestedAt: true,
        cancellationDate: true,
      },
      orderBy: [{ cancellationDate: { sort: "asc", nulls: "last" } }],
    }),
    prisma.subscriber.findMany({
      where: { createdAt: { gte: firstDay, lt: lastDay }, subscriptionStatus: { not: "CANCELED" } },
      select: {
        createdAt: true,
        fullName: true,
        email: true,
        billingCurrency: true,
        subscriptionStatus: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.subscriber.count({
      where: { trialEndedAt: { gte: firstDay, lt: lastDay }, subscriptionStatus: { not: "ACTIVE" } },
    }),
    prisma.checkIn.count({ where: { scheduledFor: { gte: firstDay, lt: lastDay } } }),
    countCheckInsByStatus({ start: firstDay, end: lastDay }),
    countCallRequestedCheckIns({ start: firstDay, end: lastDay }),
    prisma.alertJob.count({ where: { createdAt: { gte: firstDay, lt: lastDay } } }),
    countAlertJobsByStatus({ start: firstDay, end: lastDay }),
    prisma.smsLog.count({ where: { direction: "OUT", createdAt: { gte: firstDay, lt: lastDay } } }),
    complianceSmsCounts({ start: firstDay, end: lastDay }),
    prisma.senior.count({ where: { active: true } }),
    countSubscribersByStatus(),
    prisma.subscriber.count(),
  ]);

  const { rows: revenueRows, totalUsd, totalCad } = buildPaidCheckoutRowsFromSubscribers(
    paidSubsRaw.map((s) => ({
      ...s,
      billingCurrency: String(s.billingCurrency),
      billingInterval: String(s.billingInterval),
      subscriptionPriceAmount: s.subscriptionPriceAmount ? Number(s.subscriptionPriceAmount) : null,
    })),
  );

  const churned = churnedRaw.map((c) => ({
    fullName: c.fullName,
    email: c.email,
    cancellationRequestedAt: c.cancellationRequestedAt ? c.cancellationRequestedAt.toISOString() : null,
    cancellationDate: c.cancellationDate ? c.cancellationDate.toISOString() : null,
  }));

  const convertedToPaid = trialsCreatedRaw.filter(
    (s) => s.subscriptionStatus === "ACTIVE" || s.subscriptionStatus === "PAST_DUE",
  ).length;

  const alertSucceeded = escByStatus.SENT ?? 0;
  const alertFailed = escByStatus.FAILED ?? 0;

  return {
    year,
    month,
    monthLabel,
    firstDayIso,
    lastDayIso,
    revenue: {
      totalUsd,
      totalCad,
      rows: revenueRows,
    },
    churned: { count: churned.length, rows: churned },
    trials: {
      createdCount: trialsCreatedRaw.length,
      convertedToPaid,
      expiredWithoutPurchase,
      newRows: trialsCreatedRaw.map((s) => ({
        createdAt: s.createdAt.toISOString(),
        fullName: s.fullName,
        email: s.email,
        billingCurrency: String(s.billingCurrency ?? "USD"),
      })),
    },
    checkIns: {
      totalScheduled: totalCheckInsScheduled,
      okay: ciByStatus.CONFIRMED ?? 0,
      callRequested: callRequestedMonth,
      escalated: ciByStatus.ESCALATED ?? 0,
      expired: ciByStatus.EXPIRED ?? 0,
    },
    escalations: {
      totalAlertJobs,
      succeeded: alertSucceeded,
      failed: alertFailed,
    },
    operationalCounts: {
      smsSentCount,
      stopCount: complianceInMonth.stop,
      helpCount: complianceInMonth.help,
      activeSeniors,
    },
    snapshotEndOfMonth: {
      totalSubscribers: totalSnap,
      activePaid: snapByStatus.ACTIVE ?? 0,
      trial: snapByStatus.TRIAL ?? 0,
      pastDue: snapByStatus.PAST_DUE ?? 0,
      canceled: snapByStatus.CANCELED ?? 0,
    },
  } satisfies MonthlySummary;
}

export { currencyLabel };
