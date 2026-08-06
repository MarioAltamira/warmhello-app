import { NextResponse } from "next/server";
import { z } from "zod";
import { createHousehold, updateHousehold } from "@/lib/households";

const BillingCurrencySchema = z.enum(["USD", "CAD"]);

const bodySchema = z.object({
  subscriberId: z.string().min(1).optional(),
  subscriber: z.object({
    fullName: z.string().min(2),
    email: z.string().email(),
    phoneNumber: z.string().min(7),
    billingCurrency: BillingCurrencySchema,
  }),
  senior: z.object({
    firstName: z.string().min(2),
    lastName: z.string().min(2),
    phoneNumber: z.string().min(7),
    timezone: z.string().min(2),
    checkInHour: z.number().int().min(0).max(23),
    checkInMinute: z
      .number()
      .int()
      .min(0)
      .max(45)
      .refine((value) => value % 15 === 0),
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

export async function PUT(request: Request) {
  const parsed = bodySchema.parse(await request.json());

  if (!parsed.subscriberId) {
    return NextResponse.json(
      { ok: false, message: "Subscriber ID is required to update a household." },
      { status: 400 },
    );
  }

  const result = await updateHousehold(parsed.subscriberId, parsed);

  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json(result);
}
