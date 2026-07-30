import { addHours, formatDateTime } from "@/lib/dates";
import { demoCheckIn, demoDashboard } from "@/lib/demo-data";
import { getIntegrationStatus } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { getSubscriberPlanSummary } from "@/lib/subscriber-plan";
import { createCheckInToken } from "@/lib/tokens";

function formatEnumLabel(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildDashboardSnapshot(subscriber: {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  stripeCustomerId: string | null;
  subscriptionStatus: "TRIAL" | "ACTIVE" | "PAST_DUE" | "CANCELED";
  created: Date;
  seniors: Array<{
    firstName: string;
    lastName: string;
    secondAttemptHours: number;
  }>;
  contacts: Array<{
    fullName: string;
    relationship: string;
    phoneNumber: string;
  }>;
  checkIns: Array<{
    token: string;
    status: "PENDING" | "CONFIRMED" | "REMINDER_SENT" | "ESCALATED" | "EXPIRED";
    scheduledFor: Date;
    confirmedAt: Date | null;
  }>;
}) {
  const senior = subscriber.seniors[0];
  const latestCheckIn = subscriber.checkIns[0];
  const plan = getSubscriberPlanSummary({
    created: subscriber.created,
    subscriptionStatus: subscriber.subscriptionStatus,
  });

  return {
    subscriberId: subscriber.id,
    subscriberName: subscriber.fullName,
    subscriberEmail: subscriber.email,
    subscriberPhone: subscriber.phoneNumber,
    subscriptionStatus: plan.statusLabel,
    isPaidSubscriber: plan.isPaidSubscriber,
    isTrialExpired: plan.isTrialExpired,
    showBuyNow: plan.showBuyNow,
    hasHousehold: true,
    seniorName: `${senior.firstName} ${senior.lastName}`,
    nextCheckInLabel: latestCheckIn
      ? formatDateTime(latestCheckIn.scheduledFor)
      : "No check-in scheduled yet",
    latestCheckInStatus: latestCheckIn
      ? formatEnumLabel(latestCheckIn.status)
      : "Not scheduled",
    latestCheckInToken: latestCheckIn?.token,
    latestConfirmedLabel: latestCheckIn?.confirmedAt
      ? formatDateTime(latestCheckIn.confirmedAt)
      : undefined,
    billingCustomerLabel: subscriber.stripeCustomerId
      ? `Stripe customer ${subscriber.stripeCustomerId}`
      : "Stripe customer will appear after checkout.",
    contacts: subscriber.contacts.map((contact) => ({
      fullName: contact.fullName,
      relationship: contact.relationship,
      phoneNumber: contact.phoneNumber,
    })),
    escalationPolicy: `Second attempt after ${senior.secondAttemptHours} hour${senior.secondAttemptHours === 1 ? "" : "s"}, contact alerts after another ${senior.secondAttemptHours} hour${senior.secondAttemptHours === 1 ? "" : "s"}.`,
    integrationStatus: getIntegrationStatus(),
  };
}

export async function getDashboardSnapshot(subscriberId?: string | null) {
  if (!prisma) {
    return {
      ...demoDashboard,
      integrationStatus: getIntegrationStatus(),
    };
  }

  try {
    const subscriber = subscriberId
      ? await prisma.subscriber.findUnique({
          where: { id: subscriberId },
          include: {
            seniors: true,
            contacts: {
              orderBy: { priority: "asc" },
            },
            checkIns: {
              orderBy: { scheduledFor: "desc" },
              take: 1,
            },
          },
        })
      : await prisma.subscriber.findFirst({
      include: {
        seniors: true,
        contacts: {
          orderBy: { priority: "asc" },
        },
        checkIns: {
          orderBy: { scheduledFor: "desc" },
          take: 1,
        },
      },
        });

    if (!subscriber || subscriber.seniors.length === 0) {
      return {
        ...demoDashboard,
        integrationStatus: getIntegrationStatus(),
      };
    }

    return buildDashboardSnapshot(subscriber);
  } catch {
    return {
      ...demoDashboard,
      integrationStatus: getIntegrationStatus(),
    };
  }
}

export async function getCheckInPageData(token: string) {
  if (!prisma) {
    if (token === demoCheckIn.token) {
      return demoCheckIn;
    }

    return {
      ...demoCheckIn,
      token,
      status: "expired" as const,
      scheduledLabel: "This link is not active.",
    };
  }

  try {
    const checkIn = await prisma.checkIn.findUnique({
      where: { token },
      include: { senior: true },
    });

    if (!checkIn) {
      return {
        token,
        seniorName: "Unknown recipient",
        scheduledLabel: "This link does not exist.",
        status: "expired" as const,
      };
    }

    return {
      token,
      seniorName: checkIn.senior.firstName,
      scheduledLabel: formatDateTime(checkIn.scheduledFor),
      status:
        checkIn.status === "CONFIRMED"
          ? ("confirmed" as const)
          : checkIn.status === "EXPIRED"
            ? ("expired" as const)
            : ("pending" as const),
      confirmedLabel: checkIn.confirmedAt
        ? formatDateTime(checkIn.confirmedAt)
        : undefined,
    };
  } catch {
    if (token === demoCheckIn.token) {
      return demoCheckIn;
    }

    return {
      ...demoCheckIn,
      token,
      status: "expired" as const,
      scheduledLabel: "This link is not active.",
    };
  }
}

export async function confirmCheckInToken(token: string) {
  if (!prisma) {
    if (token === demoCheckIn.token) {
      return { ok: true as const, message: "Demo check-in confirmed." };
    }

    return { ok: false as const, message: "This link is not active." };
  }

  try {
    const existing = await prisma.checkIn.findUnique({
      where: { token },
      include: {
        senior: true,
        subscriber: true,
      },
    });
    if (!existing) {
      return { ok: false as const, message: "Check-in link not found." };
    }

    if (existing.status === "CONFIRMED") {
      return { ok: true as const, message: "Already confirmed." };
    }

    if (existing.status === "EXPIRED") {
      return { ok: false as const, message: "This check-in window has expired." };
    }

    await prisma.checkIn.update({
      where: { token },
      data: {
        status: "CONFIRMED",
        confirmedAt: new Date(),
      },
    });

    try {
      const contacts = await prisma.contact.findMany({
        where: { seniorId: existing.seniorId },
        orderBy: { priority: "asc" },
      });
      const { sendSms } = await import("@/lib/sms");
      const message = `${existing.senior.firstName} is okay and has completed today's WarmHello check-in.`;
      const notifications = await Promise.all(
        contacts.map((contact) => sendSms(contact.phoneNumber, message)),
      );

      if (contacts.length > 0) {
        await prisma.alertJob.createMany({
          data: contacts.map((contact, index) => ({
            checkInId: existing.id,
            kind: "confirmation_sms",
            status: notifications[index]?.ok ? "SENT" : "FAILED",
            providerMessageId: notifications[index]?.ok ? notifications[index].sid : null,
            payload: { contactId: contact.id, phoneNumber: contact.phoneNumber },
            runAt: new Date(),
          })),
        });
      }
    } catch {
      // Confirmation itself should still succeed even if notifications are not configured yet.
    }

    return { ok: true as const, message: "Check-in confirmed successfully." };
  } catch {
    return { ok: false as const, message: "Database is not reachable right now." };
  }
}

export async function createCheckInSession(input: {
  subscriberId: string;
  seniorId: string;
  scheduledFor?: Date;
}) {
  if (!prisma) {
    return { ok: false as const, message: "Database is not configured yet." };
  }

  try {
    const senior = await prisma.senior.findUnique({
      where: { id: input.seniorId },
      include: { subscriber: true },
    });

    if (!senior || senior.subscriberId !== input.subscriberId) {
      return { ok: false as const, message: "Subscriber or senior record was not found." };
    }

    const scheduledFor = input.scheduledFor ?? new Date();
    const reminderDelayHours = senior.secondAttemptHours;
    const escalationDelayHours = senior.secondAttemptHours * 2;
    const reminderAt = addHours(scheduledFor, reminderDelayHours);
    const escalationAt = addHours(scheduledFor, escalationDelayHours);

    const checkIn = await prisma.checkIn.create({
      data: {
        subscriberId: senior.subscriberId,
        seniorId: senior.id,
        token: createCheckInToken(),
        scheduledFor,
        reminderAt,
        escalationAt,
      },
    });

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "http://localhost:8080";
    const checkInUrl = `${appUrl}/checkin/${checkIn.token}`;
    const [{ enqueueJsonJob }, { sendSms }] = await Promise.all([
      import("@/lib/qstash"),
      import("@/lib/sms"),
    ]);

    await sendSms(senior.phoneNumber, `WarmHello check-in for ${senior.firstName}: ${checkInUrl}`);
    await enqueueJsonJob("/api/jobs/reminder", { checkInId: checkIn.id }, reminderDelayHours);
    await enqueueJsonJob(
      "/api/jobs/escalation",
      { checkInId: checkIn.id },
      escalationDelayHours,
    );

    return { ok: true as const, checkIn };
  } catch {
    return { ok: false as const, message: "Database is not reachable right now." };
  }
}

export async function markReminderSent(checkInId: string) {
  if (!prisma) {
    return { ok: false as const, message: "Database is not configured yet." };
  }

  try {
    const { sendSms } = await import("@/lib/sms");
    const checkIn = await prisma.checkIn.findUnique({
      where: { id: checkInId },
      include: { senior: true },
    });

    if (!checkIn || checkIn.status === "CONFIRMED") {
      return { ok: false as const, message: "No reminder needed." };
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "http://localhost:8080";
    const checkInUrl = `${appUrl}/checkin/${checkIn.token}`;
    const sms = await sendSms(
      checkIn.senior.phoneNumber,
      `WarmHello reminder for ${checkIn.senior.firstName}: please tap your secure check-in link if you are okay: ${checkInUrl}`,
    );

    await prisma.checkIn.update({
      where: { id: checkInId },
      data: { status: "REMINDER_SENT" },
    });

    await prisma.alertJob.create({
      data: {
        checkInId,
        kind: "reminder_sms",
        status: sms.ok ? "SENT" : "FAILED",
        providerMessageId: sms.ok ? sms.sid : null,
        payload: { phoneNumber: checkIn.senior.phoneNumber },
        runAt: new Date(),
      },
    });

    return { ok: true as const, message: "Reminder processed." };
  } catch {
    return { ok: false as const, message: "Database is not reachable right now." };
  }
}

export async function markEscalationSent(checkInId: string) {
  if (!prisma) {
    return { ok: false as const, message: "Database is not configured yet." };
  }

  try {
    const { sendSms } = await import("@/lib/sms");
    const checkIn = await prisma.checkIn.findUnique({
      where: { id: checkInId },
      include: {
        senior: true,
      },
    });

    if (!checkIn || checkIn.status === "CONFIRMED") {
      return { ok: false as const, message: "No escalation needed." };
    }

    const contacts = await prisma.contact.findMany({
      where: { seniorId: checkIn.seniorId },
      orderBy: { priority: "asc" },
    });

    const results = await Promise.all(
      contacts.map((contact) =>
        sendSms(
          contact.phoneNumber,
          `WarmHello alert: ${checkIn.senior.firstName} has not responded to today's check-in.`,
        ),
      ),
    );

    await prisma.checkIn.update({
      where: { id: checkInId },
      data: { status: "ESCALATED" },
    });

    await prisma.alertJob.createMany({
      data: contacts.map((contact, index) => ({
        checkInId,
        kind: "escalation_sms",
        status: results[index]?.ok ? "SENT" : "FAILED",
        providerMessageId: results[index]?.ok ? results[index].sid : null,
        payload: { contactId: contact.id, phoneNumber: contact.phoneNumber },
        runAt: new Date(),
      })),
    });

    return { ok: true as const, message: "Escalation processed." };
  } catch {
    return { ok: false as const, message: "Database is not reachable right now." };
  }
}
