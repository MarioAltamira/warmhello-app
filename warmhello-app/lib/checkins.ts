import { addHours, formatDateTime } from "@/lib/dates";
import { demoCheckIn, demoDashboard } from "@/lib/demo-data";
import { getIntegrationStatus } from "@/lib/env";
import { isBillingCurrency, expectedMonthlyLabelFor, pricingPlanFor } from "@/lib/pricing";
import { prisma } from "@/lib/prisma";
import { getShortLinkForCheckIn } from "@/lib/short-links";
import { getPriceInfo } from "@/lib/stripe";
import { getStripePriceIdFor, resolveCurrencyForCurrentVisitor } from "@/lib/visitor-currency";
import { getSubscriberPlanSummary } from "@/lib/subscriber-plan";
import { shouldSendCheckInMessaging } from "@/lib/subscriber-lifecycle";
import { normalizeTimeZone } from "@/lib/timezones";
import { createCheckInToken } from "@/lib/tokens";

const CHECKIN_SMS_PROMO_REGEX =
  /% ?off|refer|share|discount|promo|free ?month|coupon/i;

type AssertNoPromo<S extends string> = Lowercase<S> extends `${string}${"%25off" | "% off" | "refer" | "share" | "discount" | "promo" | "free month" | "coupon"}${string}`
  ? never
  : S;

function formatEnumLabel(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildDashboardSnapshot(
  subscriber: {
    id: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    stripeCustomerId: string | null;
    subscriptionStatus: "TRIAL" | "ACTIVE" | "PAST_DUE" | "CANCELED";
    billingCurrency: "USD" | "CAD";
    currentPeriodEndsAt: Date | null;
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
  },
  options?: {
    stripePrice?: {
      displayLabel: string | null;
      expectedLabel: string;
      aligned: boolean;
      priceId: string;
    } | null;
  },
) {
  const senior = subscriber.seniors[0];
  const timeZone = normalizeTimeZone(senior.timezone);
  const latestCheckIn = subscriber.checkIns[0];
  const plan = getSubscriberPlanSummary({
    created: subscriber.created,
    subscriptionStatus: subscriber.subscriptionStatus,
    currentPeriodEndsAt: subscriber.currentPeriodEndsAt,
  });
  const billingCurrency = isBillingCurrency(subscriber.billingCurrency) ? subscriber.billingCurrency : "USD";
  const planCopy = pricingPlanFor(billingCurrency);

  return {
    subscriberId: subscriber.id,
    subscriberName: subscriber.fullName,
    subscriberEmail: subscriber.email,
    subscriberPhone: subscriber.phoneNumber,
    subscriptionStatus: plan.statusLabel,
    billingCurrency,
    billingPlanLabel: planCopy.monthlyLabel,
    isPaidSubscriber: plan.isPaidSubscriber,
    isTrialExpired: plan.isTrialExpired,
    showBuyNow: plan.showBuyNow,
    buyNowIntent: plan.buyNowIntent,
    periodEndsAt: plan.periodEndsAt.toISOString(),
    timeRemainingLabel: plan.timeRemainingLabel,
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
    escalationPolicy:
      senior.secondAttemptHours === 1
        ? "Friendly follow-up after 1 hour, then contact your trusted emergency contacts one hour after that if your loved one still hasn't confirmed they're okay."
        : `Friendly follow-up after ${senior.secondAttemptHours} hours, then contact your trusted emergency contacts after another ${senior.secondAttemptHours} hours if your loved one still hasn't confirmed they're okay.`,
    integrationStatus: getIntegrationStatus(),
    stripePrice: options?.stripePrice ?? null,
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

    const visitorCurrency = await resolveCurrencyForCurrentVisitor({ subscriberId: subscriber.id });
    const billingCurrency = isBillingCurrency(subscriber.billingCurrency)
      ? subscriber.billingCurrency
      : visitorCurrency.currency;
    const expectedLabel = expectedMonthlyLabelFor(billingCurrency);
    const priceCopy = pricingPlanFor(billingCurrency);
    const priceId = getStripePriceIdFor(billingCurrency);
    const priceInfo = await getPriceInfo(priceId ?? undefined);
    const stripePrice = priceInfo.ok && priceInfo.price
      ? {
          displayLabel: priceInfo.displayLabel,
          expectedLabel,
          aligned:
            priceInfo.price.interval === "month" &&
            priceInfo.price.currency === billingCurrency &&
            Math.abs(priceInfo.price.amount - priceCopy.monthlyAmount) <= 0.01,
          priceId: priceInfo.price.id,
        }
      : null;

    return buildDashboardSnapshot({ ...subscriber, billingCurrency }, { stripePrice });
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

export async function confirmCheckInToken(token: string, mode: "okay" | "call_me" = "okay") {
  if (!prisma) {
    if (token === demoCheckIn.token) {
      return { ok: true as const, message: mode === "call_me" ? "Demo check-in confirmed. Call request noted." : "Demo check-in confirmed." };
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
      const confirmationMessageKind = mode === "call_me" ? "confirmation_sms_call_request" : "confirmation_sms";
      const message =
        mode === "call_me"
          ? `${existing.senior.firstName} has asked for a call from you. This will complete today's Warm-Hello check-in 🟡`
          : `${existing.senior.firstName} is okay and has completed today's Warm-Hello check-in. 🟢`;
      const notifications = await Promise.all(
        contacts.map((contact) =>
          sendSms(contact.phoneNumber, message, {
            subscriberId: existing.subscriberId,
            seniorId: existing.seniorId,
            checkInId: existing.id,
            kind: confirmationMessageKind,
          }),
        ),
      );

      if (contacts.length > 0) {
        await prisma.alertJob.createMany({
          data: contacts.map((contact, index) => ({
            checkInId: existing.id,
            kind: confirmationMessageKind,
            status: notifications[index]?.ok ? "SENT" : "FAILED",
            providerMessageId: notifications[index]?.ok ? notifications[index].sid : null,
            payload: { contactId: contact.id, phoneNumber: contact.phoneNumber, mode },
            runAt: new Date(),
          })),
        });
      }
    } catch {
      // Confirmation itself should still succeed even if notifications are not configured yet.
    }

    return {
      ok: true as const,
      message:
        mode === "call_me"
          ? "Check-in confirmed. We'll let your contacts know you'd like a call."
          : "Check-in confirmed successfully.",
    };
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
          select: { id: true, subscriptionStatus: true, created: true, currentPeriodEndsAt: true },
        },
      },
    });

    if (!checkIn || checkIn.status === "EXPIRED") {
      return { ok: false as const, message: "No check-in needed." };
    }

    if (checkIn.firstSmsSentAt) {
      return {
        ok: false as const,
        message: `Initial check-in SMS already sent at ${checkIn.firstSmsSentAt.toISOString()}.`,
      };
    }

    if (
      !checkIn.subscriber ||
      !shouldSendCheckInMessaging({
        subscriptionStatus: checkIn.subscriber.subscriptionStatus,
        created: checkIn.subscriber.created,
        currentPeriodEndsAt: checkIn.subscriber.currentPeriodEndsAt,
      })
    ) {
      return {
        ok: false as const,
        message: "Check-in messaging is disabled for this subscriber status.",
      };
    }

    const checkInUrl = await getShortLinkForCheckIn({ checkInId: checkIn.id, token: checkIn.token });

    if (checkIn.senior.smsOptedOut) {
      return {
        ok: false as const,
        message:
          "Senior has opted out of SMS via STOP keyword. Check-in will remain pending but no SMS will be sent.",
      };
    }

    // COMPLIANCE GUARD (CASL/TCPA): Operational check-in SMS MUST remain
    // transactional and NEVER contain promotional copy. Any of the following
    // keywords (% off | refer | share | discount | promo | free month | coupon)
    // will convert this message from transactional-exempt into CEM/CEM and
    // expose the operator to statutory fines up to $1,500/SMS (TCPA) or
    // $10M/company (CASL). CI grep regex: CHECKIN_SMS_PROMO_REGEX above.
    // Do not edit this template without compliance review.
    const checkInBodyTemplate = `Hi ${checkIn.senior.firstName} - it's time for your Warm-Hello check-in.\nTap I'm OK: ${checkInUrl}` as const;
    const checkInBody = checkInBodyTemplate as AssertNoPromo<typeof checkInBodyTemplate>;
    if (CHECKIN_SMS_PROMO_REGEX.test(checkInBody as unknown as string)) {
      return {
        ok: false as const,
        message:
          "Check-in SMS template contains promotional keywords. Transactional check-in SMS must never include referral/discount/promo language. Refusing to send (CASL/TCPA compliance guard).",
      };
    }

    const sms = await sendSms(
      checkIn.senior.phoneNumber,
      checkInBody,
      {
        subscriberId: checkIn.subscriberId,
        seniorId: checkIn.seniorId,
        checkInId: checkIn.id,
        kind: "initial_sms",
      },
    );

    const now = new Date();
    await prisma.$transaction([
      prisma.checkIn.update({
        where: { id: checkInId },
        data: {
          firstSmsSentAt: sms.ok ? now : checkIn.firstSmsSentAt,
        },
      }),
      prisma.alertJob.create({
        data: {
          checkInId,
          kind: "initial_sms",
          status: sms.ok ? "SENT" : "FAILED",
          providerMessageId: sms.ok ? sms.sid : null,
          payload: { phoneNumber: checkIn.senior.phoneNumber },
          runAt: now,
        },
      }),
    ]);

    if (!sms.ok) {
      return { ok: false as const, message: sms.message };
    }

    return { ok: true as const, message: "Check-in sent." };
  } catch {
    return { ok: false as const, message: "Database is not reachable right now." };
  }
}

export type CreateCheckInSessionResultEnqueue = {
  firstJobMessageId: string | null;
  reminderJobMessageId: string | null;
  escalationJobMessageId: string | null;
  firstSmsDeliveredImmediately: boolean;
  enqueueErrors: string[];
  enqueueOk: number;
  enqueueFailed: number;
};

export async function createCheckInSession(input: {
  subscriberId: string;
  seniorId: string;
  scheduledFor?: Date;
  requireSmsSuccess?: boolean;
  skipRemindersAndEscalation?: boolean;
}): Promise<
  | {
      ok: true;
      checkIn: { id: string; token: string; scheduledFor: Date; reminderAt: Date; escalationAt: Date };
      enqueue: CreateCheckInSessionResultEnqueue;
    }
  | { ok: false; message: string }
> {
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
        currentPeriodEndsAt: senior.subscriber.currentPeriodEndsAt,
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
      select: {
        id: true,
        token: true,
        scheduledFor: true,
        reminderAt: true,
        escalationAt: true,
      },
    });

    const { enqueueJsonJobAt } = await import("@/lib/qstash");
    const shouldSendNow = scheduledFor.getTime() - now.getTime() <= 30_000;
    const skipFollowups = Boolean(input.skipRemindersAndEscalation);
    let firstJobMessageId: string | null = null;
    let reminderJobMessageId: string | null = null;
    let escalationJobMessageId: string | null = null;
    const enqueueErrors: string[] = [];
    let enqueueOk = 0;
    let enqueueFailed = 0;
    let firstSmsDeliveredImmediately = false;

    if (shouldSendNow) {
      const sent = await markInitialSent(checkIn.id);
      firstSmsDeliveredImmediately = sent.ok;
      if (!sent.ok) {
        enqueueErrors.push(`firstImmediate: ${sent.message}`);
        enqueueFailed += 1;
        if (input.requireSmsSuccess) {
          return { ok: false as const, message: sent.message };
        }
      } else {
        enqueueOk += 1;
      }
    } else {
      const scheduled = await enqueueJsonJobAt(
        "/api/jobs/checkin",
        { checkInId: checkIn.id },
        scheduledFor,
      );
      if (!scheduled.ok) {
        enqueueErrors.push(`first: ${scheduled.message}`);
        enqueueFailed += 1;
      } else {
        firstJobMessageId = scheduled.messageId ?? null;
        enqueueOk += 1;
      }
    }

    if (!skipFollowups) {
      const [reminderJob, escalationJob] = await Promise.all([
        enqueueJsonJobAt("/api/jobs/reminder", { checkInId: checkIn.id }, reminderAt),
        enqueueJsonJobAt("/api/jobs/escalation", { checkInId: checkIn.id }, escalationAt),
      ]);

      if (reminderJob.ok) {
        reminderJobMessageId = reminderJob.messageId ?? null;
        enqueueOk += 1;
      } else {
        enqueueErrors.push(`reminder: ${reminderJob.message}`);
        enqueueFailed += 1;
      }
      if (escalationJob.ok) {
        escalationJobMessageId = escalationJob.messageId ?? null;
        enqueueOk += 1;
      } else {
        enqueueErrors.push(`escalation: ${escalationJob.message}`);
        enqueueFailed += 1;
      }
    }

    if (firstJobMessageId || reminderJobMessageId || escalationJobMessageId) {
      await prisma.checkIn.update({
        where: { id: checkIn.id },
        data: {
          firstJobMessageId,
          reminderJobMessageId,
          escalationJobMessageId,
        },
      });
    }

    return {
      ok: true as const,
      checkIn,
      enqueue: {
        firstJobMessageId,
        reminderJobMessageId,
        escalationJobMessageId,
        firstSmsDeliveredImmediately,
        enqueueErrors,
        enqueueOk,
        enqueueFailed,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Database is not reachable right now.";
    return { ok: false as const, message };
  }
}

export async function markReminderSent(checkInId: string) {
  if (!prisma) {
    return { ok: false as const, message: "Database is not configured yet." };
  }

  try {
    const { sendSms } = await import("@/lib/sms");
    const now = new Date();
    const checkIn = await prisma.checkIn.findUnique({
      where: { id: checkInId },
      include: {
        senior: true,
        subscriber: {
          select: { id: true, subscriptionStatus: true, created: true, currentPeriodEndsAt: true },
        },
      },
    });

    if (!checkIn || checkIn.status === "EXPIRED") {
      return { ok: false as const, message: "No reminder needed." };
    }

    if (checkIn.secondSmsSentAt) {
      return {
        ok: false as const,
        message: `Reminder SMS already sent at ${checkIn.secondSmsSentAt.toISOString()}.`,
      };
    }

    if (checkIn.confirmedAt != null && checkIn.secondSmsSentAt == null) {
      // Senior already tapped "I'm OK" (before reminder even fires). Skip reminder.
      return { ok: false as const, message: "Check-in already confirmed; reminder not needed." };
    }

    if (
      !checkIn.subscriber ||
      !shouldSendCheckInMessaging({
        subscriptionStatus: checkIn.subscriber.subscriptionStatus,
        created: checkIn.subscriber.created,
        currentPeriodEndsAt: checkIn.subscriber.currentPeriodEndsAt,
      })
    ) {
      return {
        ok: false as const,
        message: "Check-in messaging is disabled for this subscriber status.",
      };
    }

    const checkInUrl = await getShortLinkForCheckIn({ checkInId: checkIn.id, token: checkIn.token });
    if (checkIn.senior.smsOptedOut) {
      return {
        ok: false as const,
        message: "Senior has opted out of SMS via STOP keyword. Skipping reminder SMS.",
      };
    }
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

    await prisma.$transaction([
      prisma.checkIn.update({
        where: { id: checkInId },
        data: {
          status: "REMINDER_SENT",
          firstAlertUnresponsiveAt: { set: now },
          secondSmsSentAt: sms.ok ? now : checkIn.secondSmsSentAt,
        },
      }),
      prisma.alertJob.create({
        data: {
          checkInId,
          kind: "reminder_sms",
          status: sms.ok ? "SENT" : "FAILED",
          providerMessageId: sms.ok ? sms.sid : null,
          payload: { phoneNumber: checkIn.senior.phoneNumber },
          runAt: now,
        },
      }),
    ]);

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
    const now = new Date();
    const checkIn = await prisma.checkIn.findUnique({
      where: { id: checkInId },
      include: {
        senior: true,
        subscriber: {
          select: { id: true, subscriptionStatus: true, created: true, currentPeriodEndsAt: true },
        },
      },
    });

    if (!checkIn || checkIn.status === "EXPIRED") {
      return { ok: false as const, message: "No escalation needed." };
    }

    if (checkIn.primaryContactSmsSentAt) {
      return {
        ok: false as const,
        message: `Escalation already sent at ${checkIn.primaryContactSmsSentAt.toISOString()}.`,
      };
    }

    if (checkIn.confirmedAt != null) {
      // Senior already tapped "I'm OK" — skip escalation to contacts.
      return {
        ok: false as const,
        message: "Check-in already confirmed; escalation skipped.",
      };
    }

    if (
      !checkIn.subscriber ||
      !shouldSendCheckInMessaging({
        subscriptionStatus: checkIn.subscriber.subscriptionStatus,
        created: checkIn.subscriber.created,
        currentPeriodEndsAt: checkIn.subscriber.currentPeriodEndsAt,
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

    if (checkIn.senior.smsOptedOut) {
      return {
        ok: false as const,
        message: "Senior has opted out of SMS via STOP keyword. Skipping escalation (contacts will not be notified).",
      };
    }

    const results = await Promise.all(
      contacts.map((contact) =>
        sendSms(
          contact.phoneNumber,
          `Warm-Hello alert: ${checkIn.senior.firstName} has not responded to today's check-in. 🔴`,
          {
            subscriberId: checkIn.subscriberId,
            seniorId: checkIn.seniorId,
            checkInId: checkIn.id,
            kind: "escalation_sms",
          },
        ),
      ),
    );

    const anyEscalationSmsSent = results.some((r) => r?.ok);
    await prisma.$transaction([
      prisma.checkIn.update({
        where: { id: checkInId },
        data: {
          status: "ESCALATED",
          secondAlertUnresponsiveAt: { set: now },
          primaryContactSmsSentAt: anyEscalationSmsSent ? now : checkIn.primaryContactSmsSentAt,
        },
      }),
      prisma.alertJob.createMany({
        data: contacts.map((contact, index) => ({
          checkInId,
          kind: "escalation_sms",
          status: results[index]?.ok ? "SENT" : "FAILED",
          providerMessageId: results[index]?.ok ? results[index].sid : null,
          payload: { contactId: contact.id, phoneNumber: contact.phoneNumber },
          runAt: now,
        })),
      }),
    ]);

    return { ok: true as const, message: "Escalation processed." };
  } catch {
    return { ok: false as const, message: "Database is not reachable right now." };
  }
}
