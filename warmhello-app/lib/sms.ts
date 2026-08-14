import { env } from "@/lib/env";
import { normalizePhone } from "@/lib/phone";
import { prisma } from "@/lib/prisma";

type SmsResult =
  | { ok: true; sid: string | null }
  | { ok: false; message: string };

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
          body,
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
