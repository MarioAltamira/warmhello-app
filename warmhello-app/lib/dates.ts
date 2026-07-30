const hoursToMs = 60 * 60 * 1000;
const daysToMs = 24 * hoursToMs;

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

const timeZoneFormatters = new Map<string, Intl.DateTimeFormat>();

function getTimeZoneDateTimeFormatter(timeZone: string) {
  const existing = timeZoneFormatters.get(timeZone);
  if (existing) {
    return existing;
  }

  const created = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  });
  timeZoneFormatters.set(timeZone, created);
  return created;
}

export function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * hoursToMs);
}

export function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * daysToMs);
}

export function subDays(date: Date, days: number) {
  return new Date(date.getTime() - days * daysToMs);
}

export function formatDateTime(date: Date, timeZone?: string) {
  if (!timeZone) {
    return dateTimeFormatter.format(date);
  }

  return getTimeZoneDateTimeFormatter(timeZone).format(date);
}

type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

const zonedPartsFormatters = new Map<string, Intl.DateTimeFormat>();

function getZonedPartsFormatter(timeZone: string) {
  const existing = zonedPartsFormatters.get(timeZone);
  if (existing) {
    return existing;
  }

  const created = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  zonedPartsFormatters.set(timeZone, created);
  return created;
}

function getZonedParts(date: Date, timeZone: string): ZonedParts {
  const parts = getZonedPartsFormatter(timeZone).formatToParts(date);
  const extracted: Record<string, string> = {};

  for (const part of parts) {
    if (part.type !== "literal") {
      extracted[part.type] = part.value;
    }
  }

  return {
    year: Number(extracted.year),
    month: Number(extracted.month),
    day: Number(extracted.day),
    hour: Number(extracted.hour),
    minute: Number(extracted.minute),
    second: Number(extracted.second),
  };
}

function getTimeZoneOffsetMs(date: Date, timeZone: string) {
  const parts = getZonedParts(date, timeZone);
  const asUtcMs = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  return asUtcMs - date.getTime();
}

function dateFromTimeZoneParts(input: {
  timeZone: string;
  year: number;
  month: number;
  day: number;
  hour: number;
  minute?: number;
  second?: number;
}) {
  const utcGuessMs = Date.UTC(
    input.year,
    input.month - 1,
    input.day,
    input.hour,
    input.minute ?? 0,
    input.second ?? 0,
  );

  const guess = new Date(utcGuessMs);
  const offset1 = getTimeZoneOffsetMs(guess, input.timeZone);
  let resolved = new Date(utcGuessMs - offset1);
  const offset2 = getTimeZoneOffsetMs(resolved, input.timeZone);
  if (offset2 !== offset1) {
    resolved = new Date(utcGuessMs - offset2);
  }
  return resolved;
}

export function getNextOccurrenceAtHourInTimeZone(input: {
  timeZone: string;
  hour: number;
  minute?: number;
  from?: Date;
}) {
  const now = input.from ?? new Date();
  const nowParts = getZonedParts(now, input.timeZone);

  let candidate = dateFromTimeZoneParts({
    timeZone: input.timeZone,
    year: nowParts.year,
    month: nowParts.month,
    day: nowParts.day,
    hour: input.hour,
    minute: input.minute ?? 0,
    second: 0,
  });

  if (candidate <= now) {
    candidate = dateFromTimeZoneParts({
      timeZone: input.timeZone,
      year: nowParts.year,
      month: nowParts.month,
      day: nowParts.day + 1,
      hour: input.hour,
      minute: input.minute ?? 0,
      second: 0,
    });
  }

  return candidate;
}
