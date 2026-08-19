import { createCheckInSession } from "@/lib/checkins";
import { getNextOccurrenceAtHourInTimeZone } from "@/lib/dates";
import { normalizePhone } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import { BillingCurrency, isBillingCurrency } from "@/lib/pricing";
import { getSubscriberPlanSummary } from "@/lib/subscriber-plan";
import { normalizeTimeZone } from "@/lib/timezones";
import { sendTrialWelcomeEmail } from "@/lib/trial-emails";

export type ContactInput = {
  fullName: string;
  relationship: string;
  phoneNumber: string;
};

export const MAX_CONTACTS = 4;

function normalizePhoneInput(input: CreateHouseholdInput): CreateHouseholdInput {
  const additional = (input.additionalContacts ?? []).map((c) => ({
    ...c,
    phoneNumber: normalizePhone(c.phoneNumber),
  }));
  return {
    ...input,
    subscriber: {
      ...input.subscriber,
      phoneNumber: normalizePhone(input.subscriber.phoneNumber),
    },
    senior: {
      ...input.senior,
      phoneNumber: normalizePhone(input.senior.phoneNumber),
    },
    primaryContact: {
      ...input.primaryContact,
      phoneNumber: normalizePhone(input.primaryContact.phoneNumber),
    },
    additionalContacts: additional,
  };
}

export type CreateHouseholdInput = {
  subscriber: {
    fullName: string;
    email: string;
    phoneNumber: string;
    billingCurrency: BillingCurrency;
  };
  senior: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    timezone: string;
    checkInHour: number;
    checkInMinute: number;
    secondAttemptHours: number;
    active: boolean;
  };
  primaryContact: ContactInput;
  additionalContacts?: ContactInput[];
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
          take: MAX_CONTACTS,
        },
      },
    });

    if (!subscriber || subscriber.seniors.length === 0 || subscriber.contacts.length === 0) {
      return null;
    }

    const senior = subscriber.seniors[0];
    const allContacts = subscriber.contacts;
    const [primaryContact, ...restContacts] = allContacts;
    const plan = getSubscriberPlanSummary({
      created: subscriber.created,
      subscriptionStatus: subscriber.subscriptionStatus,
      currentPeriodEndsAt: subscriber.currentPeriodEndsAt,
    });

    return {
      subscriber: {
        id: subscriber.id,
        fullName: subscriber.fullName,
        email: subscriber.email,
        phoneNumber: subscriber.phoneNumber,
        billingCurrency: subscriber.billingCurrency,
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
        active: senior.active,
      },
      contact: {
        id: primaryContact.id,
        fullName: primaryContact.fullName,
        relationship: primaryContact.relationship,
        phoneNumber: primaryContact.phoneNumber,
      },
      additionalContacts: restContacts.map((c) => ({
        id: c.id,
        fullName: c.fullName,
        relationship: c.relationship,
        phoneNumber: c.phoneNumber,
      })),
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
    const normalized = normalizePhoneInput(input);
    const additionalInput = (normalized.additionalContacts ?? []).filter(
      (c) =>
        c &&
        String(c.fullName ?? "").trim().length >= 2 &&
        String(c.phoneNumber ?? "").trim().length >= 7,
    );
    const validatedAdditional = additionalInput.slice(0, Math.max(0, MAX_CONTACTS - 1));

    const existingSubscriber = await prisma.subscriber.findUnique({
      where: { email: normalized.subscriber.email },
    });

    if (existingSubscriber) {
      return {
        ok: false as const,
        message: "A subscriber with that email already exists.",
      };
    }

    const result = await prisma.$transaction(async (tx) => {
      const now = new Date();
      const trialEndsAt = new Date(now);
      trialEndsAt.setDate(trialEndsAt.getDate() + 7);

      const billingCurrency: BillingCurrency = isBillingCurrency(normalized.subscriber.billingCurrency)
        ? normalized.subscriber.billingCurrency
        : "USD";

      const subscriber = await tx.subscriber.create({
        data: {
          email: normalized.subscriber.email,
          fullName: normalized.subscriber.fullName,
          phoneNumber: normalized.subscriber.phoneNumber,
          subscriptionStatus: "TRIAL",
          billingCurrency,
          currentPeriodEndsAt: trialEndsAt,
          created: now,
          unsubscribedAt: null,
        },
      });

      const senior = await tx.senior.create({
        data: {
          subscriberId: subscriber.id,
          firstName: normalized.senior.firstName,
          lastName: normalized.senior.lastName,
          phoneNumber: normalized.senior.phoneNumber,
          timezone: normalized.senior.timezone,
          checkInHour: normalized.senior.checkInHour,
          checkInMinute: normalized.senior.checkInMinute,
          secondAttemptHours: normalized.senior.secondAttemptHours,
          active: normalized.senior.active,
        },
      });

      const contact = await tx.contact.create({
        data: {
          subscriberId: subscriber.id,
          seniorId: senior.id,
          fullName: normalized.primaryContact.fullName,
          relationship: normalized.primaryContact.relationship,
          phoneNumber: normalized.primaryContact.phoneNumber,
          priority: 1,
        },
      });

      const additionalContacts = await Promise.all(
        validatedAdditional.map((c, index) =>
          tx.contact.create({
            data: {
              subscriberId: subscriber.id,
              seniorId: senior.id,
              fullName: c.fullName,
              relationship: c.relationship,
              phoneNumber: c.phoneNumber,
              priority: index + 2,
            },
          }),
        ),
      );

      return { subscriber, senior, contact, additionalContacts };
    });

    const timeZone = normalizeTimeZone(normalized.senior.timezone);
    const firstScheduledFor = getNextOccurrenceAtHourInTimeZone({
      timeZone,
      hour: normalized.senior.checkInHour,
      minute: normalized.senior.checkInMinute,
    });

    const firstCheckIn = await createCheckInSession({
      subscriberId: result.subscriber.id,
      seniorId: result.senior.id,
      scheduledFor: firstScheduledFor,
    });

    const { enqueueJsonJob } = await import("@/lib/qstash");
    const sideEffectLabel = (index: number) =>
      [
        "sendTrialWelcomeEmail",
        "enqueue trial-nudge",
        "enqueue trial-final",
        "enqueue trial-expire",
      ][index] ?? `sideEffect[${index}]`;
    const sideEffects = await Promise.allSettled([
      sendTrialWelcomeEmail(result.subscriber.id),
      enqueueJsonJob("/api/jobs/trial-nudge", { subscriberId: result.subscriber.id }, 72),
      enqueueJsonJob("/api/jobs/trial-final", { subscriberId: result.subscriber.id }, 167),
      enqueueJsonJob("/api/jobs/trial-expire", { subscriberId: result.subscriber.id }, 167),
    ]);
    sideEffects.forEach((outcome, index) => {
      const label = sideEffectLabel(index);
      if (outcome.status === "rejected") {
        console.error(
          `[createHousehold][sideEffect:${label}] rejected for subscriber ${result.subscriber.id}:`,
          outcome.reason,
        );
        return;
      }
      const value = outcome.value as
        | { ok?: boolean; message?: string; id?: string | null }
        | null
        | undefined;
      if (value && typeof value === "object" && value.ok === false) {
        console.warn(
          `[createHousehold][sideEffect:${label}] skipped for subscriber ${result.subscriber.id}: ${
            value.message ?? "no message provided"
          }`,
        );
        return;
      }
      console.info(
        `[createHousehold][sideEffect:${label}] succeeded for subscriber ${result.subscriber.id}${
          value && typeof value === "object" && value.id ? ` (providerId=${value.id})` : ""
        }`,
      );
    });

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
    const normalized = normalizePhoneInput(input);
    const additionalInput = (normalized.additionalContacts ?? []).filter(
      (c) =>
        c &&
        String(c.fullName ?? "").trim().length >= 2 &&
        String(c.phoneNumber ?? "").trim().length >= 7,
    );
    const validatedAdditional = additionalInput.slice(0, Math.max(0, MAX_CONTACTS - 1));

    const existingSubscriber = await prisma.subscriber.findUnique({
      where: { id: subscriberId },
      include: {
        seniors: {
          orderBy: { createdAt: "asc" },
          take: 1,
        },
        contacts: {
          orderBy: { priority: "asc" },
          take: MAX_CONTACTS,
        },
      },
    });

    if (!existingSubscriber) {
      return { ok: false as const, message: "Subscriber record was not found." };
    }

    const emailOwner = await prisma.subscriber.findUnique({
      where: { email: normalized.subscriber.email },
    });

    if (emailOwner && emailOwner.id !== subscriberId) {
      return {
        ok: false as const,
        message: "That email is already attached to another subscriber.",
      };
    }

    const result = await prisma.$transaction(async (tx) => {
      const billingCurrency: BillingCurrency = isBillingCurrency(normalized.subscriber.billingCurrency)
        ? normalized.subscriber.billingCurrency
        : existingSubscriber.billingCurrency;

      const subscriber = await tx.subscriber.update({
        where: { id: subscriberId },
        data: {
          email: normalized.subscriber.email,
          fullName: normalized.subscriber.fullName,
          phoneNumber: normalized.subscriber.phoneNumber,
          billingCurrency,
        },
      });

      const senior = existingSubscriber.seniors[0]
        ? await tx.senior.update({
            where: { id: existingSubscriber.seniors[0].id },
            data: {
              firstName: normalized.senior.firstName,
              lastName: normalized.senior.lastName,
              phoneNumber: normalized.senior.phoneNumber,
              timezone: normalized.senior.timezone,
              checkInHour: normalized.senior.checkInHour,
              checkInMinute: normalized.senior.checkInMinute,
              secondAttemptHours: normalized.senior.secondAttemptHours,
              active: normalized.senior.active,
            },
          })
        : await tx.senior.create({
            data: {
              subscriberId,
              firstName: normalized.senior.firstName,
              lastName: normalized.senior.lastName,
              phoneNumber: normalized.senior.phoneNumber,
              timezone: normalized.senior.timezone,
              checkInHour: normalized.senior.checkInHour,
              checkInMinute: normalized.senior.checkInMinute,
              secondAttemptHours: normalized.senior.secondAttemptHours,
              active: normalized.senior.active,
            },
          });

      const existingContacts = existingSubscriber.contacts;
      const [existingPrimary, ...existingAdditional] = existingContacts;
      const contact = existingPrimary
        ? await tx.contact.update({
            where: { id: existingPrimary.id },
            data: {
              fullName: normalized.primaryContact.fullName,
              relationship: normalized.primaryContact.relationship,
              phoneNumber: normalized.primaryContact.phoneNumber,
              seniorId: senior.id,
            },
          })
        : await tx.contact.create({
            data: {
              subscriberId,
              seniorId: senior.id,
              fullName: normalized.primaryContact.fullName,
              relationship: normalized.primaryContact.relationship,
              phoneNumber: normalized.primaryContact.phoneNumber,
              priority: 1,
            },
          });

      const additionalContacts: (typeof contact)[] = [];
      for (let i = 0; i < validatedAdditional.length; i += 1) {
        const payload = validatedAdditional[i]!;
        const existingRow = existingAdditional[i];
        if (existingRow) {
          additionalContacts.push(
            await tx.contact.update({
              where: { id: existingRow.id },
              data: {
                fullName: payload.fullName,
                relationship: payload.relationship,
                phoneNumber: payload.phoneNumber,
                priority: i + 2,
                seniorId: senior.id,
              },
            }),
          );
        } else {
          additionalContacts.push(
            await tx.contact.create({
              data: {
                subscriberId,
                seniorId: senior.id,
                fullName: payload.fullName,
                relationship: payload.relationship,
                phoneNumber: payload.phoneNumber,
                priority: i + 2,
              },
            }),
          );
        }
      }

      const remainingExisting = existingAdditional.slice(validatedAdditional.length);
      if (remainingExisting.length > 0) {
        await tx.contact.deleteMany({
          where: {
            id: { in: remainingExisting.map((c) => c.id) },
            subscriberId,
          },
        });
      }

      return { subscriber, senior, contact, additionalContacts };
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
