import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSubscriberSession } from "@/lib/subscriber-session";

export const dynamic = "force-dynamic";

export async function GET() {
  const { subscriberId, sessionExpired } = await getSubscriberSession();
  if (!subscriberId || sessionExpired) {
    return NextResponse.json(
      { ok: false, message: "Not signed in." },
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
    const subscriber = await prisma.subscriber.findUnique({
      where: { id: subscriberId },
      select: {
        id: true,
        email: true,
        fullName: true,
        phoneNumber: true,
        billingCurrency: true,
        subscriptionStatus: true,
        currentPeriodEndsAt: true,
        tosAcceptedAt: true,
        tosVersion: true,
        caregiverSeniorConsentAckAt: true,
        dashboardDisclaimerDismissedAt: true,
        createdAt: true,
        updatedAt: true,
        seniors: {
          include: {
            contacts: { orderBy: [{ priority: "asc" }, { createdAt: "asc" }] },
          },
        },
      },
    });

    if (!subscriber) {
      return NextResponse.json(
        { ok: false, message: "Subscriber was not found." },
        { status: 404 },
      );
    }

    const seniorIds = subscriber.seniors.map((s) => s.id);

    const [checkIns, smsLogs] = await Promise.all([
      prisma.checkIn
        .findMany({
          where: { subscriberId },
          orderBy: { scheduledFor: "desc" },
          take: 2000,
        })
        .catch(() => []),
      prisma.smsLog
        .findMany({
          where: { OR: [{ subscriberId }, { seniorId: { in: seniorIds } }] },
          orderBy: { createdAt: "desc" },
          take: 5000,
          select: {
            id: true,
            direction: true,
            status: true,
            provider: true,
            kind: true,
            fromNumber: true,
            toNumber: true,
            providerMessageId: true,
            createdAt: true,
          },
        })
        .catch(() => []),
    ]);

    const exportedAt = new Date().toISOString();
    const payload = {
      exportedAt,
      privacyRequest:
        "This export was generated in response to an individual access request per PIPEDA Principle 4.9 / CCPA §1798.100.",
      retentionNotes: {
        checkInLogs: "24 months after scheduled date (PIPEDA schedule).",
        billingRecords:
          "7 years from transaction date (Canada Income Tax Act, GST/HST record-keeping).",
        smsConsentRecords:
          "6 years from last message sent or opt-out (CASL s.13(1) tombstone — stored in SmsConsentTombstone table, exportable on written request).",
        serverLogs: "12 months from record date, then destroyed.",
      },
      subscriber: {
        id: subscriber.id,
        email: subscriber.email,
        fullName: subscriber.fullName,
        phoneNumber: subscriber.phoneNumber,
        billingCurrency: subscriber.billingCurrency,
        subscriptionStatus: subscriber.subscriptionStatus,
        currentPeriodEndsAt: subscriber.currentPeriodEndsAt ?? null,
        consent: {
          tosAcceptedAt: subscriber.tosAcceptedAt ?? null,
          tosVersion: subscriber.tosVersion ?? null,
          caregiverSeniorConsentAckAt: subscriber.caregiverSeniorConsentAckAt ?? null,
          dashboardDisclaimerDismissedAt: subscriber.dashboardDisclaimerDismissedAt ?? null,
        },
        createdAt: subscriber.createdAt,
        updatedAt: subscriber.updatedAt,
      },
      seniors: subscriber.seniors.map((senior) => ({
        id: senior.id,
        firstName: senior.firstName,
        lastName: senior.lastName,
        phoneNumber: senior.phoneNumber,
        timezone: senior.timezone,
        checkInHour: senior.checkInHour,
        checkInMinute: senior.checkInMinute,
        secondAttemptHours: senior.secondAttemptHours,
        active: senior.active,
        smsOptedOut: Boolean((senior as any).smsOptedOut ?? false),
        smsOptedOutAt: (senior as any).smsOptedOutAt ?? null,
        caregiverConsentAckAt: (senior as any).caregiverConsentAckAt ?? null,
        createdAt: senior.createdAt,
        updatedAt: senior.updatedAt,
        contacts: senior.contacts.map((c) => ({
          id: c.id,
          name: c.fullName,
          relationship: c.relationship,
          phoneNumber: c.phoneNumber,
          priority: c.priority,
          voiceCallEnabled: Boolean((c as any).voiceCallEnabled ?? false),
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        })),
      })),
      checkIns,
      smsLogs,
    };

    const filename = `warmhello-account-export-${subscriber.id}-${new Date()
      .toISOString()
      .replace(/[:.]/g, "-")}.json`;
    const body = JSON.stringify(payload, null, 2);

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(Buffer.byteLength(body, "utf8")),
        "Cache-Control": "private, no-store, no-cache, must-revalidate",
      },
    });
  } catch {
    return NextResponse.json(
      { ok: false, message: "Could not export data right now." },
      { status: 500 },
    );
  }
}
