import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSubscriberSession } from "@/lib/subscriber-session";

export async function POST(request: Request) {
  const { subscriberId: sessionSubscriberId, sessionExpired } = await getSubscriberSession();
  if (!sessionSubscriberId || sessionExpired) {
    return NextResponse.json(
      { ok: false, message: "Not signed in." },
      { status: 401 },
    );
  }

  let body: { subscriberId?: string } = {};
  try {
    body = (await request.json()) as { subscriberId?: string };
  } catch {
    body = {};
  }

  const targetId = body.subscriberId ?? sessionSubscriberId;
  if (targetId !== sessionSubscriberId) {
    return NextResponse.json(
      { ok: false, message: "Not authorized." },
      { status: 403 },
    );
  }

  if (!prisma) {
    return NextResponse.json({ ok: false, message: "Database unavailable." }, { status: 500 });
  }

  try {
    await prisma.subscriber.update({
      where: { id: sessionSubscriberId },
      data: { dashboardDisclaimerDismissedAt: new Date() },
    });
  } catch {
    return NextResponse.json({ ok: false, message: "Database unavailable." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
