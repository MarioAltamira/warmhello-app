import { createCheckInSession } from "@/lib/checkins";
import { getNextOccurrenceAtHourInTimeZone } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { getSubscriberPlanSummary } from "@/lib/subscriber-plan";
import { normalizeTimeZone } from "@/lib/timezones";
import { sendTrialWelcomeEmail } from "@/lib/trial-emails";

export type CreateHouseholdInput = {
  subscriber: {
    fullName: string;
    email: string;
    phoneNumber: string;
  };
  senior: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    timezone: string;
    checkInHour: number;
    checkInMinute: number;
    secondAttemptHours: number;
  };
  primaryContact: {
    fullName: string;
    relationship: string;
    phoneNumber: string;
  };
};

export async function getHouseholdForSubscriber(subscriberId: string) {
  if (!prisma) {
    return null;
  }

  try {
    const subscriber = await prisma.subscriber.findUnique({
      where: { id: subscriberId },
      include: {
        seniors: {
          orderBy: { createdAt: "asc" },
          take: 1,
        },
        contacts: {
          orderBy: { priority: "asc" },
          take: 1,
        },
      },
    });

    if (!subscriber || subscriber.seniors.length === 0 || subscriber.contacts.length === 0) {
      return null;
    }

    const senior = subscriber.seniors[0];
    const contact = subscriber.contacts[0];
    const plan = getSubscriberPlanSummary({
      created: subscriber.created,
      subscriptionStatus: subscriber.subscriptionStatus,
    });

    return {
      subscriber: {
        id: subscriber.id,
        fullName: subscriber.fullName,
        email: subscriber.email,
        phoneNumber: subscriber.phoneNumber,
      },
      senior: {
        id: senior.id,
        firstName: senior.firstName,
        lastName: senior.lastName,
        phoneNumber: senior.phoneNumber,
        timezone: senior.timezone,
        checkInHour: senior.checkInHour,
        checkInMinute: senior.checkInMinute,
        secondAttemptHours: senior.secondAttemptHours,
      },
      contact: {
        id: contact.id,
        fullName: contact.fullName,
        relationship: contact.relationship,
        phoneNumber: contact.phoneNumber,
      },
      plan,
    };
  } catch {
    return null;
  }
}

export async function createHousehold(input: CreateHouseholdInput) {
  if (!prisma) {
    return { ok: false as const, message: "Database is not configured yet." };
  }

  try {
    const existingSubscriber = await prisma.subscriber.findUnique({
      where: { email: input.subscriber.email },
    });

    if (existingSubscriber) {
      return {
        ok: false as const,
        message: "A subscriber with that email already exists.",
      };
    }

    const result = await prisma.$transaction(async (tx) => {
      const subscriber = await tx.subscriber.create({
        data: {
          email: input.subscriber.email,
          fullName: input.subscriber.fullName,
          phoneNumber: input.subscriber.phoneNumber,
          subscriptionStatus: "TRIAL",
          created: new Date(),
        },
      });

      const senior = await tx.senior.create({
        data: {
          subscriberId: subscriber.id,
          firstName: input.senior.firstName,
          lastName: input.senior.lastName,
          phoneNumber: input.senior.phoneNumber,
          timezone: input.senior.timezone,
          checkInHour: input.senior.checkInHour,
          checkInMinute: input.senior.checkInMinute,
          secondAttemptHours: input.senior.secondAttemptHours,
        },
      });

      const contact = await tx.contact.create({
        data: {
          subscriberId: subscriber.id,
          seniorId: senior.id,
          fullName: input.primaryContact.fullName,
          relationship: input.primaryContact.relationship,
          phoneNumber: input.primaryContact.phoneNumber,
          priority: 1,
        },
      });

      return { subscriber, senior, contact };
    });

    const timeZone = normalizeTimeZone(input.senior.timezone);
    const firstScheduledFor = getNextOccurrenceAtHourInTimeZone({
      timeZone,
      hour: input.senior.checkInHour,
      minute: input.senior.checkInMinute,
    });

    const firstCheckIn = await createCheckInSession({
      subscriberId: result.subscriber.id,
      seniorId: result.senior.id,
      scheduledFor: firstScheduledFor,
    });

    const { enqueueJsonJob } = await import("@/lib/qstash");
    await Promise.allSettled([
      sendTrialWelcomeEmail(result.subscriber.id),
      enqueueJsonJob("/api/jobs/trial-nudge", { subscriberId: result.subscriber.id }, 72),
      enqueueJsonJob("/api/jobs/trial-final", { subscriberId: result.subscriber.id }, 168),
      enqueueJsonJob("/api/jobs/trial-expire", { subscriberId: result.subscriber.id }, 192),
    ]);

    return {
      ok: true as const,
      household: result,
      firstCheckIn: firstCheckIn.ok
        ? {
            token: firstCheckIn.checkIn.token,
            scheduledFor: firstCheckIn.checkIn.scheduledFor,
          }
        : undefined,
      firstCheckInMessage: firstCheckIn.ok
        ? "Initial check-in scheduled."
        : firstCheckIn.message,
    };
  } catch {
    return { ok: false as const, message: "Database is not reachable right now." };
  }
}

export async function updateHousehold(subscriberId: string, input: CreateHouseholdInput) {
  if (!prisma) {
    return { ok: false as const, message: "Database is not configured yet." };
  }

  try {
    const existingSubscriber = await prisma.subscriber.findUnique({
      where: { id: subscriberId },
      include: {
        seniors: {
          orderBy: { createdAt: "asc" },
          take: 1,
        },
        contacts: {
          orderBy: { priority: "asc" },
          take: 1,
        },
      },
    });

    if (!existingSubscriber) {
      return { ok: false as const, message: "Subscriber record was not found." };
    }

    const emailOwner = await prisma.subscriber.findUnique({
      where: { email: input.subscriber.email },
    });

    if (emailOwner && emailOwner.id !== subscriberId) {
      return {
        ok: false as const,
        message: "That email is already attached to another subscriber.",
      };
    }

    const result = await prisma.$transaction(async (tx) => {
      const subscriber = await tx.subscriber.update({
        where: { id: subscriberId },
        data: {
          email: input.subscriber.email,
          fullName: input.subscriber.fullName,
          phoneNumber: input.subscriber.phoneNumber,
        },
      });

      const senior = existingSubscriber.seniors[0]
        ? await tx.senior.update({
            where: { id: existingSubscriber.seniors[0].id },
            data: {
              firstName: input.senior.firstName,
              lastName: input.senior.lastName,
              phoneNumber: input.senior.phoneNumber,
              timezone: input.senior.timezone,
              checkInHour: input.senior.checkInHour,
              checkInMinute: input.senior.checkInMinute,
              secondAttemptHours: input.senior.secondAttemptHours,
            },
          })
        : await tx.senior.create({
            data: {
              subscriberId,
              firstName: input.senior.firstName,
              lastName: input.senior.lastName,
              phoneNumber: input.senior.phoneNumber,
              timezone: input.senior.timezone,
              checkInHour: input.senior.checkInHour,
              checkInMinute: input.senior.checkInMinute,
              secondAttemptHours: input.senior.secondAttemptHours,
            },
          });

      const contact = existingSubscriber.contacts[0]
        ? await tx.contact.update({
            where: { id: existingSubscriber.contacts[0].id },
            data: {
              fullName: input.primaryContact.fullName,
              relationship: input.primaryContact.relationship,
              phoneNumber: input.primaryContact.phoneNumber,
              seniorId: senior.id,
            },
          })
        : await tx.contact.create({
            data: {
              subscriberId,
              seniorId: senior.id,
              fullName: input.primaryContact.fullName,
              relationship: input.primaryContact.relationship,
              phoneNumber: input.primaryContact.phoneNumber,
              priority: 1,
            },
          });

      return { subscriber, senior, contact };
    });

    return {
      ok: true as const,
      household: result,
      message: "Household updated successfully.",
    };
  } catch {
    return { ok: false as const, message: "Database is not reachable right now." };
  }
}
