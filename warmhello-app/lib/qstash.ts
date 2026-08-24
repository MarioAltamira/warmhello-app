import { Client } from "@upstash/qstash";
import { timingSafeEqual } from "crypto";
import { env } from "@/lib/env";

const JOB_SIGNING_SECRET: string = env.JOB_SIGNING_SECRET;

const APP_URL = env.APP_URL.replace(/\/$/, "");

const qstash = new Client({ token: env.QSTASH_TOKEN });

export async function enqueueJsonJobAt(
  path: string,
  payload: Record<string, unknown>,
  runAt: Date,
  delayOverride?: `${bigint}s` | `${bigint}m` | `${bigint}h` | `${bigint}d`,
): Promise<{ ok: true; messageId: string } | { ok: false; message: string }> {
  try {
    const notBefore = Math.max(0, Math.floor(runAt.getTime() / 1000));
    const url = `${APP_URL}${path}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Job-Secret": JOB_SIGNING_SECRET,
    };
    let res;
    if (delayOverride) {
      res = await qstash.publishJSON({
        url,
        body: payload,
        headers,
        delay: delayOverride,
        retries: 0,
      }) as { messageId: string };
    } else {
      res = await qstash.publishJSON({
        url,
        body: payload,
        headers,
        notBefore,
        retries: 0,
      }) as { messageId: string };
    }
    return { ok: true, messageId: res.messageId };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, message };
  }
}

export async function enqueueJsonJob(
  path: string,
  payload: Record<string, unknown>,
  delayHours: number,
): Promise<{ ok: true; messageId: string } | { ok: false; message: string }> {
  const delaySec = BigInt(Math.max(0, Math.round(delayHours * 3600)));
  const delayStr = `${delaySec}s` as const;
  return enqueueJsonJobAt(path, payload, new Date(), delayStr);
}

export async function publishCronJsonJob(
  path: string,
  payload: Record<string, unknown>,
  cron: string,
  retries = 0,
  scheduleId?: string,
): Promise<{ ok: true; scheduleId: string; destination: string } | { ok: false; message: string }> {
  try {
    const destination = `${APP_URL}${path}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Job-Secret": JOB_SIGNING_SECRET,
    };
    const result = await qstash.schedules.create({
      destination,
      cron,
      retries,
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      scheduleId,
    });
    return { ok: true, scheduleId: result.scheduleId, destination };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, message };
  }
}

export async function listAllSchedules(): Promise<
  { ok: true; schedules: Array<{ scheduleId: string; cron?: string; destination?: { url?: string } }> } | { ok: false; message: string }
> {
  try {
    const result = (await qstash.schedules.list()) as Array<{
      scheduleId: string;
      cron?: string;
      destination?: { url?: string };
    }>;
    return { ok: true, schedules: result ?? [] };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, message };
  }
}

export async function deleteScheduleById(scheduleId: string): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    await qstash.schedules.delete(scheduleId);
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, message };
  }
}

export async function deleteDuplicateSchedulesForPath(path: string): Promise<{
  ok: boolean;
  deleted: string[];
  remaining: number;
  message: string;
}> {
  const targetUrl = `${APP_URL}${path}`;
  const listed = await listAllSchedules();
  if (!listed.ok) {
    return { ok: false, deleted: [], remaining: 0, message: listed.message };
  }
  const matches = listed.schedules.filter((s) => {
    const dest = typeof s.destination === "string" ? s.destination : s.destination?.url ?? "";
    return dest === targetUrl;
  });
  if (matches.length <= 1) {
    return {
      ok: true,
      deleted: [],
      remaining: matches.length,
      message: matches.length === 0 ? `No schedules found for ${targetUrl}` : `Single schedule found (ok, not duplicate)`,
    };
  }
  const toDelete = matches.slice(0, -1);
  const keepSchedule = matches[matches.length - 1];
  const deleted: string[] = [];
  const errors: string[] = [];
  for (const s of toDelete) {
    const removed = await deleteScheduleById(s.scheduleId);
    if (removed.ok) {
      deleted.push(s.scheduleId);
    } else {
      errors.push(`${s.scheduleId}: ${removed.message}`);
    }
  }
  return {
    ok: errors.length === 0,
    deleted,
    remaining: 1,
    message:
      errors.length > 0
        ? `Deleted ${deleted.length}/${toDelete.length} duplicates, kept scheduleId=${keepSchedule.scheduleId}. Errors: ${errors.join("; ")}`
        : `Deleted ${deleted.length} duplicate schedules for ${targetUrl}, kept scheduleId=${keepSchedule.scheduleId}.`,
  };
}

export function verifyJobSecret(request: Request): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  const supplied = request.headers.get("X-Job-Secret");
  if (!supplied) return false;
  try {
    const a = Buffer.from(supplied, "utf8");
    const b = Buffer.from(JOB_SIGNING_SECRET, "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
