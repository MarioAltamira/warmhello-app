import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createCheckoutSession } from "@/lib/stripe";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ subscriberId: string }> },
) {
  const { subscriberId } = await params;

  if (!prisma) {
    return NextResponse.json(
      { ok: false, message: "Database is not configured yet." },
      { status: 400 },
    );
  }

  try {
    const subscriber = await prisma.subscriber.findUnique({
      where: { id: subscriberId },
      select: { id: true, email: true },
    });

    if (!subscriber) {
      return NextResponse.json(
        { ok: false, message: "Subscriber was not found." },
        { status: 404 },
      );
    }

    const result = await createCheckoutSession({
      customerEmail: subscriber.email,
      subscriberId: subscriber.id,
    });

    if (!result.ok) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { ok: false, message: "Database is not reachable right now." },
      { status: 400 },
    );
  }
}
