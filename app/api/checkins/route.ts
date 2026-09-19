import { NextResponse } from "next/server";
import { z } from "zod";
import { createCheckInSession } from "@/lib/checkins";
import { getSubscriberSession } from "@/lib/subscriber-session";
import { prisma } from "@/lib/prisma";
import { parseJsonBody } from "@/lib/zod-parse";
import { checkRateLimit, formatRetrySeconds } from "@/lib/rate-limit";
import { extractIpFromRequest } from "@/lib/security-audit";

const bodySchema = z.object({
  subscriberId: z.string().min(1),
  seniorId: z.string().min(1),
  scheduledFor: z.string().datetime().optional(),
});

export async function POST(request: Request) {
  const { subscriberId: sessionSubscriberId, sessionExpired } = await getSubscriberSession();
  if (sessionExpired) {
    return NextResponse.json(
      { ok: false, message: "Your session expired. Please log in again." },
      { status: 401 },
    );
  }

  const ip = extractIpFromRequest(request) ?? "unknown";
  if (sessionSubscriberId) {
    const subRl = checkRateLimit(`checkins:create:sub:${sessionSubscriberId}`, 15 * 60 * 1000, 30);
    if (!subRl.allowed) {
      return NextResponse.json(
        { ok: false, message: `Too many check-in creations. Please try again in ${formatRetrySeconds(subRl.retryAfterMs)}.` },
        { status: 429 },
      );
    }
  }
  const ipRl = checkRateLimit(`checkins:create:ip:${ip}`, 15 * 60 * 1000, 60);
  if (!ipRl.allowed) {
    return NextResponse.json(
      { ok: false, message: `Too many check-in creations from this location. Please try again in ${formatRetrySeconds(ipRl.retryAfterMs)}.` },
      { status: 429 },
    );
  }

  const parsed = await parseJsonBody(request, bodySchema);
  if (!parsed.ok) return parsed.response;

  if (!sessionSubscriberId || sessionSubscriberId !== parsed.data.subscriberId) {
    return NextResponse.json(
      { ok: false, message: "You are not authorized to create check-ins for this subscriber." },
      { status: 403 },
    );
  }

  if (prisma) {
    const senior = await prisma.senior.findUnique({
      where: { id: parsed.data.seniorId },
      select: { subscriberId: true },
    });
    if (!senior || senior.subscriberId !== parsed.data.subscriberId) {
      return NextResponse.json(
        { ok: false, message: "Senior record was not found for this subscriber." },
        { status: 404 },
      );
    }
  }

  const result = await createCheckInSession({
    subscriberId: parsed.data.subscriberId,
    seniorId: parsed.data.seniorId,
    scheduledFor: parsed.data.scheduledFor ? new Date(parsed.data.scheduledFor) : undefined,
    requireSmsSuccess: true,
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
