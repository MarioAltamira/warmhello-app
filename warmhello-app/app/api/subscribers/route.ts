import { NextResponse } from "next/server";
import { z } from "zod";
import { createHousehold } from "@/lib/households";

const bodySchema = z.object({
  subscriber: z.object({
    fullName: z.string().min(2),
    email: z.string().email(),
    phoneNumber: z.string().min(7),
  }),
  senior: z.object({
    firstName: z.string().min(2),
    lastName: z.string().min(2),
    phoneNumber: z.string().min(7),
    timezone: z.string().min(2),
    checkInHour: z.number().int().min(0).max(23),
    secondAttemptHours: z.number().int().min(1).max(3),
  }),
  primaryContact: z.object({
    fullName: z.string().min(2),
    relationship: z.string().min(2),
    phoneNumber: z.string().min(7),
  }),
});

export async function POST(request: Request) {
  const parsed = bodySchema.parse(await request.json());
  const result = await createHousehold(parsed);

  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    household: result.household,
    firstCheckIn: result.firstCheckIn,
    firstCheckInMessage: result.firstCheckInMessage,
  });
}
