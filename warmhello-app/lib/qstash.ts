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

  const response = await fetch(
    `${env.QSTASH_URL}/v2/publish/${encodeURIComponent(`${env.APP_URL}${path}`)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.QSTASH_TOKEN}`,
        "Content-Type": "application/json",
        "Upstash-Delay": `${delayHours}h`,
        "X-Job-Secret": env.JOB_SIGNING_SECRET,
      },
      body: JSON.stringify({
        ...payload,
        scheduledFor: addHours(new Date(), delayHours).toISOString(),
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

export function verifyJobSecret(request: Request) {
  return request.headers.get("x-job-secret") === env.JOB_SIGNING_SECRET;
}
