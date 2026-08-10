import { addHours } from "@/lib/dates";
import { env } from "@/lib/env";

const URL_EXTRACT_RE = /https?:\/\/[^\s`'"<>\\,;\u00a0\u2000-\u200b\u2018-\u201f\ufeff]+/i;

function cleanUrl(raw: string | undefined): string {
  if (!raw) return "";
  let s = String(raw);

  s = s.replace(/\r/g, "");
  s = s.replace(/[\u00a0\u2000-\u200b\u2028-\u2029\ufeff]/g, " ");
  s = s.replace(/[\u2018\u2019\u201a\u201b]/g, "'");
  s = s.replace(/[\u201c\u201d\u201e\u201f]/g, '"');
  s = s.replace(/\u00b4|\u02cb|\u0060/g, "`");

  const m = s.match(URL_EXTRACT_RE);
  if (m && m[0]) {
    let extracted = m[0];
    // drop common trailing punctuation even if not caught by the char class
    extracted = extracted.replace(/[).,;:!?`'"]+$/g, "");
    extracted = extracted.replace(/^[`'"(]+/g, "");
    extracted = extracted.trim();
    return extracted;
  }

  s = s.trim();
  let prev = "";
  let guard = 0;
  while (prev !== s && guard < 12) {
    prev = s;
    guard++;
    s = s.replace(/^[`'" \t(]+|[`'" ,;)\t]+$/g, "");
    s = s.trim();
  }
  if (/^[`'" ]+|[`'" ]+$/.test(s)) {
    s = s.replace(/^[`'" ]+/, "").replace(/[`'" ]+$/, "").trim();
  }
  return s;
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
  const response = await fetch(
    QSTASH_URL_CLEAN + "/v2/schedules/" + encodeURIComponent(destination),
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
