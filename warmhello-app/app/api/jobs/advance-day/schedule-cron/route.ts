import { NextResponse } from "next/server";
import { z } from "zod";
import { publishCronJsonJob, verifyJobSecret } from "@/lib/qstash";

const DEFAULT_CRON = "CRON_TZ=America/Toronto 0 0 * * *";
const DEFAULT_RETRIES = 1;

const FIVE_FIELD_CRON =
  "(?:\\*|[0-9,-/]+)\\s+(?:\\*|[0-9,-/]+)\\s+(?:\\*|[0-9,-/]+)\\s+(?:\\*|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|[0-9,-/]+)\\s+(?:\\*|mon|tue|wed|thu|fri|sat|sun|[0-9,-/]+)";

const bodySchema = z.object({
  retries: z.number().int().min(0).max(5).optional().default(DEFAULT_RETRIES),
  cron: z
    .string()
    .min(9)
    .regex(new RegExp(`^(?:CRON_TZ=[A-Za-z/_+-]+\\s+)?${FIVE_FIELD_CRON}$`, "i"), {
      message: "cron must be a 5-field standard cron expression, optionally prefixed with CRON_TZ=Region/Location",
    })
    .optional()
    .default(DEFAULT_CRON),
  scheduleId: z
    .string()
    .min(1)
    .max(256)
    .regex(/^[A-Za-z0-9_.\-]+$/, {
      message: "scheduleId must contain only A-Z a-z 0-9 _ . -",
    })
    .optional(),
});

export async function POST(request: Request) {
  if (!verifyJobSecret(request) && process.env.NODE_ENV === "production") {
    return NextResponse.json({ ok: false, message: "Unauthorized job request." }, { status: 401 });
  }

  const raw = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: "Invalid input", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const scheduled = await publishCronJsonJob(
    "/api/jobs/advance-day",
    {},
    parsed.data.cron,
    parsed.data.retries,
    parsed.data.scheduleId,
  );

  if (!scheduled.ok) {
    return NextResponse.json(
      { ok: false, message: scheduled.message },
      { status: 502 },
    );
  }

  const dest = scheduled.destination;
  const dest0 = dest.charCodeAt(0);
  const destTail = dest.charCodeAt(dest.length - 1);
  return NextResponse.json({
    ok: true,
    cronExpression: parsed.data.cron,
    retries: parsed.data.retries,
    requestedScheduleId: parsed.data.scheduleId ?? null,
    scheduleId: scheduled.scheduleId,
    jobPath: "/api/jobs/advance-day",
    destination: {
      value: dest,
      length: dest.length,
      firstChar: String.fromCharCode(dest0),
      firstCharCode: dest0,
      lastChar: String.fromCharCode(destTail),
      lastCharCode: destTail,
      startsWithHttps: dest.startsWith("https://"),
      hasNoSpaceOrBacktick:
        !dest.includes(" ") &&
        !dest.includes("`") &&
        !dest.includes("'") &&
        !dest.includes('"') &&
        !dest.includes(","),
    },
  });
}
