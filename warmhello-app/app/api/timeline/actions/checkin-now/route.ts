import { NextResponse } from "next/server";
import { createCheckInSession } from "@/lib/checkins";
import { prisma } from "@/lib/prisma";
import { getSubscriberSession } from "@/lib/subscriber-session";

export async function POST() {
  const { subscriberId } = await getSubscriberSession();
  if (!subscriberId) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
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

