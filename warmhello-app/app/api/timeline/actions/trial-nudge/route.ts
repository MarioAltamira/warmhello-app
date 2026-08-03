import { NextResponse } from "next/server";
import { getSubscriberSession } from "@/lib/subscriber-session";
import { sendTrialNudgeEmail } from "@/lib/trial-emails";

export async function POST() {
  const { subscriberId } = await getSubscriberSession();
  if (!subscriberId) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  const result = await sendTrialNudgeEmail(subscriberId);

  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json(result);
}

