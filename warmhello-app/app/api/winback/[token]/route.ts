import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWinbackToken } from "@/lib/winback-token";
import { env } from "@/lib/env";
import {
  signSessionSubscriberId,
  getSubscriberSessionBootId,
  subscriberSessionCookieName,
  subscriberSessionBootCookieName,
  subscriberSessionPresenceCookieName,
  subscriberSessionCookieOptions,
  subscriberSessionPresenceCookieOptions,
} from "@/lib/subscriber-session";

function errorHtml(message: string) {
  return new NextResponse(
    `<!doctype html><html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>Warm-Hello</title></head><body style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Noto Sans, Apple Color Emoji, Segoe UI Emoji; padding: 32px; max-width: 640px; margin: 0 auto;"><h1>Warm-Hello</h1><p>${message}</p></body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  const verified = verifyWinbackToken(token);

  if (!verified.ok) {
    return errorHtml(
      verified.message === "Token expired."
        ? "This offer link has expired. Please contact sales@warm-hello.com if you'd still like to resubscribe."
        : "This link is invalid. Please contact sales@warm-hello.com for help.",
    );
  }

  if (!prisma) {
    return errorHtml("Database is not configured yet.");
  }

  const subscriber = await prisma.subscriber.findUnique({
    where: { id: verified.subscriberId },
    select: {
      id: true,
      subscriptionStatus: true,
      unsubscribedAt: true,
      winbackEmailSentAt: true,
    },
  });

  if (!subscriber || subscriber.unsubscribedAt) {
    return errorHtml("This offer link is no longer valid.");
  }

  const redirectUrl =
    subscriber.subscriptionStatus === "PAST_DUE" && subscriber.winbackEmailSentAt
      ? `${env.APP_URL}/subscribe/${subscriber.id}?offer=winback25`
      : `${env.APP_URL}/dashboard`;

  const response = NextResponse.redirect(redirectUrl);
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
  response.cookies.set(subscriberSessionPresenceCookieName, "1", subscriberSessionPresenceCookieOptions);

  return response;
}
