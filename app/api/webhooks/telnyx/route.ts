import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { normalizePhone } from "@/lib/phone";
import { sendSms } from "@/lib/sms";
import { LEGAL_ENTITY_PLACEHOLDERS as E } from "@/lib/legal-placeholders";
import {
  sendSmsOptOutConfirmationEmail,
  sendSmsOptInReenabledEmail,
} from "@/lib/trial-emails";

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
    payload?.from?.number ??
    payload?.from ??
    "";
  const toCandidate =
    payload?.to?.[0]?.phone_number ??
    payload?.to?.[0]?.phoneNumber ??
    payload?.to?.[0]?.number ??
    payload?.to?.phone_number ??
    payload?.to?.phoneNumber ??
    payload?.to?.number ??
    payload?.to ??
    "";
  const to = typeof toCandidate === "string" ? toCandidate : "";
  const providerMessageId =
    payload?.id ??
    payload?.message_id ??
    payload?.messageId ??
    (body as any)?.data?.id ??
    (body as any)?.data?.payload?.id ??
    (body as any)?.id ??
    null;
  const kind =
    (body as any)?.data?.event_type ??
    (body as any)?.event_type ??
    payload?.event_type ??
    payload?.type ??
    null;

  const eventMeta = {
    eventType: typeof kind === "string" ? kind : null,
    dlrt: {
      code: payload?.to?.[0]?.status?.code ?? payload?.status?.code ?? null,
      description:
        payload?.to?.[0]?.status?.description ??
        payload?.status?.description ??
        payload?.error?.code ??
        payload?.failure?.code ??
        null,
    },
    isStatusEvent: false as boolean,
  };
  const lowerKind = String(kind ?? "").toLowerCase();
  if (
    lowerKind.includes("message.delivered") ||
    lowerKind.includes("delivery") ||
    lowerKind.includes("message.finalized") ||
    lowerKind.includes("message.failed") ||
    lowerKind.includes("message.rejected") ||
    lowerKind.includes("undelivered")
  ) {
    eventMeta.isStatusEvent = true;
  }

  return {
    text: String(text ?? "").trim(),
    from: normalizePhone(String(from ?? "").trim()),
    to: normalizePhone(String(to ?? "").trim()),
    providerMessageId: providerMessageId ? String(providerMessageId) : null,
    kind: kind ? String(kind) : null,
    eventMeta,
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
  if (!expectedSecret) {
    if (!env.ALLOW_UNAUTHENTICATED_WEBHOOK_DEV) {
      return NextResponse.json(
        { ok: false, message: "Webhook is not configured." },
        { status: 503 },
      );
    }
  } else {
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

  const { text, from, to, providerMessageId, kind, eventMeta } = extractInboundMessage(body);

  let dlrtHandled = false;
  if (eventMeta.isStatusEvent && providerMessageId) {
    dlrtHandled = await tryHandleDlrtStatusUpdate({
      providerMessageId,
      eventMeta,
      text,
      from,
      to,
    });
    if (dlrtHandled) {
      return NextResponse.json({
        ok: true,
        handled: "dlrt-status-update",
        matched: true,
      });
    }
  }

  if (!text || !from || !to) {
    return NextResponse.json(
      { ok: eventMeta.isStatusEvent, message: eventMeta.isStatusEvent ? "DLRT event received but no matching SmsLog row found." : "Missing inbound message fields." },
      { status: eventMeta.isStatusEvent ? 200 : 400 },
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
    const optedOutAtLabel = now.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
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
    try {
      if (seniorRow) {
        const senior = await prisma?.senior.findUnique({
          where: { id: seniorRow.id },
          select: { firstName: true, lastName: true, phoneNumber: true },
        });
        const subscriber = await prisma?.subscriber.findUnique({
          where: { id: seniorRow.subscriberId },
          select: { id: true, email: true, unsubscribedAt: true },
        });
        if (senior && subscriber?.email && !subscriber.unsubscribedAt) {
          const seniorFullName =
            `${senior.firstName ?? ""} ${senior.lastName ?? ""}`.trim() ||
            `Senior ${seniorRow.id}`;
          const phoneDigits = (senior.phoneNumber || from || "").replace(/\D/g, "");
          const seniorPhoneLast4 = phoneDigits.slice(-4) || "0000";
          await sendSmsOptOutConfirmationEmail({
            subscriberId: subscriber.id,
            subscriberEmail: subscriber.email,
            seniorFullName,
            seniorPhoneLast4,
            optedOutAtLabel,
          }).catch(() => null);
        }
      }
    } catch {
      // best-effort only
    }
    keywordReply =
      "You have opted out of Warm-Hello SMS check-ins. No further messages will be sent to this number. Reply START to re-enable.";
  } else if (isHelp) {
    keywordReply = helpReply();
  } else if (isStart) {
    const now = new Date();
    const optedInAtLabel = now.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
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
    try {
      if (seniorRow) {
        const senior = await prisma?.senior.findUnique({
          where: { id: seniorRow.id },
          select: { firstName: true, lastName: true, phoneNumber: true },
        });
        const subscriber = await prisma?.subscriber.findUnique({
          where: { id: seniorRow.subscriberId },
          select: { id: true, email: true, unsubscribedAt: true },
        });
        if (senior && subscriber?.email && !subscriber.unsubscribedAt) {
          const seniorFullName =
            `${senior.firstName ?? ""} ${senior.lastName ?? ""}`.trim() ||
            `Senior ${seniorRow.id}`;
          const phoneDigits = (senior.phoneNumber || from || "").replace(/\D/g, "");
          const seniorPhoneLast4 = phoneDigits.slice(-4) || "0000";
          await sendSmsOptInReenabledEmail({
            subscriberId: subscriber.id,
            subscriberEmail: subscriber.email,
            seniorFullName,
            seniorPhoneLast4,
            optedInAtLabel,
          }).catch(() => null);
        }
      }
    } catch {
      // best-effort only
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

async function tryHandleDlrtStatusUpdate(params: {
  providerMessageId: string;
  eventMeta: {
    eventType: string | null;
    isStatusEvent: boolean;
    dlrt: { code: unknown; description: unknown };
  };
  text: string;
  from: string | null;
  to: string | null;
}): Promise<boolean> {
  if (!prisma) return false;
  try {
    const existing = await prisma.smsLog.findFirst({
      where: { providerMessageId: params.providerMessageId },
      select: {
        id: true,
        direction: true,
        status: true,
        providerMessageId: true,
        body: true,
        fromNumber: true,
        toNumber: true,
        subscriberId: true,
        seniorId: true,
        checkInId: true,
      },
      orderBy: { createdAt: "desc" },
    });
    if (!existing) return false;

    const code = params.eventMeta.dlrt.code == null
      ? null
      : String(params.eventMeta.dlrt.code);
    const desc = params.eventMeta.dlrt.description == null
      ? null
      : String(params.eventMeta.dlrt.description);
    const eventType = params.eventMeta.eventType ?? "unknown_event";

    const lower = eventType.toLowerCase();
    const isFailure =
      lower.includes("failed") ||
      lower.includes("undelivered") ||
      lower.includes("rejected") ||
      lower.includes("expired") ||
      (code != null && /(40010|40011|40013|40016|40017|40018|40024|40025|40028|40032|40040|40041|40043|40044|40045|40047|40048|40050|40051|40052|40054|40057|40058|40087|40200|40210|40300)/.test(code));

    const newStatus = isFailure ? "FAILED" : existing.status;
    const footer =
      "\n\n[DLRT: " +
      [
        `event=${eventType}`,
        code ? `code=${code}` : null,
        desc ? `desc=${desc}` : null,
      ].filter(Boolean).join(" | ") +
      ` | receivedAt=${new Date().toISOString()}]`;
    const newBody =
      existing.body.length + footer.length > 9000
        ? existing.body.slice(0, 9000 - footer.length) + footer
        : existing.body + footer;

    await prisma.smsLog.update({
      where: { id: existing.id },
      data: {
        status: newStatus,
        body: newBody,
      },
    });

    return true;
  } catch {
    return false;
  }
}
