import { NextResponse } from "next/server";
import { z } from "zod";
import { createCheckInSession } from "@/lib/checkins";

const bodySchema = z.object({
  subscriberId: z.string().min(1),
  seniorId: z.string().min(1),
  scheduledFor: z.string().datetime().optional(),
});

export async function POST(request: Request) {
  const parsed = bodySchema.parse(await request.json());
  const result = await createCheckInSession({
    subscriberId: parsed.subscriberId,
    seniorId: parsed.seniorId,
    scheduledFor: parsed.scheduledFor ? new Date(parsed.scheduledFor) : undefined,
  });

  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    token: result.checkIn.token,
    scheduledFor: result.checkIn.scheduledFor,
  });
}
