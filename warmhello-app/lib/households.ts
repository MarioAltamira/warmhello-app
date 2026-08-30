import { getNextOccurrenceAtHourInTimeZone } from "@/lib/dates";
import { env } from "@/lib/env";
import { normalizePhone } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import { BillingCurrency, isBillingCurrency } from "@/lib/pricing";
import { getShortLinkForCheckIn } from "@/lib/short-links";
import { sendSeniorOnboardingSmsSequence } from "@/lib/sms";
import { getSubscriberPlanSummary } from "@/lib/subscriber-plan";
import { normalizeTimeZone } from "@/lib/timezones";
import { sendTrialWelcomeEmail, sendTrialEndingSoonEmail } from "@/lib/trial-emails";
import { TOS_VERSION_CURRENT, PRIVACY_VERSION_CURRENT } from "@/lib/constants";

export type ContactInput = {
  fullName: string;
  relationship: string;
  phoneNumber: string;
  email?: string | null;
};

export const MAX_CONTACTS = 2;

export type ConsentMetadata = {
  ipAddress?: string | null;
  userAgent?: string | null;
  tosVersion?: string;
  privacyVersion?: string;
  seniorOperationalSmsConsent?: boolean;
  marketingEmailConsent?: boolean;
};

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
  caregiverAck?: boolean;
  tosVersion?: string;
  privacyVersion?: string;
  seniorOperationalSmsConsent?: boolean;
  marketingEmailConsent?: boolean;
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

export async function createHousehold(
  input: CreateHouseholdInput,
  consent: ConsentMetadata = {},
) {
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

    const tosVersion = consent.tosVersion ?? input.tosVersion ?? TOS_VERSION_CURRENT;
    const privacyVersion = consent.privacyVersion ?? input.privacyVersion ?? PRIVACY_VERSION_CURRENT;
    const seniorOperationalSmsConsent = Boolean(
      consent.seniorOperationalSmsConsent ?? input.seniorOperationalSmsConsent,
    );
    const marketingEmailConsent = Boolean(
      consent.marketingEmailConsent ?? input.marketingEmailConsent,
    );

    const result = await prisma.$transaction(async (tx) => {
      const now = new Date();
      const trialEndsAt = new Date(now);
      trialEndsAt.setDate(trialEndsAt.getDate() + 7);

      const billingCurrency: BillingCurrency = isBillingCurrency(normalized.subscriber.billingCurrency)
        ? normalized.subscriber.billingCurrency
        : "USD";
      const caregiverAck = Boolean(normalized.caregiverAck);

      const subscriber = await tx.subscriber.create({
        data: {
          email: normalized.subscriber.email,
          fullName: normalized.subscriber.fullName,
          phoneNumber: normalized.subscriber.phoneNumber,
          subscriptionStatus: "TRIAL",
          billingCurrency,
          currentPeriodEndsAt: trialEndsAt,
          trialStartedAt: now,
          created: now,
          unsubscribedAt: null,
          caregiverSeniorConsentAckAt: caregiverAck ? now : undefined,
          tosAcceptedAt: caregiverAck ? now : undefined,
          tosVersion,
          privacyPolicyVersion: privacyVersion,
          privacyAcknowledgedAt: caregiverAck ? now : undefined,
          operationalSmsConsentGrantedAt: seniorOperationalSmsConsent ? now : undefined,
          marketingEmailConsent,
          marketingEmailConsentAt: marketingEmailConsent ? now : null,
          marketingSmsConsent: false,
          marketingSmsConsentAt: null,
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
          caregiverConsentAckAt: caregiverAck ? now : undefined,
          operationalSmsConsent: seniorOperationalSmsConsent,
          operationalSmsConsentAt: seniorOperationalSmsConsent ? now : null,
        },
      });

      const contact = await tx.contact.create({
        data: {
          subscriberId: subscriber.id,
          seniorId: senior.id,
          fullName: normalized.primaryContact.fullName,
          relationship: normalized.primaryContact.relationship,
          phoneNumber: normalized.primaryContact.phoneNumber,
          email: normalized.primaryContact.email || undefined,
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
              email: c.email || undefined,
              priority: index + 2,
            },
          }),
        ),
      );

      const auditEvents: Array<{
        event: any;
        termsVersion?: string | null;
        privacyVersion?: string | null;
        currency?: any;
        billingInterval?: string | null;
        priceAmount?: number | null;
        stripeSessionId?: string | null;
        seniorPhoneNumber?: string | null;
        phoneE164?: string | null;
        metadata?: any;
      }> = [
        {
          event: "TERMS_ACCEPTED",
          termsVersion: tosVersion,
          privacyVersion,
          metadata: { caregiverAck },
        },
        {
          event: "PRIVACY_ACKNOWLEDGED",
          termsVersion: tosVersion,
          privacyVersion,
        },
        {
          event: "SENIOR_SMS_AUTHORIZATION",
          seniorPhoneNumber: senior.phoneNumber,
          phoneE164: senior.phoneNumber,
          metadata: { seniorOperationalSmsConsent },
        },
      ];
      if (marketingEmailConsent) {
        auditEvents.push({
          event: "MARKETING_EMAIL_OPT_IN",
          termsVersion: tosVersion,
          privacyVersion,
        });
      }
      if (seniorOperationalSmsConsent) {
        auditEvents.push({
          event: "OPERATIONAL_SMS_OPT_IN",
          seniorPhoneNumber: senior.phoneNumber,
          phoneE164: senior.phoneNumber,
        });
      }

      const auditsP = tx.legalConsentAudit.createMany({
        data: auditEvents.map((e) => ({
          subscriberId: subscriber.id,
          ipAddress: consent.ipAddress ?? undefined,
          userAgent: consent.userAgent ?? undefined,
          termsVersion: e.termsVersion ?? tosVersion,
          privacyVersion: e.privacyVersion ?? privacyVersion,
          event: e.event,
          subscriptionPlan: billingCurrency,
          currency: billingCurrency,
          billingInterval: e.billingInterval ?? null,
          priceAmount: typeof e.priceAmount === "number" ? e.priceAmount : null,
          stripeSessionId: e.stripeSessionId ?? null,
          stripeSubscriptionId: null,
          seniorPhoneNumber: e.seniorPhoneNumber ?? null,
          phoneE164: e.phoneE164 ?? null,
          metadata: e.metadata ?? undefined,
          createdAt: now,
        })),
      });

      await auditsP;

      return { subscriber, senior, contact, additionalContacts };
    });

    const timeZone = normalizeTimeZone(normalized.senior.timezone);
    const firstScheduledFor = getNextOccurrenceAtHourInTimeZone({
      timeZone,
      hour: normalized.senior.checkInHour,
      minute: normalized.senior.checkInMinute,
    });

    let seniorOnboardingSmsOutcome:
      | { ok: boolean; identitySid?: string | null; checkInSid?: string | null; skipped?: string }
      | null = null;
    if (!result.senior.smsOptedOut) {
      try {
        seniorOnboardingSmsOutcome = await sendSeniorOnboardingSmsSequence({
          to: result.senior.phoneNumber,
          meta: {
            subscriberId: result.subscriber.id,
            seniorId: result.senior.id,
            checkInId: null,
          },
        }).then((r) => ({
          ok: r.ok,
          identitySid: r.identity.ok ? r.identity.sid : null,
          checkInSid: r.checkIn?.ok ? r.checkIn.sid : null,
        }));
      } catch (smsError) {
        seniorOnboardingSmsOutcome = {
          ok: false,
          skipped:
            smsError instanceof Error ? smsError.message : "onboarding SMS send threw unexpectedly",
        };
      }
    } else if (result.senior.smsOptedOut) {
      seniorOnboardingSmsOutcome = { ok: false, skipped: "senior.smsOptedOut is true — STOP opt-out" };
    }

    const { enqueueJsonJob } = await import("@/lib/qstash");
    const sideEffectLabel = (index: number) =>
      [
        "sendTrialWelcomeEmail",
        "seniorOnboardingSms",
        "enqueue trial-nudge",
        "enqueue trial-ending-soon",
        "enqueue trial-final",
        "enqueue trial-expire",
      ][index] ?? `sideEffect[${index}]`;
    const sideEffects = await Promise.allSettled([
      sendTrialWelcomeEmail(result.subscriber.id),
      Promise.resolve(seniorOnboardingSmsOutcome),
      enqueueJsonJob("/api/jobs/trial-nudge", { subscriberId: result.subscriber.id }, 72),
      enqueueJsonJob("/api/jobs/trial-ending-soon", { subscriberId: result.subscriber.id }, 144),
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
      firstCheckInScheduledFor: firstScheduledFor.toISOString(),
      firstCheckInMessage: "First check-in scheduled tomorrow. Midnight cron will create the daily check-in row at 00:00 ET and enqueue SMS.",
    };
  } catch (err) {
    console.error(
      "[createHousehold] CAUGHT_ERR:",
      err instanceof Error ? err.constructor.name + " :: " + err.message : String(err),
    );
    if (err && typeof err === "object" && "code" in err) {
      console.error("[createHousehold] CAUGHT_ERR.code:", (err as any).code);
    }
    return {
      ok: false as const,
      message: userMessageForHouseholdError(err, "createHousehold"),
    };
  }
}

export async function updateHousehold(
  subscriberId: string,
  input: CreateHouseholdInput,
  consent: ConsentMetadata = {},
) {
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

    const tosVersion = consent.tosVersion ?? input.tosVersion ?? TOS_VERSION_CURRENT;
    const privacyVersion = consent.privacyVersion ?? input.privacyVersion ?? PRIVACY_VERSION_CURRENT;
    const seniorOperationalSmsConsent = Boolean(
      consent.seniorOperationalSmsConsent ?? input.seniorOperationalSmsConsent,
    );
    const marketingEmailConsent = Boolean(
      consent.marketingEmailConsent ?? input.marketingEmailConsent,
    );

    const result = await prisma.$transaction(async (tx) => {
      const now = new Date();
      const billingCurrency: BillingCurrency = isBillingCurrency(normalized.subscriber.billingCurrency)
        ? normalized.subscriber.billingCurrency
        : existingSubscriber.billingCurrency;
      const caregiverAck = Boolean(normalized.caregiverAck);

      const subscriber = await tx.subscriber.update({
        where: { id: subscriberId },
        data: {
          email: normalized.subscriber.email,
          fullName: normalized.subscriber.fullName,
          phoneNumber: normalized.subscriber.phoneNumber,
          billingCurrency,
          tosVersion,
          privacyPolicyVersion: privacyVersion,
          ...(caregiverAck ? { caregiverSeniorConsentAckAt: now, tosAcceptedAt: now } : {}),
          marketingEmailConsent,
          marketingEmailConsentAt: marketingEmailConsent
            ? now
            : existingSubscriber.marketingEmailConsentAt ?? null,
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
              ...(caregiverAck ? { caregiverConsentAckAt: now } : {}),
              operationalSmsConsent: seniorOperationalSmsConsent,
              operationalSmsConsentAt: seniorOperationalSmsConsent
                ? now
                : existingSubscriber.seniors[0].operationalSmsConsentAt ?? null,
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
              ...(caregiverAck ? { caregiverConsentAckAt: now } : {}),
              operationalSmsConsent: seniorOperationalSmsConsent,
              operationalSmsConsentAt: seniorOperationalSmsConsent ? now : null,
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
              email: normalized.primaryContact.email || undefined,
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
              email: normalized.primaryContact.email || undefined,
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
                email: payload.email || undefined,
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
                email: payload.email || undefined,
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

      const auditEvents: Array<{
        event: any;
        termsVersion?: string | null;
        privacyVersion?: string | null;
        currency?: any;
        billingInterval?: string | null;
        priceAmount?: number | null;
        stripeSessionId?: string | null;
        seniorPhoneNumber?: string | null;
        phoneE164?: string | null;
        metadata?: any;
      }> = [
        {
          event: "TERMS_ACCEPTED",
          termsVersion: tosVersion,
          privacyVersion,
          metadata: { caregiverAck },
        },
        {
          event: "PRIVACY_ACKNOWLEDGED",
          termsVersion: tosVersion,
          privacyVersion,
        },
        {
          event: "SENIOR_SMS_AUTHORIZATION",
          seniorPhoneNumber: senior.phoneNumber,
          phoneE164: senior.phoneNumber,
          metadata: { seniorOperationalSmsConsent },
        },
      ];
      if (marketingEmailConsent) {
        auditEvents.push({
          event: "MARKETING_EMAIL_OPT_IN",
          termsVersion: tosVersion,
          privacyVersion,
        });
      }
      if (seniorOperationalSmsConsent) {
        auditEvents.push({
          event: "OPERATIONAL_SMS_OPT_IN",
          seniorPhoneNumber: senior.phoneNumber,
          phoneE164: senior.phoneNumber,
        });
      }

      await tx.legalConsentAudit.createMany({
        data: auditEvents.map((e) => ({
          subscriberId,
          ipAddress: consent.ipAddress ?? undefined,
          userAgent: consent.userAgent ?? undefined,
          termsVersion: e.termsVersion ?? tosVersion,
          privacyVersion: e.privacyVersion ?? privacyVersion,
          event: e.event,
          subscriptionPlan: billingCurrency,
          currency: billingCurrency,
          billingInterval: e.billingInterval ?? null,
          priceAmount: typeof e.priceAmount === "number" ? e.priceAmount : null,
          stripeSessionId: e.stripeSessionId ?? null,
          stripeSubscriptionId: null,
          seniorPhoneNumber: e.seniorPhoneNumber ?? null,
          phoneE164: e.phoneE164 ?? null,
          metadata: e.metadata ?? undefined,
          createdAt: now,
        })),
      });

      return { subscriber, senior, contact, additionalContacts };
    });

    return {
      ok: true as const,
      household: result,
      message: "Household updated successfully.",
    };
  } catch (err) {
    console.error(
      "[updateHousehold] CAUGHT_ERR:",
      err instanceof Error ? err.constructor.name + " :: " + err.message : String(err),
    );
    if (err && typeof err === "object" && "code" in err) {
      console.error("[updateHousehold] CAUGHT_ERR.code:", (err as any).code);
    }
    return {
      ok: false as const,
      message: userMessageForHouseholdError(err, "updateHousehold"),
    };
  }
}

function userMessageForHouseholdError(err: unknown, op: "createHousehold" | "updateHousehold"): string {
  if (
    err &&
    typeof err === "object" &&
    "code" in err &&
    (err as any).code === "P2002" &&
    typeof (err as any).message === "string"
  ) {
    const msg = String((err as any).message).toLowerCase();
    if (msg.includes("`email`") || msg.includes("email unique")) {
      return "This email is already registered. Please log in to your existing account instead of creating a new one.";
    }
    if (msg.includes("senior") && msg.includes("phonenumber")) {
      return "This senior phone number is already registered to another household. Each senior must have a unique phone number across all accounts.";
    }
    if (msg.includes("`phonenumber`") || msg.includes("phone")) {
      return "This phone number is already registered. Please log in to your existing account, or use a different phone number for a new account.";
    }
    return "This account information is already in use. Please log in instead of creating a duplicate household.";
  }
  if (
    err &&
    typeof err === "object" &&
    "code" in err &&
    (err as any).code === "P2009" &&
    typeof (err as any).message === "string"
  ) {
    return "Some required fields were missing or invalid. Please review the form and try again.";
  }
  if (
    err &&
    typeof err === "object" &&
    "code" in err &&
    (err as any).code === "P2024"
  ) {
    return "We couldn't save your information because of a transient database error. Please wait 10 seconds and try again.";
  }
  if (op === "createHousehold") {
    return "We couldn't create your household right now. Please try again in a moment, or use a different email or phone number if this repeats.";
  }
  return "We couldn't save your changes right now. Please wait 10 seconds and try again.";
}
