import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe";

function html(body: string) {
  return new NextResponse(`<!doctype html><html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>Warm-Hello</title></head><body style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Noto Sans, Apple Color Emoji, Segoe UI Emoji; padding: 32px;">${body}</body></html>`, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export async function GET(
  _request: Request,
  context: {
    params: Promise<{ token: string }>;
  },
) {
  const { token } = await context.params;
  const verified = verifyUnsubscribeToken(token);

  if (!verified.ok) {
    return html(`<h1>Unsubscribe</h1><p>${verified.message}</p>`);
  }

  if (!prisma) {
    return html(`<h1>Unsubscribe</h1><p>Database is not configured yet.</p>`);
  }

  try {
    await prisma.subscriber.update({
      where: { id: verified.subscriberId },
      data: { unsubscribedAt: new Date() },
    });
  } catch {
    return html(`<h1>Unsubscribe</h1><p>We could not process this request right now.</p>`);
  }

  return html(
    `<h1>You're unsubscribed</h1><p>You will no longer receive trial emails or SMS check-ins from Warm-Hello.</p>`,
  );
}

