import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyUnsubscribeToken, signUnsubscribeToken } from "@/lib/unsubscribe";

function html(body: string) {
  return new NextResponse(`<!doctype html><html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>Warm-Hello · Unsubscribe</title></head><body style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Noto Sans, Apple Color Emoji, Segoe UI Emoji; padding: 32px; max-width: 640px; margin: 0 auto;">${body}</body></html>`, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

function confirmPageHtml({
  token,
  subscriberLabel,
  csrfToken,
}: {
  token: string;
  subscriberLabel: string;
  csrfToken: string;
}) {
  const safeLabel = subscriberLabel
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
  return `
    <h1>Unsubscribe from Warm-Hello trial emails?</h1>
    <p style="color:#475569;">${safeLabel ? `For ${safeLabel}. ` : ""}You will no longer receive trial-engagement, welcome, or check-in reminder emails.</p>
    <form method="POST" style="display:flex; gap:12px; align-items:center; flex-wrap:wrap; margin-top:24px;">
      <input type="hidden" name="csrf" value="${csrfToken}" />
      <button type="submit" style="background:#0f172a; color:#fff; border:0; border-radius:10px; padding:12px 18px; font-weight:600; cursor:pointer;">Yes, unsubscribe me</button>
      <a href="/" style="color:#0f172a; text-decoration:underline; padding:12px 6px;">Cancel · go back</a>
    </form>
    <p style="font-size:12px; color:#64748b; margin-top:24px;">This link is single-use and expires after 30 days.</p>
  `;
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

  let subscriberLabel = "";
  try {
    const row = await prisma.subscriber.findUnique({
      where: { id: verified.subscriberId },
      select: { fullName: true, email: true },
    });
    if (row) {
      subscriberLabel = row.fullName
        ? `${row.fullName} <${row.email}>`
        : row.email ?? "";
    }
  } catch {
    /* swallow */
  }

  const csrfToken = signUnsubscribeToken(verified.subscriberId);
  return html(confirmPageHtml({ token, subscriberLabel, csrfToken }));
}

export async function POST(
  request: Request,
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

  let csrf: string | null = null;
  try {
    const ct = request.headers.get("content-type") ?? "";
    if (ct.includes("application/x-www-form-urlencoded") || ct.includes("multipart/form-data")) {
      const form = await request.formData();
      const rawCsrf = form.get("csrf");
      csrf = rawCsrf && typeof rawCsrf === "string" ? rawCsrf : null;
    } else if (ct.includes("application/json")) {
      const body = await request.json();
      csrf = body && typeof (body as any).csrf === "string" ? (body as any).csrf : null;
    }
  } catch {
    csrf = null;
  }
  const csrfToken = csrf ?? "";
  const csrfVerified = verifyUnsubscribeToken(csrfToken);
  if (!csrfVerified.ok || csrfVerified.subscriberId !== verified.subscriberId) {
    return html(`<h1>Unsubscribe</h1><p>This confirmation page expired. Please reopen the link from your email and try again.</p>`);
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
    `<h1>You're unsubscribed</h1><p>You will no longer receive trial emails from Warm-Hello.</p>`,
  );
}
