import { NextResponse } from "next/server";
import { z } from "zod";
import { createCheckoutSession } from "@/lib/stripe";

const bodySchema = z.object({
  customerEmail: z.string().email(),
  subscriberId: z.string().min(1),
});

export async function POST(request: Request) {
  const parsed = bodySchema.parse(await request.json());
  const result = await createCheckoutSession(parsed);

  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json(result);
}
