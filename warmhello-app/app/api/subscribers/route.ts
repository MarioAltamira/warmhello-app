import { MAX_CONTACTS } from "@/lib/households";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createHousehold, updateHousehold } from "@/lib/households";
import { getSubscriberSession } from "@/lib/subscriber-session";
import { parseJsonBody } from "@/lib/zod-parse";

const BillingCurrencySchema = z.enum(["USD", "CAD"]);

const contactSchema = z.object({
  fullName: z.string().min(2),
  relationship: z.string().min(2),
  phoneNumber: z.string().min(7),
});

const bodySchema = z
  .object({
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
      active: z.boolean().default(true),
    }),
    primaryContact: contactSchema,
    additionalContacts: z.array(contactSchema).max(Math.max(0, MAX_CONTACTS - 1)).optional(),
  })
  .refine(
    (data) =>
      1 + ((data.additionalContacts?.length) ?? 0) <= MAX_CONTACTS,
    {
      path: ["additionalContacts"],
      message: `Up to ${MAX_CONTACTS} total emergency contacts are supported (1 primary + ${MAX_CONTACTS - 1} additional).`,
    },
  );

export async function POST(request: Request) {
  const parsed = await parseJsonBody(request, bodySchema);
  if (!parsed.ok) return parsed.response;
  const result = await createHousehold(parsed.data);

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
  const { subscriberId: sessionSubscriberId, sessionExpired } = await getSubscriberSession();
  if (sessionExpired) {
    return NextResponse.json(
      { ok: false, message: "Your session expired. Please log in again." },
      { status: 401 },
    );
  }

  const parsed = await parseJsonBody(request, bodySchema);
  if (!parsed.ok) return parsed.response;

  if (!parsed.data.subscriberId) {
    return NextResponse.json(
      { ok: false, message: "Subscriber ID is required to update a household." },
      { status: 400 },
    );
  }

  if (!sessionSubscriberId || sessionSubscriberId !== parsed.data.subscriberId) {
    return NextResponse.json(
      { ok: false, message: "You are not authorized to update this household." },
      { status: 403 },
    );
  }

  const result = await updateHousehold(parsed.data.subscriberId, parsed.data);

  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json(result);
}
