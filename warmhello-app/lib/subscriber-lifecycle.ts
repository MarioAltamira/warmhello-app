import { prisma } from "@/lib/prisma";
import { getSubscriberPlanSummary } from "@/lib/subscriber-plan";
import { addDays, addHours } from "@/lib/dates";

export function shouldSendCheckInMessaging(input: {
  subscriptionStatus: "TRIAL" | "ACTIVE" | "PAST_DUE" | "CANCELED";
  created: Date;
  now?: Date;
}) {
  if (input.subscriptionStatus === "ACTIVE") {
    return true;
  }

  if (input.subscriptionStatus === "TRIAL") {
    const plan = getSubscriberPlanSummary({
      created: input.created,
      subscriptionStatus: "TRIAL",
    });
    return !plan.isTrialExpired;
  }

  return false;
}

export async function getActiveSubscriberForSmsOrSchedule(subscriberId: string) {
  if (!prisma) {
    return null;
  }

  const subscriber = await prisma.subscriber.findUnique({
    where: { id: subscriberId },
    select: {
      id: true,
      subscriptionStatus: true,
      created: true,
      seniors: {
        orderBy: { createdAt: "asc" },
        take: 1,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phoneNumber: true,
          timezone: true,
          active: true,
        },
      },
      contacts: {
        orderBy: { priority: "asc" },
        take: 1,
        select: {
          id: true,
          fullName: true,
          relationship: true,
          phoneNumber: true,
        },
      },
    },
  });

  if (!subscriber) {
    return null;
  }

  const canSend = shouldSendCheckInMessaging({
    subscriptionStatus: subscriber.subscriptionStatus,
    created: subscriber.created,
  });

  if (!canSend) {
    return null;
  }

  const senior = subscriber.seniors[0] ?? null;
  if (!senior || !senior.active) {
    return null;
  }

  return {
    subscriber: {
      id: subscriber.id,
      subscriptionStatus: subscriber.subscriptionStatus,
      created: subscriber.created,
    },
    senior,
    primaryContact: subscriber.contacts[0] ?? null,
  };
}

export function buildThankYouSmsBody(input: {
  seniorFirstName: string;
  subscriberName: string;
}) {
  return [
    `Hi ${input.seniorFirstName}, this is Warm-Hello.`,
    `A quick note from your family member ${input.subscriberName}: thank you for trying the Warm-Hello check-in program over the last week.`,
    `We hope it brought a little more calm to your mornings. If you'd like to continue, your family member can reactivate anytime at warm-hello.com.`,
    `Warmly, Warm-Hello`,
  ].join("\n");
}

export function getDayEightThankYouRunAt(trialStart: Date, day8PreferredHour = 9) {
  const trialEndsAt = addDays(trialStart, 7);
  const day8AtHour = new Date(trialEndsAt);
  day8AtHour.setHours(day8PreferredHour, 0, 0, 0);
  if (day8AtHour <= trialEndsAt) {
    day8AtHour.setDate(day8AtHour.getDate() + 1);
  }
  return day8AtHour;
}
