const hoursToMs = 60 * 60 * 1000;
const daysToMs = 24 * hoursToMs;

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * hoursToMs);
}

export function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * daysToMs);
}

export function subDays(date: Date, days: number) {
  return new Date(date.getTime() - days * daysToMs);
}

export function formatDateTime(date: Date) {
  return dateTimeFormatter.format(date);
}
