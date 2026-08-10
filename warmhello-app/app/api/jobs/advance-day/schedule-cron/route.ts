import { NextResponse } from "next/server";
import { z } from "zod";
import { publishCronJsonJob, verifyJobSecret } from "@/lib/qstash";

const DEFAULT_CRON = "0 4 * * *";
const DEFAULT_RETRIES = 1;

const bodySchema = z.object({
  retries: z.number().int().min(0).max(5).optional().default(DEFAULT_RETRIES),
  cron: z
    .string()
    .min(9)
    .regex(/^(\*|[0-9,-/]+)\s+(\*|[0-9,-/]+)\s+(\*|[0-9,-/]+)\s+(\*|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|[0-9,-/]+)\s+(\*|mon|tue|wed|thu|fri|sat|sun|[0-9,-/]+)$/i, {
      message: "cron must be a 5-field standard cron expression",
    })
    .optional()
    .default(DEFAULT_CRON),
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
  );

  if (!scheduled.ok) {
    return NextResponse.json(
      { ok: false, message: scheduled.message },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    cronExpression: parsed.data.cron,
    retries: parsed.data.retries,
    scheduleId: scheduled.scheduleId,
    jobPath: "/api/jobs/advance-day",
  });
}
