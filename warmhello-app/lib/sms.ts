import { env } from "@/lib/env";

type SmsResult =
  | { ok: true; sid: string | null }
  | { ok: false; message: string };

export async function sendSms(to: string, body: string): Promise<SmsResult> {
  if (!env.TELNYX_API_KEY || !env.TELNYX_FROM_NUMBER) {
    return {
      ok: false,
      message: "SMS is not configured yet. Add Telnyx credentials to enable delivery.",
    };
  }

  const response = await fetch("https://api.telnyx.com/v2/messages", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.TELNYX_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.TELNYX_FROM_NUMBER,
      to,
      text: body,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    return { ok: false, message: text || "Telnyx rejected the SMS request." };
  }

  const data = (await response.json()) as {
    data?: {
      id?: string;
    };
  };

  return { ok: true, sid: data.data?.id ?? null };
}
