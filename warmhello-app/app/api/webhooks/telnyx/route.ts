import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { normalizePhone } from "@/lib/phone";

function extractInboundMessage(body: any) {
  const payload = body?.data?.payload ?? body?.payload ?? body?.data ?? body;
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
    payload?.id ?? body?.data?.id ?? body?.id ?? null;
  const kind =
    body?.data?.event_type ?? body?.event_type ?? payload?.event_type ?? null;

  return {
    text: String(text ?? "").trim(),
    from: normalizePhone(String(from ?? "").trim()),
    to: normalizePhone(String(to ?? "").trim()),
    providerMessageId: providerMessageId ? String(providerMessageId) : null,
    kind: kind ? String(kind) : null,
  };
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const providedSecret = url.searchParams.get("secret");
  if (env.TELNYX_WEBHOOK_SECRET && providedSecret !== env.TELNYX_WEBHOOK_SECRET) {
    return NextResponse.json({ ok: false, message: "Unauthorized webhook request." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ ok: false, message: "Invalid JSON payload." }, { status: 400 });
  }

  const { text, from, to, providerMessageId, kind } = extractInboundMessage(body);
  if (!text || !from || !to) {
    return NextResponse.json({ ok: false, message: "Missing inbound message fields." }, { status: 400 });
  }

  let subscriberId: string | null = null;
  let seniorId: string | null = null;

  try {
    const senior = await prisma?.senior.findFirst({
      where: { phoneNumber: from },
      select: { id: true, subscriberId: true },
    });
    if (senior) {
      subscriberId = senior.subscriberId;
      seniorId = senior.id;
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

  return NextResponse.json({ ok: true });
}

