import { env } from "@/lib/env";
import { LEGAL_ENTITY_PLACEHOLDERS as E } from "@/lib/legal-placeholders";
import { normalizePhone } from "@/lib/phone";
import { prisma } from "@/lib/prisma";

type SmsResult =
  | { ok: true; sid: string | null }
  | { ok: false; message: string };

const STOP_HELP =
  "Reply STOP to opt out. Reply HELP for help or contact support. Msg & data rates may apply.";

function buildIdentitySms(): string {
  const entity = E.LEGAL_ENTITY_NAME;
  const address = E.CA_MAILING_ADDRESS;
  const support = E.SUPPORT_EMAIL;
  const lines: string[] = [entity];
  if (address && !address.includes("[REPLACE")) lines.push(address);
  lines.push(STOP_HELP);
  lines.push(`Contact: ${support} | warm-hello.com`);
  return lines.join("\n");
}

export async function sendSeniorOnboardingSmsSequence(params: {
  to: string;
  seniorName: string;
  checkInUrl: string;
  meta?: {
    subscriberId?: string | null;
    seniorId?: string | null;
    checkInId?: string | null;
  };
}): Promise<{ ok: boolean; identity: SmsResult; checkIn: SmsResult | null }> {
  const identity = await sendSms(params.to, buildIdentitySms(), {
    ...params.meta,
    kind: "onboarding_identity",
  });

  await new Promise((r) => setTimeout(r, 30000));

  let checkIn: SmsResult | null = null;
  if (identity.ok) {
    checkIn = await sendSms(
      params.to,
      `Hi ${params.seniorName} - it's time for your Warm-Hello check-in.\nTap I'm OK: ${params.checkInUrl}`,
      {
        ...params.meta,
        kind: "onboarding_checkin",
      },
    );
  }

  return { ok: identity.ok && (checkIn?.ok ?? true), identity, checkIn };
}

export async function sendSms(
  to: string,
  body: string,
  meta?: {
    subscriberId?: string | null;
    seniorId?: string | null;
    checkInId?: string | null;
    kind?: string | null;
  },
): Promise<SmsResult> {
  if (!env.TELNYX_API_KEY || !env.TELNYX_FROM_NUMBER) {
    return {
      ok: false,
      message: "SMS is not configured yet. Add Telnyx credentials to enable delivery.",
    };
  }

  const normalizedTo = normalizePhone(to);

  const response = await fetch("https://api.telnyx.com/v2/messages", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.TELNYX_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.TELNYX_FROM_NUMBER,
      to: normalizedTo,
      text: body,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    try {
      await prisma?.smsLog.create({
        data: {
          direction: "OUT",
          status: "FAILED",
          provider: "telnyx",
          kind: meta?.kind ?? null,
          fromNumber: env.TELNYX_FROM_NUMBER,
          toNumber: normalizedTo,
          body:
            body +
            "\n\n[FAILED: Telnyx rejected send] " +
            (text && text.length > 0 ? text.slice(0, 5000) : "(no error body from provider)"),
          subscriberId: meta?.subscriberId ?? null,
          seniorId: meta?.seniorId ?? null,
          checkInId: meta?.checkInId ?? null,
        },
      });
    } catch {
      // ignore
    }
    return { ok: false, message: text || "Telnyx rejected the SMS request." };
  }

  const data = (await response.json()) as {
    data?: {
      id?: string;
    };
  };

  try {
    await prisma?.smsLog.create({
      data: {
        direction: "OUT",
        status: "SENT",
        provider: "telnyx",
        providerMessageId: data.data?.id ?? null,
        kind: meta?.kind ?? null,
        fromNumber: env.TELNYX_FROM_NUMBER,
        toNumber: normalizedTo,
        body,
        subscriberId: meta?.subscriberId ?? null,
        seniorId: meta?.seniorId ?? null,
        checkInId: meta?.checkInId ?? null,
      },
    });
  } catch {
    // ignore
  }

  return { ok: true, sid: data.data?.id ?? null };
}
