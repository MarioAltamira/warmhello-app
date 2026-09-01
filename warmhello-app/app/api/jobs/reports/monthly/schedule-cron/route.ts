import { NextResponse } from "next/server";
import { z } from "zod";
import {
  deleteAllSchedulesForPath,
  publishCronJsonJob,
  verifyJobSecret,
} from "@/lib/qstash";

const DEFAULT_CRON = "CRON_TZ=America/Toronto 0 9 1 * *";
const DEFAULT_RETRIES = 0;
const JOB_PATH = "/api/jobs/reports/monthly";

const FIVE_FIELD_CRON =
  "(?:\\*|[0-9,-/]+)\\s+(?:\\*|[0-9,-/]+)\\s+(?:\\*|[0-9,-/]+)\\s+(?:\\*|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|[0-9,-/]+)\\s+(?:\\*|mon|tue|wed|thu|fri|sat|sun|[0-9,-/]+)";

const TZ_PREFIX = "CRON_TZ=[A-Za-z/_+-]+";
const TZ_SUFFIX = "[A-Za-z/_+-]+";

const bodySchema = z.object({
  retries: z.number().int().min(0).max(5).optional().default(DEFAULT_RETRIES),
  cron: z
    .string()
    .min(9)
    .regex(
      new RegExp(
        `^(?:${TZ_PREFIX}\\s+${FIVE_FIELD_CRON}|${FIVE_FIELD_CRON}\\s+${TZ_SUFFIX}|${FIVE_FIELD_CRON})$`,
        "i",
      ),
      {
        message:
          "cron must be a 5-field standard cron expression, optionally with timezone either as a CRON_TZ=Region/Location prefix or a Region/Location suffix.",
      },
    )
    .optional()
    .default(DEFAULT_CRON),
  scheduleId: z
    .string()
    .min(1)
    .max(256)
    .regex(/^[A-Za-z0-9_.\-]+$/)
    .optional(),
  force: z.boolean().optional().default(false),
});

export async function POST(request: Request) {
  if (!verifyJobSecret(request) && process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { ok: false, message: "Unauthorized job request." },
      { status: 401 },
    );
  }

  const raw = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: "Invalid input", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const dedupe = await deleteAllSchedulesForPath(JOB_PATH);
  if (!dedupe.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: `Failed to clear previous schedules before create. ${dedupe.message}`,
        dedupeBeforeCreate: dedupe,
      },
      { status: 502 },
    );
  }

  const scheduled = await publishCronJsonJob(
    JOB_PATH,
    {},
    parsed.data.cron,
    parsed.data.retries,
    parsed.data.scheduleId,
  );

  if (!scheduled.ok) {
    return NextResponse.json(
      { ok: false, message: scheduled.message, dedupeBeforeCreate: dedupe },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    cronExpression: parsed.data.cron,
    retries: parsed.data.retries,
    requestedScheduleId: parsed.data.scheduleId ?? null,
    scheduleId: scheduled.scheduleId,
    jobPath: JOB_PATH,
    destinationUrl: scheduled.destination,
    dedupeBeforeCreate: dedupe,
    note: "Monthly sales recap email fires at 09:00 (9:00 AM) America/Toronto on the 1st of each month, covering the previous full closed month.",
  });
}
