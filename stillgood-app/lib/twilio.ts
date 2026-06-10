import twilio from "twilio";
import { env } from "@/lib/env";

let twilioClient: ReturnType<typeof twilio> | null = null;

function getTwilioClient() {
  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN) {
    return null;
  }

  twilioClient ??= twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
  return twilioClient;
}

export async function sendSms(to: string, body: string) {
  const client = getTwilioClient();
  if (!client || !env.TWILIO_PHONE_NUMBER) {
    return { ok: false as const, message: "Twilio is not configured." };
  }

  const message = await client.messages.create({
    to,
    from: env.TWILIO_PHONE_NUMBER,
    body,
  });

  return { ok: true as const, sid: message.sid };
}
