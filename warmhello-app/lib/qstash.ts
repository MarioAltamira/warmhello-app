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
  delayOverride?: string,
): Promise<{ ok: true; messageId: string } | { ok: false; message: string }> {
  try {
    const notBefore = Math.max(0, Math.floor(runAt.getTime() / 1000));
    const url = `${APP_URL}${path}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Job-Secret": JOB_SIGNING_SECRET,
    };
    let res: { messageId: string };
    if (delayOverride) {
      res = await qstash.publishJSON({
        url,
        body: payload,
        headers,
        delay: delayOverride,
        retries: 0,
      });
    } else {
      res = await qstash.publishJSON({
        url,
        body: payload,
        headers,
        notBefore,
        retries: 0,
      });
    }
    return { ok: true, messageId: res.messageId };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, message };
  }
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
      body: payload,
      scheduleId,
    });
    return { ok: true, scheduleId: result.scheduleId, destination };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, message };
  }
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
