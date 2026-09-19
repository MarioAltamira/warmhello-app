import { NextResponse } from "next/server";
import { z } from "zod";
import { sendEmail } from "@/lib/email";
import { env } from "@/lib/env";
import { escapeHtml } from "@/lib/html-escape";
import { parseJsonBody } from "@/lib/zod-parse";
import {
  extractIpFromRequest,
  extractUserAgentFromRequest,
  recordSecurityAudit,
} from "@/lib/security-audit";
import {
  checkRateLimit,
  formatRetrySeconds,
} from "@/lib/rate-limit";

const bodySchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
  message: z.string().trim().min(10),
});

export async function POST(request: Request) {
  const parsed = await parseJsonBody(request, bodySchema);
  if (!parsed.ok) return parsed.response;

  const ipAddress = extractIpFromRequest(request);
  const userAgent = extractUserAgentFromRequest(request);
  const { email } = parsed.data;

  const perEmailLimit = checkRateLimit(
    `contact:email:${email}`,
    15 * 60_000,
    5,
  );
  if (!perEmailLimit.allowed) {
    await recordSecurityAudit({
      kind: "MAGIC_LINK_RATE_LIMITED",
      subscriberId: null,
      email,
      ipAddress,
      userAgent,
      detail: { route: "contact", per: "email" },
    });
    return NextResponse.json(
      {
        ok: false,
        message: `Too many contact form submissions for this email. Please wait ${formatRetrySeconds(
          perEmailLimit.retryAfterMs,
        )} and try again.`,
      },
      { status: 429 },
    );
  }

  const perIpLimit = checkRateLimit(
    `contact:ip:${ipAddress ?? "unknown"}`,
    15 * 60_000,
    10,
  );
  if (!perIpLimit.allowed) {
    await recordSecurityAudit({
      kind: "MAGIC_LINK_RATE_LIMITED",
      subscriberId: null,
      email,
      ipAddress,
      userAgent,
      detail: { route: "contact", per: "ip" },
    });
    return NextResponse.json(
      {
        ok: false,
        message: `Too many contact form submissions from this location. Please wait ${formatRetrySeconds(
          perIpLimit.retryAfterMs,
        )} and try again.`,
      },
      { status: 429 },
    );
  }

  const { name, message } = parsed.data;

  const result = await sendEmail({
    to: "warm.hello4s@gmail.com",
    replyTo: email,
    subject: `Warm-Hello contact form: ${name}`,
    text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
    html: `<p><img src="${env.APP_URL}/warmhello-logo-b.png" alt="Warm-Hello" width="140" /></p><p><strong>Name:</strong> ${escapeHtml(name)}</p><p><strong>Email:</strong> ${escapeHtml(email)}</p><p><strong>Message:</strong></p><p>${escapeHtml(message).replace(/\n/g, "<br />")}</p>`,
  });

  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    message: "Your message was sent successfully.",
  });
}
