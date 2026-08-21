import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { normalizePhone } from "@/lib/phone";
import { sendSms } from "@/lib/sms";
import { LEGAL_ENTITY_PLACEHOLDERS as E } from "@/lib/legal-placeholders";

function extractInboundMessage(body: unknown) {
  const payload =
    (body as any)?.data?.payload ??
    (body as any)?.payload ??
    (body as any)?.data ??
    body;
  const text =
    payload?.text ??
    payload?.body ??
    payload?.message ??
    payload?.message?.text ??
    "";
  const from =
    payload?.from?.phone_number ??
    payload?.from?.phoneNumber ??
    payload?.from ??
    "";
  const toCandidate =
    payload?.to?.[0]?.phone_number ??
    payload?.to?.[0]?.phoneNumber ??
    payload?.to?.phone_number ??
    payload?.to?.phoneNumber ??
    payload?.to ??
    "";
  const to = typeof toCandidate === "string" ? toCandidate : "";
  const providerMessageId =
    payload?.id ?? (body as any)?.data?.id ?? (body as any)?.id ?? null;
  const kind =
    (body as any)?.data?.event_type ??
    (body as any)?.event_type ??
    payload?.event_type ??
    null;

  return {
    text: String(text ?? "").trim(),
    from: normalizePhone(String(from ?? "").trim()),
    to: normalizePhone(String(to ?? "").trim()),
    providerMessageId: providerMessageId ? String(providerMessageId) : null,
    kind: kind ? String(kind) : null,
  };
}

const STOP_KEYWORDS = ["STOP", "STOPALL", "UNSUBSCRIBE", "CANCEL", "END", "QUIT"] as const;
const HELP_KEYWORDS = ["HELP", "INFO"] as const;
const START_KEYWORDS = ["START", "YES", "UNSTOP"] as const;

const RETAINED_UNTIL_YEARS = 6;

function tombstoneRetainedUntil(anchor: Date = new Date()): Date {
  const d = new Date(anchor);
  d.setUTCFullYear(d.getUTCFullYear() + RETAINED_UNTIL_YEARS);
  return d;
}

function helpReply(): string {
  const entity = E.LEGAL_ENTITY_NAME;
  const support = E.SUPPORT_EMAIL;
  return [
    `${entity} Warm-Hello check-ins. Reply STOP to opt out of all messages. Msg & data rates may apply. Contact: ${support} | warm-hello.com`,
  ].join(" ");
}

async function upsertTombstone(params: {
  phoneE164: string;
  optInAt?: Date;
  optOutAt?: Date;
  reOptInAppend?: Date;
  reason?: string;
}) {
  if (!prisma) return;
  const retainedUntil = tombstoneRetainedUntil(params.optOutAt ?? params.optInAt ?? new Date());
  const existing = await prisma.smsConsentTombstone.findUnique({
    where: { phoneE164: params.phoneE164 },
  });
  if (!existing) {
    await prisma.smsConsentTombstone.create({
      data: {
        phoneE164: params.phoneE164,
        optInAt: params.optInAt ?? null,
        optOutAt: params.optOutAt ?? null,
        reOptInAt: params.reOptInAppend ? [params.reOptInAppend] : [],
        reason: params.reason ?? null,
        retainedUntil,
      },
    });
    return;
  }
  const reOptInAt = params.reOptInAppend
    ? Array.from(new Set([...(existing.reOptInAt ?? []), params.reOptInAppend]))
    : existing.reOptInAt;
  await prisma.smsConsentTombstone.update({
    where: { phoneE164: params.phoneE164 },
    data: {
      optInAt: params.optInAt ?? existing.optInAt,
      optOutAt: params.optOutAt ?? existing.optOutAt,
      reOptInAt,
      reason: params.reason ?? existing.reason,
      retainedUntil,
    },
  });
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const providedSecret = url.searchParams.get("secret") ?? "";
  const expectedSecret = env.TELNYX_WEBHOOK_SECRET ?? "";
  if (expectedSecret) {
    try {
      const a = Buffer.from(providedSecret, "utf8");
      const b = Buffer.from(expectedSecret, "utf8");
      if (a.length !== b.length || !timingSafeEqual(a, b)) {
        return NextResponse.json(
          { ok: false, message: "Unauthorized webhook request." },
          { status: 401 },
        );
      }
    } catch {
      return NextResponse.json(
        { ok: false, message: "Unauthorized webhook request." },
        { status: 401 },
      );
    }
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ ok: false, message: "Invalid JSON payload." }, { status: 400 });
  }

  const { text, from, to, providerMessageId, kind } = extractInboundMessage(body);
  if (!text || !from || !to) {
    return NextResponse.json(
      { ok: false, message: "Missing inbound message fields." },
      { status: 400 },
    );
  }

  let subscriberId: string | null = null;
  let seniorId: string | null = null;
  let seniorRow: { id: string; subscriberId: string; smsOptedOut: boolean } | null = null;

  try {
    const senior = await prisma?.senior.findFirst({
      where: { phoneNumber: from },
      select: { id: true, subscriberId: true, smsOptedOut: true },
    });
    if (senior) {
      subscriberId = senior.subscriberId;
      seniorId = senior.id;
      seniorRow = senior;
    }
  } catch {
    // ignore
  }

  try {
    await prisma?.smsLog.create({
      data: {
        direction: "IN",
        status: "RECEIVED",
        provider: "telnyx",
        providerMessageId,
        kind,
        fromNumber: from,
        toNumber: to,
        body: text,
        subscriberId,
        seniorId,
      },
    });
  } catch {
    // ignore
  }

  const keyword = text.toUpperCase();
  const isStop = STOP_KEYWORDS.some((k) => keyword === k);
  const isHelp = !isStop && HELP_KEYWORDS.some((k) => keyword === k);
  const isStart = !isStop && !isHelp && START_KEYWORDS.some((k) => keyword === k);

  let keywordReply: string | null = null;

  if (isStop) {
    const now = new Date();
    try {
      if (seniorRow) {
        await prisma?.senior.update({
          where: { id: seniorRow.id },
          data: { smsOptedOut: true, smsOptedOutAt: now },
        });
      }
      await upsertTombstone({
        phoneE164: from,
        optOutAt: now,
        reason: `STOP/UNSUBSCRIBE keyword inbound SMS`,
      });
    } catch {
      // ignore
    }
    keywordReply =
      "You have opted out of Warm-Hello SMS check-ins. No further messages will be sent to this number. Reply START to re-enable.";
  } else if (isHelp) {
    keywordReply = helpReply();
  } else if (isStart) {
    const now = new Date();
    try {
      if (seniorRow) {
        await prisma?.senior.update({
          where: { id: seniorRow.id },
          data: { smsOptedOut: false, smsOptedOutAt: null },
        });
      }
      await upsertTombstone({
        phoneE164: from,
        optInAt: now,
        reOptInAppend: now,
        reason: `START/UNSTOP keyword inbound SMS`,
      });
    } catch {
      // ignore
    }
    keywordReply =
      "Welcome back. You have opted in to Warm-Hello SMS check-ins. Msg & data rates may apply. Reply STOP to opt out, HELP for info.";
  }

  if (keywordReply && env.TELNYX_API_KEY && env.TELNYX_FROM_NUMBER) {
    try {
      await sendSms(from, keywordReply, {
        subscriberId,
        seniorId,
        kind:
          isStop ? "sms_compliance_stop_reply" :
          isStart ? "sms_compliance_start_reply" :
          "sms_compliance_help_reply",
      });
    } catch {
      // ignore
    }
  }

  return NextResponse.json({ ok: true, handled: isStop || isHelp || isStart });
}
