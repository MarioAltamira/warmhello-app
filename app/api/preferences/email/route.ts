import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSubscriberSession } from "@/lib/subscriber-session";
import { checkRateLimit, formatRetrySeconds } from "@/lib/rate-limit";
import { extractIpFromRequest } from "@/lib/security-audit";
import { parseJsonBody } from "@/lib/zod-parse";

const bodySchema = z.object({
  emailOptedOut: z.unknown().optional(),
});

export async function GET() {
  const { subscriberId } = await getSubscriberSession();
  if (!subscriberId) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  if (!prisma) {
    return NextResponse.json({ ok: false, message: "Database is not configured yet." }, { status: 400 });
  }

  const subscriber = await prisma.subscriber.findUnique({
    where: { id: subscriberId },
    select: { unsubscribedAt: true },
  });

  if (!subscriber) {
    return NextResponse.json({ ok: false, message: "Subscriber not found." }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    emailOptedOut: subscriber.unsubscribedAt !== null,
  });
}

export async function POST(request: Request) {
  const { subscriberId } = await getSubscriberSession();
  if (!subscriberId) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  const ip = extractIpFromRequest(request) ?? "unknown";
  const subRl = checkRateLimit(`preferences:email:sub:${subscriberId}`, 15 * 60 * 1000, 30);
  if (!subRl.allowed) {
    return NextResponse.json(
      { ok: false, message: `Too many preference changes. Please try again in ${formatRetrySeconds(subRl.retryAfterMs)}.` },
      { status: 429 },
    );
  }
  const ipRl = checkRateLimit(`preferences:email:ip:${ip}`, 15 * 60 * 1000, 60);
  if (!ipRl.allowed) {
    return NextResponse.json(
      { ok: false, message: `Too many preference changes from this location. Please try again in ${formatRetrySeconds(ipRl.retryAfterMs)}.` },
      { status: 429 },
    );
  }

  if (!prisma) {
    return NextResponse.json({ ok: false, message: "Database is not configured yet." }, { status: 400 });
  }

  const parsed = await parseJsonBody(request, bodySchema);
  if (!parsed.ok) return parsed.response;
  const emailOptedOut = Boolean(parsed.data.emailOptedOut);

  await prisma.subscriber.update({
    where: { id: subscriberId },
    data: { unsubscribedAt: emailOptedOut ? new Date() : null },
  });

  return NextResponse.json({ ok: true });
}

