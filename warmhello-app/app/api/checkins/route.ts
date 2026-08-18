import { NextResponse } from "next/server";
import { z } from "zod";
import { createCheckInSession } from "@/lib/checkins";
import { getSubscriberSession } from "@/lib/subscriber-session";
import { prisma } from "@/lib/prisma";

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

  const parsed = bodySchema.parse(await request.json());

  if (!sessionSubscriberId || sessionSubscriberId !== parsed.subscriberId) {
    return NextResponse.json(
      { ok: false, message: "You are not authorized to create check-ins for this subscriber." },
      { status: 403 },
    );
  }

  if (prisma) {
    const senior = await prisma.senior.findUnique({
      where: { id: parsed.seniorId },
      select: { subscriberId: true },
    });
    if (!senior || senior.subscriberId !== parsed.subscriberId) {
      return NextResponse.json(
        { ok: false, message: "Senior record was not found for this subscriber." },
        { status: 404 },
      );
    }
  }

  const result = await createCheckInSession({
    subscriberId: parsed.subscriberId,
    seniorId: parsed.seniorId,
    scheduledFor: parsed.scheduledFor ? new Date(parsed.scheduledFor) : undefined,
    requireSmsSuccess: true,
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
