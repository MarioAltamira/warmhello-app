import { addHours } from "@/lib/dates";
import { env } from "@/lib/env";

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

  const delaySeconds = Math.max(0, Math.floor((runAt.getTime() - Date.now()) / 1000));
  const delayHeader =
    delayOverride ?? (delaySeconds > 0 ? `${delaySeconds}s` : undefined);

  const response = await fetch(
    `${env.QSTASH_URL}/v2/publish/${encodeURIComponent(`${env.APP_URL}${path}`)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.QSTASH_TOKEN}`,
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
    return { ok: false as const, message: text };
  }

  const data = (await response.json()) as { messageId?: string };
  return { ok: true as const, messageId: data.messageId ?? null };
}

export async function publishCronJsonJob(
  path: string,
  payload: Record<string, unknown>,
  cron: string,
  retries = 0,
) {
  if (!env.QSTASH_TOKEN) {
    return { ok: false as const, message: "QStash is not configured." };
  }

  const destination = `${env.APP_URL}${path}`;
  const response = await fetch(
    `${env.QSTASH_URL}/v2/publish/${encodeURIComponent(destination)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.QSTASH_TOKEN}`,
        "Content-Type": "application/json",
        "Upstash-Cron": cron,
        "Upstash-Retries": String(Math.max(0, Math.floor(retries))),
        "X-Job-Secret": env.JOB_SIGNING_SECRET,
      },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    const text = await response.text();
    return { ok: false as const, message: text };
  }

  const data = (await response.json()) as { scheduleId?: string };
  return { ok: true as const, scheduleId: data.scheduleId ?? null };
}

export function verifyJobSecret(request: Request) {
  return request.headers.get("x-job-secret") === env.JOB_SIGNING_SECRET;
}
