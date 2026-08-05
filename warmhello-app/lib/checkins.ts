import { addHours, formatDateTime } from "@/lib/dates";
import { demoCheckIn, demoDashboard } from "@/lib/demo-data";
import { getIntegrationStatus } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { getShortLinkForCheckIn } from "@/lib/short-links";
import { getSubscriberPlanSummary } from "@/lib/subscriber-plan";
import { shouldSendCheckInMessaging } from "@/lib/subscriber-lifecycle";
import { normalizeTimeZone } from "@/lib/timezones";
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
    timezone: string;
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
  const timeZone = normalizeTimeZone(senior.timezone);
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
      ? formatDateTime(latestCheckIn.scheduledFor, timeZone)
      : "No check-in scheduled yet",
    latestCheckInStatus: latestCheckIn
      ? formatEnumLabel(latestCheckIn.status)
      : "Not scheduled",
    latestCheckInToken: latestCheckIn?.token,
    latestConfirmedLabel: latestCheckIn?.confirmedAt
      ? formatDateTime(latestCheckIn.confirmedAt, timeZone)
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

    const timeZone = normalizeTimeZone(checkIn.senior.timezone);
    return {
      token,
      seniorName: checkIn.senior.firstName,
      scheduledLabel: formatDateTime(checkIn.scheduledFor, timeZone),
      status:
        checkIn.status === "CONFIRMED"
          ? ("confirmed" as const)
          : checkIn.status === "EXPIRED"
            ? ("expired" as const)
            : ("pending" as const),
      confirmedLabel: checkIn.confirmedAt
        ? formatDateTime(checkIn.confirmedAt, timeZone)
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
      const message = `${existing.senior.firstName} is okay and has completed today's Warm-Hello check-in.`;
      const notifications = await Promise.all(
        contacts.map((contact) =>
          sendSms(contact.phoneNumber, message, {
            subscriberId: existing.subscriberId,
            seniorId: existing.seniorId,
            checkInId: existing.id,
            kind: "confirmation_sms",
          }),
        ),
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

export async function markInitialSent(checkInId: string) {
  if (!prisma) {
    return { ok: false as const, message: "Database is not configured yet." };
  }

  try {
    const { sendSms } = await import("@/lib/sms");
    const checkIn = await prisma.checkIn.findUnique({
      where: { id: checkInId },
      include: {
        senior: true,
        subscriber: {
          select: { id: true, subscriptionStatus: true, created: true },
        },
      },
    });

    if (!checkIn || checkIn.status === "CONFIRMED" || checkIn.status === "EXPIRED") {
      return { ok: false as const, message: "No check-in needed." };
    }

    if (
      !checkIn.subscriber ||
      !shouldSendCheckInMessaging({
        subscriptionStatus: checkIn.subscriber.subscriptionStatus,
        created: checkIn.subscriber.created,
      })
    ) {
      return {
        ok: false as const,
        message: "Check-in messaging is disabled for this subscriber status.",
      };
    }

    const checkInUrl = await getShortLinkForCheckIn({ checkInId: checkIn.id, token: checkIn.token });
    const sms = await sendSms(
      checkIn.senior.phoneNumber,
      `Hi ${checkIn.senior.firstName} — it’s time for your Warm-Hello check-in.\nTap I’m OK: ${checkInUrl}`,
      {
        subscriberId: checkIn.subscriberId,
        seniorId: checkIn.seniorId,
        checkInId: checkIn.id,
        kind: "initial_sms",
      },
    );

    await prisma.alertJob.create({
      data: {
        checkInId,
        kind: "initial_sms",
        status: sms.ok ? "SENT" : "FAILED",
        providerMessageId: sms.ok ? sms.sid : null,
        payload: { phoneNumber: checkIn.senior.phoneNumber },
        runAt: new Date(),
      },
    });

    if (!sms.ok) {
      return { ok: false as const, message: sms.message };
    }

    return { ok: true as const, message: "Check-in sent." };
  } catch {
    return { ok: false as const, message: "Database is not reachable right now." };
  }
}

export async function createCheckInSession(input: {
  subscriberId: string;
  seniorId: string;
  scheduledFor?: Date;
  requireSmsSuccess?: boolean;
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

    if (
      !shouldSendCheckInMessaging({
        subscriptionStatus: senior.subscriber.subscriptionStatus,
        created: senior.subscriber.created,
      })
    ) {
      return {
        ok: false as const,
        message:
          "Check-ins are currently paused for this account. Upgrade or renew to resume check-in messaging.",
      };
    }

    const now = new Date();
    const scheduledForInput = input.scheduledFor ?? now;
    const scheduledFor = scheduledForInput > now ? scheduledForInput : now;
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

    const { enqueueJsonJobAt } = await import("@/lib/qstash");
    const shouldSendNow = scheduledFor.getTime() - now.getTime() <= 30_000;
    if (shouldSendNow) {
      const sent = await markInitialSent(checkIn.id);
      if (!sent.ok && input.requireSmsSuccess) {
        return { ok: false as const, message: sent.message };
      }
    } else {
      const scheduled = await enqueueJsonJobAt(
        "/api/jobs/checkin",
        { checkInId: checkIn.id },
        scheduledFor,
      );
      if (!scheduled.ok) {
        const sent = await markInitialSent(checkIn.id);
        if (!sent.ok && input.requireSmsSuccess) {
          return { ok: false as const, message: sent.message };
        }
      }
    }

    await Promise.all([
      enqueueJsonJobAt("/api/jobs/reminder", { checkInId: checkIn.id }, reminderAt),
      enqueueJsonJobAt("/api/jobs/escalation", { checkInId: checkIn.id }, escalationAt),
    ]);

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
      include: {
        senior: true,
        subscriber: {
          select: { id: true, subscriptionStatus: true, created: true },
        },
      },
    });

    if (!checkIn || checkIn.status === "CONFIRMED") {
      return { ok: false as const, message: "No reminder needed." };
    }

    if (
      !checkIn.subscriber ||
      !shouldSendCheckInMessaging({
        subscriptionStatus: checkIn.subscriber.subscriptionStatus,
        created: checkIn.subscriber.created,
      })
    ) {
      return {
        ok: false as const,
        message: "Check-in messaging is disabled for this subscriber status.",
      };
    }

    const checkInUrl = await getShortLinkForCheckIn({ checkInId: checkIn.id, token: checkIn.token });
    const sms = await sendSms(
      checkIn.senior.phoneNumber,
      `Warm-Hello reminder for ${checkIn.senior.firstName}.\nTap I’m OK: ${checkInUrl}`,
      {
        subscriberId: checkIn.subscriberId,
        seniorId: checkIn.seniorId,
        checkInId: checkIn.id,
        kind: "reminder_sms",
      },
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
        subscriber: {
          select: { id: true, subscriptionStatus: true, created: true },
        },
      },
    });

    if (!checkIn || checkIn.status === "CONFIRMED") {
      return { ok: false as const, message: "No escalation needed." };
    }

    if (
      !checkIn.subscriber ||
      !shouldSendCheckInMessaging({
        subscriptionStatus: checkIn.subscriber.subscriptionStatus,
        created: checkIn.subscriber.created,
      })
    ) {
      return {
        ok: false as const,
        message: "Check-in messaging is disabled for this subscriber status.",
      };
    }

    const contacts = await prisma.contact.findMany({
      where: { seniorId: checkIn.seniorId },
      orderBy: { priority: "asc" },
    });

    const results = await Promise.all(
      contacts.map((contact) =>
        sendSms(
          contact.phoneNumber,
          `Warm-Hello alert: ${checkIn.senior.firstName} has not responded to today's check-in.`,
          {
            subscriberId: checkIn.subscriberId,
            seniorId: checkIn.seniorId,
            checkInId: checkIn.id,
            kind: "escalation_sms",
          },
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
