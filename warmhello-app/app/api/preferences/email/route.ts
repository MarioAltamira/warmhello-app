import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSubscriberSession } from "@/lib/subscriber-session";

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

  if (!prisma) {
    return NextResponse.json({ ok: false, message: "Database is not configured yet." }, { status: 400 });
  }

  const body = (await request.json()) as { emailOptedOut?: unknown };
  const emailOptedOut = Boolean(body?.emailOptedOut);

  await prisma.subscriber.update({
    where: { id: subscriberId },
    data: { unsubscribedAt: emailOptedOut ? new Date() : null },
  });

  return NextResponse.json({ ok: true });
}

