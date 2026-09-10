import { NextResponse } from "next/server";
import { getSubscriberSession } from "@/lib/subscriber-session";
import { sendTrialWelcomeEmail } from "@/lib/trial-emails";
import { checkRateLimit, formatRetrySeconds } from "@/lib/rate-limit";
import { extractIpFromRequest } from "@/lib/security-audit";

export async function POST(request: Request) {
  const { subscriberId } = await getSubscriberSession();
  if (!subscriberId) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  const rl = checkRateLimit(`timeline:trial-welcome:sub:${subscriberId}`, 60 * 60 * 1000, 3);
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, message: `Too many email resends. Please try again in ${formatRetrySeconds(rl.retryAfterMs)}.` },
      { status: 429 },
    );
  }

  const result = await sendTrialWelcomeEmail(subscriberId);

  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json(result);
}

