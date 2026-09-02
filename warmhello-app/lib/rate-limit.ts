type WindowEntry = {
  timestampsMs: number[];
};

const buckets = new Map<string, WindowEntry>();

const SWEEP_INTERVAL_MS = 60_000;

if (typeof globalThis !== "undefined") {
  try {
    (globalThis as any)[Symbol.for("warmhello_rate_limit_sweep")] ||= setInterval(
      () => {
        const now = Date.now();
        for (const [key, entry] of buckets.entries()) {
          while (
            entry.timestampsMs.length > 0 &&
            entry.timestampsMs[0]! < now - 24 * 60 * 60_000
          ) {
            entry.timestampsMs.shift();
          }
          if (entry.timestampsMs.length === 0) {
            buckets.delete(key);
          }
        }
      },
      SWEEP_INTERVAL_MS,
    );
  } catch {
    /* best-effort sweep; do not crash on timers failure */
  }
}

export function checkRateLimit(
  key: string,
  windowMs: number,
  limit: number,
): { allowed: boolean; retryAfterMs: number; remaining: number } {
  const now = Date.now();
  let entry = buckets.get(key);
  if (!entry) {
    entry = { timestampsMs: [] };
    buckets.set(key, entry);
  }
  const cutoff = now - windowMs;
  while (entry.timestampsMs.length > 0 && entry.timestampsMs[0]! < cutoff) {
    entry.timestampsMs.shift();
  }
  if (entry.timestampsMs.length >= limit) {
    const retryAfterMs =
      entry.timestampsMs.length > 0
        ? entry.timestampsMs[0]! + windowMs - now
        : 1000;
    return {
      allowed: false,
      retryAfterMs: Math.max(1000, retryAfterMs),
      remaining: 0,
    };
  }
  entry.timestampsMs.push(now);
  return {
    allowed: true,
    retryAfterMs: 0,
    remaining: Math.max(0, limit - entry.timestampsMs.length),
  };
}

export function formatRetrySeconds(retryAfterMs: number): string {
  const seconds = Math.max(1, Math.ceil(retryAfterMs / 1000));
  if (seconds < 60) return `${seconds} second${seconds === 1 ? "" : "s"}`;
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} minute${minutes === 1 ? "" : "s"}`;
}
