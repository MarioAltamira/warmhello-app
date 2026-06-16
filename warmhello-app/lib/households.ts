import { createCheckInSession } from "@/lib/checkins";
import { prisma } from "@/lib/prisma";

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
    secondAttemptHours: number;
  };
  primaryContact: {
    fullName: string;
    relationship: string;
    phoneNumber: string;
  };
};

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

    const firstScheduledFor = new Date();
    firstScheduledFor.setMinutes(0, 0, 0);
    firstScheduledFor.setHours(input.senior.checkInHour);
    if (firstScheduledFor <= new Date()) {
      firstScheduledFor.setDate(firstScheduledFor.getDate() + 1);
    }

    const firstCheckIn = await createCheckInSession({
      subscriberId: result.subscriber.id,
      seniorId: result.senior.id,
      scheduledFor: firstScheduledFor,
    });

    const { enqueueJsonJob } = await import("@/lib/qstash");
    await enqueueJsonJob("/api/jobs/trial-nudge", { subscriberId: result.subscriber.id }, 72);
    await enqueueJsonJob("/api/jobs/trial-final", { subscriberId: result.subscriber.id }, 168);

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
