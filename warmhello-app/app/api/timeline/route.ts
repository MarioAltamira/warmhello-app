import { NextResponse } from "next/server";
import { z } from "zod";
import { getSubscriberTimeline } from "@/lib/timeline";
import { getSubscriberSession } from "@/lib/subscriber-session";

const querySchema = z.object({
  days: z.coerce.number().int().min(1).max(30).optional(),
});

export async function GET(request: Request) {
  const { subscriberId } = await getSubscriberSession();
  if (!subscriberId) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  const url = new URL(request.url);
  const parsed = querySchema.parse({
    days: url.searchParams.get("days") ?? undefined,
  });

  const timeline = await getSubscriberTimeline(subscriberId, parsed.days ?? 7);
  return NextResponse.json({ ok: true, timeline });
}

