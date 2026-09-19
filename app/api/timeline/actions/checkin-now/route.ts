import { NextResponse } from "next/server";
import { createCheckInSession } from "@/lib/checkins";
import { prisma } from "@/lib/prisma";
import { getSubscriberSession } from "@/lib/subscriber-session";
import { checkRateLimit, formatRetrySeconds } from "@/lib/rate-limit";
import { extractIpFromRequest } from "@/lib/security-audit";

export async function POST(request: Request) {
  const { subscriberId } = await getSubscriberSession();
  if (!subscriberId) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  const ip = extractIpFromRequest(request) ?? "unknown";
  const subRl = checkRateLimit(`timeline:checkin-now:sub:${subscriberId}`, 5 * 60 * 1000, 6);
  if (!subRl.allowed) {
    return NextResponse.json(
      { ok: false, message: `Too many check-in attempts. Please try again in ${formatRetrySeconds(subRl.retryAfterMs)}.` },
      { status: 429 },
    );
  }
  const ipRl = checkRateLimit(`timeline:checkin-now:ip:${ip}`, 15 * 60 * 1000, 30);
  if (!ipRl.allowed) {
    return NextResponse.json(
      { ok: false, message: `Too many check-in attempts from this location. Please try again in ${formatRetrySeconds(ipRl.retryAfterMs)}.` },
      { status: 429 },
    );
  }

  if (!prisma) {
    return NextResponse.json({ ok: false, message: "Database is not configured yet." }, { status: 400 });
  }

  const senior = await prisma.senior.findFirst({
    where: { subscriberId, active: true },
    orderBy: { createdAt: "asc" },
  });

  if (!senior) {
    return NextResponse.json({ ok: false, message: "Senior record not found." }, { status: 400 });
  }

  const result = await createCheckInSession({
    subscriberId,
    seniorId: senior.id,
    scheduledFor: new Date(),
    requireSmsSuccess: false,
    skipRemindersAndEscalation: true,
  });

  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    token: result.checkIn.token,
    scheduledFor: result.checkIn.scheduledFor,
  });
}

