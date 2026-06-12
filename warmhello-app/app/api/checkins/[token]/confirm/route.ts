import { NextResponse } from "next/server";
import { confirmCheckInToken } from "@/lib/checkins";

export async function POST(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  const result = await confirmCheckInToken(token);

  return NextResponse.json(result, {
    status: result.ok ? 200 : 404,
  });
}
