import { env } from "@/lib/env";
import { normalizePhone } from "@/lib/phone";
import { prisma } from "@/lib/prisma";

type SmsResult =
  | { ok: true; sid: string | null }
  | { ok: false; message: string };

const STOP_HELP =
  "Reply STOP to opt out. Reply HELP for help. Msg & data rates may apply.";

function buildIdentitySms(): string {
  return `Warm-Hello: You're all set! You'll receive scheduled check-in messages. ${STOP_HELP}`;
}

export async function sendSeniorOnboardingSmsSequence(params: {
  to: string;
  seniorName?: string;
  checkInUrl?: string;
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

  return { ok: identity.ok, identity, checkIn: null };
}

const COMPLIANCE_REPLY_KINDS: ReadonlySet<string> = new Set([
  "sms_compliance_stop_reply",
  "sms_compliance_help_reply",
  "sms_compliance_start_reply",
]);

async function isPhoneSuppressed(normalizedTo: string, seniorId?: string | null): Promise<{ suppressed: boolean; reason?: string }> {
  if (!normalizedTo) return { suppressed: false };
  try {
    const tombstone = await prisma?.smsConsentTombstone.findUnique({
      where: { phoneE164: normalizedTo },
      select: { optOutAt: true },
    });
    if (tombstone?.optOutAt) {
      return { suppressed: true, reason: "SmsConsentTombstone opt-out recorded" };
    }
    if (seniorId) {
      const senior = await prisma?.senior.findUnique({
        where: { id: seniorId },
        select: { smsOptedOut: true },
      });
      if (senior?.smsOptedOut) {
        return { suppressed: true, reason: "Senior.smsOptedOut=true (STOP opt-out)" };
      }
    }
  } catch {
    // ignore — let send attempt proceed if DB is unreachable
  }
  return { suppressed: false };
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

  const isComplianceReply = typeof meta?.kind === "string" && COMPLIANCE_REPLY_KINDS.has(meta.kind);
  if (!isComplianceReply) {
    const sup = await isPhoneSuppressed(normalizedTo, meta?.seniorId ?? null);
    if (sup.suppressed) {
      try {
        await prisma?.smsLog.create({
          data: {
            direction: "OUT",
            status: "FAILED",
            provider: "telnyx",
            kind: meta?.kind ?? null,
            fromNumber: env.TELNYX_FROM_NUMBER,
            toNumber: normalizedTo,
            body: `[SUPPRESSED: ${sup.reason ?? "opt-out list"}] ${body}`.slice(0, 10000),
            subscriberId: meta?.subscriberId ?? null,
            seniorId: meta?.seniorId ?? null,
            checkInId: meta?.checkInId ?? null,
          },
        });
      } catch {
        // ignore
      }
      return {
        ok: false,
        message: `SMS suppressed (${sup.reason ?? "opt-out list"}). Number: ${normalizedTo}`,
      };
    }
  }

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

