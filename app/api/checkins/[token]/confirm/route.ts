import { NextResponse } from "next/server";
import { z } from "zod";
import { confirmCheckInToken } from "@/lib/checkins";
import { checkRateLimit, formatRetrySeconds } from "@/lib/rate-limit";
import { extractIpFromRequest } from "@/lib/security-audit";

const bodySchema = z.object({
  mode: z.enum(["okay", "call_me"]).default("okay"),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;

  const ip = extractIpFromRequest(request) ?? "unknown";
  const tokenRl = checkRateLimit(`checkins:confirm:token:${token}`, 5 * 60 * 1000, 6);
  if (!tokenRl.allowed) {
    return NextResponse.json(
      { ok: false, message: `Too many confirm attempts for this check-in. Please try again in ${formatRetrySeconds(tokenRl.retryAfterMs)}.` },
      { status: 429 },
    );
  }
  const ipRl = checkRateLimit(`checkins:confirm:ip:${ip}`, 15 * 60 * 1000, 30);
  if (!ipRl.allowed) {
    return NextResponse.json(
      { ok: false, message: `Too many confirm attempts from this location. Please try again in ${formatRetrySeconds(ipRl.retryAfterMs)}.` },
      { status: 429 },
    );
  }

  let mode: "okay" | "call_me" = "okay";
  try {
    const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
    if (parsed.success) mode = parsed.data.mode;
  } catch {
    // keep default "okay" for backwards-compat with older clients that send empty POST
  }
  const result = await confirmCheckInToken(token, mode);

  return NextResponse.json(result, {
    status: result.ok ? 200 : 404,
  });
}
