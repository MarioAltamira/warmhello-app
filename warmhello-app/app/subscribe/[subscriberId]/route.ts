import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createCheckoutSession } from "@/lib/stripe";
import { env } from "@/lib/env";

type RouteContext = {
  params: Promise<{
    subscriberId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { subscriberId } = await context.params;

  if (!prisma) {
    return NextResponse.redirect(`${env.APP_URL}/dashboard?checkout=unavailable`);
  }

  const subscriber = await prisma.subscriber.findUnique({
    where: { id: subscriberId },
    select: {
      id: true,
      email: true,
    },
  });

  if (!subscriber) {
    return NextResponse.redirect(`${env.APP_URL}/dashboard?checkout=missing-subscriber`);
  }

  const result = await createCheckoutSession({
    subscriberId: subscriber.id,
    customerEmail: subscriber.email,
  });

  if (!result.ok || !result.url) {
    return NextResponse.redirect(`${env.APP_URL}/dashboard?checkout=unavailable`);
  }

  return NextResponse.redirect(result.url);
}
