import { NextResponse } from "next/server";
import { z } from "zod";
import { confirmCheckInToken } from "@/lib/checkins";

const bodySchema = z.object({
  mode: z.enum(["okay", "call_me"]).default("okay"),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
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
