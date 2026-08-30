import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  getSubscriberSessionBootId,
  signSessionSubscriberId,
  subscriberSessionBootCookieName,
  subscriberSessionCookieName,
  subscriberSessionCookieOptions,
  subscriberSessionPresenceCookieName,
  subscriberSessionPresenceCookieOptions,
} from "@/lib/subscriber-session";
import { parseJsonBody } from "@/lib/zod-parse";
import {
  extractIpFromRequest,
  extractUserAgentFromRequest,
  recordSecurityAudit,
} from "@/lib/security-audit";
import { cookies } from "next/headers";

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

  const ipAddress = extractIpFromRequest(request);
  const userAgent = extractUserAgentFromRequest(request);

  const subscriber = parsed.data.subscriberId
    ? await prisma.subscriber.findUnique({
        where: { id: parsed.data.subscriberId },
      })
    : await prisma.subscriber.findUnique({
        where: { email: parsed.data.email },
      });

  if (!subscriber) {
    await recordSecurityAudit({
      kind: "MAGIC_LINK_FAILED_NO_SUBSCRIBER",
      email: parsed.data.email ?? undefined,
      ipAddress,
      userAgent,
      detail: {
        sessionLoginAttempt: true,
        bySubscriberId: Boolean(parsed.data.subscriberId),
        byEmail: Boolean(parsed.data.email),
      },
    });
    return NextResponse.json(
      {
        ok: false,
        message: "We could not find a subscriber with that email yet. Create the household first.",
      },
      { status: 404 },
    );
  }

  await recordSecurityAudit({
    kind: "SESSION_LOGIN_EMAIL_ONLY",
    subscriberId: subscriber.id,
    email: subscriber.email,
    ipAddress,
    userAgent,
    redirectTarget: "/dashboard",
  });

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
  response.cookies.set(
    subscriberSessionPresenceCookieName,
    "1",
    subscriberSessionPresenceCookieOptions,
  );

  return response;
}

export async function DELETE(request: Request) {
  const ipAddress = extractIpFromRequest(request);
  const userAgent = extractUserAgentFromRequest(request);
  let subscriberId: string | null = null;

  try {
    const jar = await cookies();
    const signedCookie = jar.get(subscriberSessionCookieName)?.value ?? null;
    if (signedCookie) {
      const { verifySigned } = await import("@/lib/subscriber-session");
      subscriberId = verifySigned(signedCookie);
    }
  } catch {
    subscriberId = null;
  }

  if (subscriberId) {
    try {
      const sub = await prisma?.subscriber.findUnique({
        where: { id: subscriberId },
        select: { id: true, email: true },
      });
      await recordSecurityAudit({
        kind: "SESSION_LOGOUT",
        subscriberId: sub?.id,
        email: sub?.email ?? undefined,
        ipAddress,
        userAgent,
      });
    } catch {
      // ignore audit errors in logout path
    }
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(subscriberSessionCookieName, "", {
    ...subscriberSessionCookieOptions,
    maxAge: 0,
  });
  response.cookies.set(subscriberSessionBootCookieName, "", {
    ...subscriberSessionCookieOptions,
    maxAge: 0,
  });
  response.cookies.set(subscriberSessionPresenceCookieName, "", {
    ...subscriberSessionPresenceCookieOptions,
    maxAge: 0,
  });
  return response;
}
