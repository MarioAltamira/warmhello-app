import { MAX_CONTACTS } from "@/lib/households";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createHousehold, updateHousehold } from "@/lib/households";
import { getSubscriberSession } from "@/lib/subscriber-session";
import { parseJsonBody } from "@/lib/zod-parse";
import { TOS_VERSION_CURRENT, PRIVACY_VERSION_CURRENT } from "@/lib/constants";

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
    caregiverAck: z.boolean().optional(),
    tosVersion: z.string().min(1).optional(),
    privacyVersion: z.string().min(1).optional(),
    seniorOperationalSmsConsent: z.boolean().optional(),
    marketingEmailConsent: z.boolean().optional(),
  })
  .refine(
    (data) =>
      1 + ((data.additionalContacts?.length) ?? 0) <= MAX_CONTACTS,
    {
      path: ["additionalContacts"],
      message: `Up to ${MAX_CONTACTS} total emergency contacts are supported (1 primary + ${MAX_CONTACTS - 1} additional).`,
    },
  );

function deriveClientMetadata(request: Request): { ipAddress: string | null; userAgent: string | null } {
  const headers = request.headers;
  const forwardedFor = headers.get("x-forwarded-for");
  const ipAddress =
    (forwardedFor ? forwardedFor.split(",")[0]?.trim() : null) ??
    headers.get("x-real-ip") ??
    null;
  const userAgent = headers.get("user-agent");
  return { ipAddress, userAgent };
}

export async function POST(request: Request) {
  const parsed = await parseJsonBody(request, bodySchema);
  if (!parsed.ok) return parsed.response;

  if (!parsed.data.caregiverAck) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Please confirm that you are authorized to provide the senior's contact details and acknowledge the non-emergency service disclaimer (Terms of Service · Privacy Policy checkbox required).",
      },
      { status: 400 },
    );
  }
  if (!parsed.data.seniorOperationalSmsConsent) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Senior SMS Check-In Consent must be confirmed before creating the household — you must be authorized to provide the senior's mobile number for check-in SMS.",
      },
      { status: 400 },
    );
  }

  const md = deriveClientMetadata(request);
  const tosVersion = parsed.data.tosVersion ?? TOS_VERSION_CURRENT;
  const privacyVersion = parsed.data.privacyVersion ?? PRIVACY_VERSION_CURRENT;
  const result = await createHousehold(parsed.data, {
    ipAddress: md.ipAddress,
    userAgent: md.userAgent ?? undefined,
    tosVersion,
    privacyVersion,
    seniorOperationalSmsConsent: Boolean(parsed.data.seniorOperationalSmsConsent),
    marketingEmailConsent: Boolean(parsed.data.marketingEmailConsent),
  });

  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    household: result.household,
    firstCheckInScheduledFor: result.firstCheckInScheduledFor,
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

  const md = deriveClientMetadata(request);
  const tosVersion = parsed.data.tosVersion ?? TOS_VERSION_CURRENT;
  const privacyVersion = parsed.data.privacyVersion ?? PRIVACY_VERSION_CURRENT;
  const result = await updateHousehold(parsed.data.subscriberId, parsed.data, {
    ipAddress: md.ipAddress,
    userAgent: md.userAgent ?? undefined,
    tosVersion,
    privacyVersion,
    seniorOperationalSmsConsent: Boolean(parsed.data.seniorOperationalSmsConsent),
    marketingEmailConsent: Boolean(parsed.data.marketingEmailConsent),
  });

  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json(result);
}
