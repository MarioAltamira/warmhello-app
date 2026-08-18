import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyJobSecret } from "@/lib/qstash";
import { sendTrialNudgeEmail } from "@/lib/trial-emails";
import { parseJsonBody } from "@/lib/zod-parse";

const bodySchema = z.object({
  subscriberId: z.string().min(1),
});

export async function POST(request: Request) {
  if (!verifyJobSecret(request) && process.env.NODE_ENV === "production") {
    return NextResponse.json({ ok: false, message: "Unauthorized job request." }, { status: 401 });
  }

  const parsed = await parseJsonBody(request, bodySchema);
  if (!parsed.ok) return parsed.response;
  const result = await sendTrialNudgeEmail(parsed.data.subscriberId);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
