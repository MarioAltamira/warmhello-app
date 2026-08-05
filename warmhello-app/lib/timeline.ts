import { addDays, addHours, formatDateTime, getNextOccurrenceAtHourInTimeZone, subDays } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { shouldSendCheckInMessaging } from "@/lib/subscriber-lifecycle";
import { normalizeTimeZone } from "@/lib/timezones";

export type TimelineEvent = {
  id: string;
  channel: "email" | "sms";
  kind: string;
  scheduledFor: string;
  scheduledLabel: string;
  simulatedFor: string;
  simulatedLabel: string;
  status: "sent" | "scheduled" | "projected";
  actionUrl?: string;
};

export type SmsHistoryItem = {
  id: string;
  direction: "IN" | "OUT";
  status: "SENT" | "FAILED" | "RECEIVED";
  kind: string | null;
  toNumber: string;
  fromNumber: string;
  body: string;
  createdAt: string;
  createdLabel: string;
};

export type SubscriberTimeline = {
  subscriber: {
    id: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    subscriptionStatus: "TRIAL" | "ACTIVE" | "PAST_DUE" | "CANCELED";
    created: string;
    createdLabel: string;
  };
  senior: {
    id: string;
    firstName: string;
    phoneNumber: string;
    timeZone: string;
    checkInHour: number;
    checkInMinute: number;
    secondAttemptHours: number;
  } | null;
  window: {
    now: string;
    nowLabel: string;
    start: string;
    end: string;
    days: number;
    timeZone: string | null;
  };
  events: TimelineEvent[];
  smsHistory: SmsHistoryItem[];
};

const hoursToMs = 60 * 60 * 1000;
const daysToMs = 24 * hoursToMs;

function formatInZone(date: Date, timeZone: string | null) {
  return formatDateTime(date, timeZone ?? undefined);
}

function toSimulatedDate(now: Date, target: Date) {
  const deltaMs = target.getTime() - now.getTime();
  const deltaDays = deltaMs / daysToMs;
  const simulatedMs = now.getTime() + deltaDays * 60_000;
  return new Date(simulatedMs);
}

function buildTrialEmailEvents(input: {
  subscriberId: string;
  subscriberCreated: Date;
  subscriberTimeZone: string | null;
  now: Date;
}) {
  const welcomeAt = input.subscriberCreated;
  const nudgeAt = addHours(input.subscriberCreated, 72);
  const finalAt = addHours(input.subscriberCreated, 168);

  const events: TimelineEvent[] = [
    {
      id: `trial-email-welcome-${input.subscriberId}`,
      channel: "email",
      kind: "trial_welcome",
      scheduledFor: welcomeAt.toISOString(),
      scheduledLabel: formatInZone(welcomeAt, input.subscriberTimeZone),
      simulatedFor: toSimulatedDate(input.now, welcomeAt).toISOString(),
      simulatedLabel: formatInZone(toSimulatedDate(input.now, welcomeAt), input.subscriberTimeZone),
      status: welcomeAt <= input.now ? "sent" : "scheduled",
    },
    {
      id: `trial-email-nudge-${input.subscriberId}`,
      channel: "email",
      kind: "trial_nudge",
      scheduledFor: nudgeAt.toISOString(),
      scheduledLabel: formatInZone(nudgeAt, input.subscriberTimeZone),
      simulatedFor: toSimulatedDate(input.now, nudgeAt).toISOString(),
      simulatedLabel: formatInZone(toSimulatedDate(input.now, nudgeAt), input.subscriberTimeZone),
      status: nudgeAt <= input.now ? "sent" : "scheduled",
    },
    {
      id: `trial-email-final-${input.subscriberId}`,
      channel: "email",
      kind: "trial_final",
      scheduledFor: finalAt.toISOString(),
      scheduledLabel: formatInZone(finalAt, input.subscriberTimeZone),
      simulatedFor: toSimulatedDate(input.now, finalAt).toISOString(),
      simulatedLabel: formatInZone(toSimulatedDate(input.now, finalAt), input.subscriberTimeZone),
      status: finalAt <= input.now ? "sent" : "scheduled",
    },
  ];

  return events;
}

function buildProjectedCheckInEvents(input: {
  subscriberId: string;
  senior: {
    id: string;
    firstName: string;
    phoneNumber: string;
    timeZone: string;
    checkInHour: number;
    checkInMinute: number;
    secondAttemptHours: number;
  };
  now: Date;
  start: Date;
  end: Date;
}) {
  const timeZone = normalizeTimeZone(input.senior.timeZone);
  const events: TimelineEvent[] = [];

  for (let dayOffset = 0; dayOffset < 7; dayOffset += 1) {
    const from = addDays(input.now, dayOffset);
    const scheduledFor = getNextOccurrenceAtHourInTimeZone({
      timeZone,
      hour: input.senior.checkInHour,
      minute: input.senior.checkInMinute,
      from,
    });

    if (scheduledFor < input.start || scheduledFor > input.end) {
      continue;
    }

    const reminderAt = addHours(scheduledFor, input.senior.secondAttemptHours);
    const escalationAt = addHours(scheduledFor, input.senior.secondAttemptHours * 2);

    const baseId = `${input.subscriberId}-${scheduledFor.toISOString()}`;

    events.push(
      {
        id: `checkin-initial-${baseId}`,
        channel: "sms",
        kind: "checkin_initial_sms",
        scheduledFor: scheduledFor.toISOString(),
        scheduledLabel: formatInZone(scheduledFor, timeZone),
        simulatedFor: toSimulatedDate(input.now, scheduledFor).toISOString(),
        simulatedLabel: formatInZone(toSimulatedDate(input.now, scheduledFor), timeZone),
        status: scheduledFor <= input.now ? "sent" : "projected",
      },
      {
        id: `checkin-reminder-${baseId}`,
        channel: "sms",
        kind: "checkin_reminder_sms",
        scheduledFor: reminderAt.toISOString(),
        scheduledLabel: formatInZone(reminderAt, timeZone),
        simulatedFor: toSimulatedDate(input.now, reminderAt).toISOString(),
        simulatedLabel: formatInZone(toSimulatedDate(input.now, reminderAt), timeZone),
        status: reminderAt <= input.now ? "sent" : "projected",
      },
      {
        id: `checkin-escalation-${baseId}`,
        channel: "sms",
        kind: "checkin_escalation_sms",
        scheduledFor: escalationAt.toISOString(),
        scheduledLabel: formatInZone(escalationAt, timeZone),
        simulatedFor: toSimulatedDate(input.now, escalationAt).toISOString(),
        simulatedLabel: formatInZone(toSimulatedDate(input.now, escalationAt), timeZone),
        status: escalationAt <= input.now ? "sent" : "projected",
      },
    );
  }

  return events;
}

export async function getSubscriberTimeline(subscriberId: string, days = 7): Promise<SubscriberTimeline> {
  const now = new Date();
  const start = now;
  const end = addDays(now, days);
  const historyStart = subDays(now, days);

  if (!prisma) {
    return {
      subscriber: {
        id: subscriberId,
        fullName: "Caregiver Demo",
        email: "caregiver@example.com",
        phoneNumber: "+15551230001",
        subscriptionStatus: "TRIAL",
        created: now.toISOString(),
        createdLabel: formatDateTime(now),
      },
      senior: null,
      window: {
        now: now.toISOString(),
        nowLabel: formatDateTime(now),
        start: start.toISOString(),
        end: end.toISOString(),
        days,
        timeZone: null,
      },
      events: [],
      smsHistory: [],
    };
  }

  const subscriber = await prisma.subscriber.findUnique({
    where: { id: subscriberId },
    include: {
      seniors: {
        where: { active: true },
        orderBy: { createdAt: "asc" },
        take: 1,
      },
    },
  });

  if (!subscriber) {
    return {
      subscriber: {
        id: subscriberId,
        fullName: "Unknown subscriber",
        email: "",
        phoneNumber: "",
        subscriptionStatus: "TRIAL",
        created: now.toISOString(),
        createdLabel: formatDateTime(now),
      },
      senior: null,
      window: {
        now: now.toISOString(),
        nowLabel: formatDateTime(now),
        start: start.toISOString(),
        end: end.toISOString(),
        days,
        timeZone: null,
      },
      events: [],
      smsHistory: [],
    };
  }

  const senior = subscriber.seniors[0] ?? null;
  const timeZone = senior ? normalizeTimeZone(senior.timezone) : null;

  const [checkIns, smsLogs] = await Promise.all([
    prisma.checkIn.findMany({
      where: {
        subscriberId,
        scheduledFor: {
          gte: start,
          lte: end,
        },
      },
      orderBy: { scheduledFor: "asc" },
    }),
    prisma.smsLog.findMany({
      where: {
        subscriberId,
        createdAt: {
          gte: historyStart,
          lte: end,
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const events: TimelineEvent[] = [];

  events.push(
    ...buildTrialEmailEvents({
      subscriberId,
      subscriberCreated: subscriber.created,
      subscriberTimeZone: timeZone,
      now,
    }),
  );

  if (
    senior &&
    shouldSendCheckInMessaging({
      subscriptionStatus: subscriber.subscriptionStatus,
      created: subscriber.created,
    })
  ) {
    events.push(
      ...buildProjectedCheckInEvents({
        subscriberId,
        senior: {
          id: senior.id,
          firstName: senior.firstName,
          phoneNumber: senior.phoneNumber,
          timeZone: senior.timezone,
          checkInHour: senior.checkInHour,
          checkInMinute: senior.checkInMinute,
          secondAttemptHours: senior.secondAttemptHours,
        },
        now,
        start,
        end,
      }),
    );
  }

  for (const checkIn of checkIns) {
    events.push({
      id: `db-checkin-${checkIn.id}`,
      channel: "sms",
      kind: "checkin_session_scheduled",
      scheduledFor: checkIn.scheduledFor.toISOString(),
      scheduledLabel: formatInZone(checkIn.scheduledFor, timeZone),
      simulatedFor: toSimulatedDate(now, checkIn.scheduledFor).toISOString(),
      simulatedLabel: formatInZone(toSimulatedDate(now, checkIn.scheduledFor), timeZone),
      status: "scheduled",
      actionUrl: `/checkin/${checkIn.token}`,
    });
  }

  events.sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime());

  return {
    subscriber: {
      id: subscriber.id,
      fullName: subscriber.fullName,
      email: subscriber.email,
      phoneNumber: subscriber.phoneNumber,
      subscriptionStatus: subscriber.subscriptionStatus,
      created: subscriber.created.toISOString(),
      createdLabel: formatInZone(subscriber.created, timeZone),
    },
    senior: senior
      ? {
          id: senior.id,
          firstName: senior.firstName,
          phoneNumber: senior.phoneNumber,
          timeZone: timeZone ?? normalizeTimeZone(senior.timezone),
          checkInHour: senior.checkInHour,
          checkInMinute: senior.checkInMinute,
          secondAttemptHours: senior.secondAttemptHours,
        }
      : null,
    window: {
      now: now.toISOString(),
      nowLabel: formatInZone(now, timeZone),
      start: start.toISOString(),
      end: end.toISOString(),
      days,
      timeZone,
    },
    events,
    smsHistory: smsLogs.map((log) => ({
      id: log.id,
      direction: log.direction,
      status: log.status,
      kind: log.kind,
      toNumber: log.toNumber,
      fromNumber: log.fromNumber,
      body: log.body,
      createdAt: log.createdAt.toISOString(),
      createdLabel: formatInZone(log.createdAt, timeZone),
    })),
  };
}

