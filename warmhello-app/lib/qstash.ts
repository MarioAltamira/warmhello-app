import { addHours } from "@/lib/dates";
import { env } from "@/lib/env";

const URL_SAFE_CHARS = new Set(
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~:/?#[]@!$&'()*+,;=%".split("")
);

function cleanUrl(raw: string | undefined): string {
  if (!raw) return "";
  const s = String(raw);
  let out = "";
  for (let i = 0; i < s.length; i++) {
    const cc = s.charCodeAt(i);
    const ch = s[i];
    if (cc >= 0x80) continue;
    if (cc < 0x20) continue;
    if (URL_SAFE_CHARS.has(ch)) out += ch;
  }
  while (out.length > 0 && " `'\";,)".includes(out[0])) out = out.slice(1);
  while (out.length > 0 && " `'\";,(".includes(out[out.length - 1])) out = out.slice(0, -1);
  return out.trim();
}

const APP_URL_CLEAN = cleanUrl(env.APP_URL);
const QSTASH_URL_CLEAN = cleanUrl(env.QSTASH_URL);

export async function enqueueJsonJob(
  path: string,
  payload: Record<string, unknown>,
  delayHours: number,
) {
  if (!env.QSTASH_TOKEN) {
    return { ok: false as const, message: "QStash is not configured." };
  }

  const runAt = addHours(new Date(), delayHours);
  return enqueueJsonJobAt(path, payload, runAt, `${delayHours}h`);
}

export async function enqueueJsonJobAt(
  path: string,
  payload: Record<string, unknown>,
  runAt: Date,
  delayOverride?: string,
) {
  if (!env.QSTASH_TOKEN) {
    return { ok: false as const, message: "QStash is not configured." };
  }
  if (!APP_URL_CLEAN) {
    return { ok: false as const, message: "APP_URL is not set (after cleaning)." };
  }
  if (!QSTASH_URL_CLEAN) {
    return { ok: false as const, message: "QSTASH_URL is not set (after cleaning)." };
  }

  const delaySeconds = Math.max(0, Math.floor((runAt.getTime() - Date.now()) / 1000));
  const delayHeader =
    delayOverride ?? (delaySeconds > 0 ? `${delaySeconds}s` : undefined);

  const destination = APP_URL_CLEAN + path;

  const response = await fetch(
    QSTASH_URL_CLEAN + "/v2/publish/" + encodeURIComponent(destination),
    {
      method: "POST",
      headers: {
        Authorization: "Bearer " + env.QSTASH_TOKEN,
        "Content-Type": "application/json",
        ...(delayHeader ? { "Upstash-Delay": delayHeader } : {}),
        "X-Job-Secret": env.JOB_SIGNING_SECRET,
      },
      body: JSON.stringify({
        ...payload,
        scheduledFor: runAt.toISOString(),
      }),
    },
  );

  if (!response.ok) {
    const text = await response.text();
    return {
      ok: false as const,
      message:
        "QStash enqueue failed [qstash=" +
        QSTASH_URL_CLEAN +
        ", dest=" +
        destination +
        "]: " +
        text,
    };
  }

  const data = (await response.json()) as { messageId?: string };
  return { ok: true as const, messageId: data.messageId ?? null };
}

export async function publishCronJsonJob(
  path: string,
  payload: Record<string, unknown>,
  cron: string,
  retries = 0,
  scheduleId?: string,
) {
  if (!env.QSTASH_TOKEN) {
    return { ok: false as const, message: "QStash is not configured." };
  }
  if (!APP_URL_CLEAN) {
    return { ok: false as const, message: "APP_URL is not set (after cleaning)." };
  }
  if (!QSTASH_URL_CLEAN) {
    return { ok: false as const, message: "QSTASH_URL is not set (after cleaning)." };
  }

  const destination = APP_URL_CLEAN + path;

  try {
    const destUrl = new URL(destination);
    if (destUrl.protocol !== "http:" && destUrl.protocol !== "https:") {
      return {
        ok: false as const,
        message:
          "Invalid destination protocol (must be http: or https:) after cleaning. dest=" +
          JSON.stringify(destination) +
          " proto=" +
          destUrl.protocol,
      };
    }
  } catch (e) {
    return {
      ok: false as const,
      message:
        "Destination URL fails to parse after cleaning: " +
        (e instanceof Error ? e.message : String(e)) +
        ". dest=" +
        JSON.stringify(destination),
    };
  }

  const response = await fetch(
    QSTASH_URL_CLEAN + "/v2/schedules/" + destination,
    {
      method: "POST",
      headers: {
        Authorization: "Bearer " + env.QSTASH_TOKEN,
        "Content-Type": "application/json",
        "Upstash-Cron": cron,
        "Upstash-Retries": String(Math.max(0, Math.floor(retries))),
        ...(scheduleId ? { "Upstash-Schedule-Id": scheduleId } : {}),
        "X-Job-Secret": env.JOB_SIGNING_SECRET,
      },
      body: JSON.stringify(payload),
    },
  );

  void 0;

  if (!response.ok) {
    const text = await response.text();
    return {
      ok: false as const,
      message:
        "QStash schedule failed [qstash=" +
        QSTASH_URL_CLEAN +
        ", dest=" +
        destination +
        "]: " +
        text,
    };
  }

  const data = (await response.json()) as { scheduleId?: string };
  return { ok: true as const, scheduleId: data.scheduleId ?? null };
}

export function verifyJobSecret(request: Request) {
  return request.headers.get("x-job-secret") === env.JOB_SIGNING_SECRET;
}
