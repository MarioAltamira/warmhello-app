import { NextResponse } from "next/server";
import { z } from "zod";
import { sendEmail } from "@/lib/email";
import { env } from "@/lib/env";

const bodySchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
  message: z.string().trim().min(10),
});

export async function POST(request: Request) {
  let parsed: z.infer<typeof bodySchema>;

  try {
    parsed = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message: "Please enter your name, a valid email, and a message with at least 10 characters.",
      },
      { status: 400 },
    );
  }

  const result = await sendEmail({
    to: env.EMAIL_FROM_ADDRESS,
    replyTo: parsed.email,
    subject: `Warm_Hello contact form: ${parsed.name}`,
    text: `Name: ${parsed.name}\nEmail: ${parsed.email}\n\nMessage:\n${parsed.message}`,
    html: `<p><strong>Name:</strong> ${parsed.name}</p><p><strong>Email:</strong> ${parsed.email}</p><p><strong>Message:</strong></p><p>${parsed.message.replace(/\n/g, "<br />")}</p>`,
  });

  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    message: "Your message was sent successfully.",
  });
}
