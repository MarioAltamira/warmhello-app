import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  getSubscriberSessionBootId,
  signSessionSubscriberId,
  subscriberSessionBootCookieName,
  subscriberSessionCookieName,
  subscriberSessionCookieOptions,
} from "@/lib/subscriber-session";
import { parseJsonBody } from "@/lib/zod-parse";

const bodySchema = z
  .object({
    email: z.string().email().optional(),
    subscriberId: z.string().min(1).optional(),
  })
  .refine((value) => value.email || value.subscriberId, {
    message: "Email or subscriberId is required.",
  });

export async function POST(request: Request) {
  if (!prisma) {
    return NextResponse.json(
      { ok: false, message: "Database is not configured yet." },
      { status: 400 },
    );
  }

  const parsed = await parseJsonBody(request, bodySchema);
  if (!parsed.ok) return parsed.response;

  const subscriber = parsed.data.subscriberId
    ? await prisma.subscriber.findUnique({
        where: { id: parsed.data.subscriberId },
      })
    : await prisma.subscriber.findUnique({
        where: { email: parsed.data.email },
      });

  if (!subscriber) {
    return NextResponse.json(
      {
        ok: false,
        message: "We could not find a subscriber with that email yet. Create the household first.",
      },
      { status: 404 },
    );
  }

  const response = NextResponse.json({
    ok: true,
    subscriber: {
      id: subscriber.id,
      email: subscriber.email,
      fullName: subscriber.fullName,
    },
  });

  response.cookies.set(
    subscriberSessionCookieName,
    signSessionSubscriberId(subscriber.id),
    subscriberSessionCookieOptions,
  );
  response.cookies.set(
    subscriberSessionBootCookieName,
    getSubscriberSessionBootId(),
    subscriberSessionCookieOptions,
  );

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(subscriberSessionCookieName, "", {
    ...subscriberSessionCookieOptions,
    maxAge: 0,
  });
  response.cookies.set(subscriberSessionBootCookieName, "", {
    ...subscriberSessionCookieOptions,
    maxAge: 0,
  });
  return response;
}
