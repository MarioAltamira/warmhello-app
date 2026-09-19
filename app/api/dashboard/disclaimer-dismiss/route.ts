import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSubscriberSession } from "@/lib/subscriber-session";
import { parseJsonBody } from "@/lib/zod-parse";

const bodySchema = z.object({
  subscriberId: z.string().min(1),
});

export async function POST(request: Request) {
  const { subscriberId: sessionSubscriberId, sessionExpired } = await getSubscriberSession();
  if (!sessionSubscriberId || sessionExpired) {
    return NextResponse.json(
      { ok: false, message: "Not signed in." },
      { status: 401 },
    );
  }

  const parsed = await parseJsonBody(request, bodySchema);
  if (!parsed.ok) return parsed.response;

  const targetId = parsed.data.subscriberId;
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
