import { Buffer } from "node:buffer";
import { Socket } from "node:net";
import tls from "node:tls";
import { env } from "@/lib/env";

type EmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
};

type EmailResult =
  | { ok: true; id: string | null }
  | { ok: false; message: string };

function encodeHeader(value: string) {
  return `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`;
}

function readSmtpResponse(socket: Socket) {
  return new Promise<string>((resolve, reject) => {
    let response = "";

    const cleanup = () => {
      socket.off("data", onData);
      socket.off("error", onError);
      socket.off("end", onEnd);
    };

    const onData = (chunk: Buffer) => {
      response += chunk.toString("utf8");
      const lines = response.split(/\r?\n/).filter(Boolean);
      const lastLine = lines.at(-1);

      if (lastLine && /^\d{3} /.test(lastLine)) {
        cleanup();
        resolve(response);
      }
    };

    const onError = (error: Error) => {
      cleanup();
      reject(error);
    };

    const onEnd = () => {
      cleanup();
      reject(new Error("SMTP connection closed unexpectedly."));
    };

    socket.on("data", onData);
    socket.on("error", onError);
    socket.on("end", onEnd);
  });
}

async function sendSmtpCommand(
  socket: Socket,
  command: string,
  expectedCodes: number[],
) {
  socket.write(`${command}\r\n`);
  const response = await readSmtpResponse(socket);
  const code = Number(response.slice(0, 3));

  if (!expectedCodes.includes(code)) {
    throw new Error(response.trim() || `SMTP command failed: ${command}`);
  }

  return response;
}

async function sendSmtpMail(input: EmailInput) {
  if (
    !env.SMTP_HOST ||
    !env.SMTP_PORT ||
    !env.SMTP_USERNAME ||
    !env.SMTP_PASSWORD ||
    !env.EMAIL_FROM_ADDRESS
  ) {
    return {
      ok: false as const,
      message: "SMTP is not configured yet. Add the SMTP values to enable delivery.",
    };
  }

  let socket: tls.TLSSocket | null = null;

  try {
    socket = await new Promise<tls.TLSSocket>((resolve, reject) => {
      const connection = tls.connect(
        {
          host: env.SMTP_HOST,
          port: env.SMTP_PORT,
          rejectUnauthorized: false,
        },
        () => resolve(connection),
      );

      connection.once("error", reject);
    });

    const hostName = env.APP_URL.replace(/^https?:\/\//, "").replace(/\/.*$/, "") || "localhost";
    const messageId = `<warm_hello-contact-${Date.now()}@warm-hello.com>`;
    const htmlBody = input.html.replace(/\r?\n/g, "");
    const message = [
      `From: Warm_Hello <${env.EMAIL_FROM_ADDRESS}>`,
      `To: ${input.to}`,
      input.replyTo ? `Reply-To: ${input.replyTo}` : null,
      `Subject: ${encodeHeader(input.subject)}`,
      "MIME-Version: 1.0",
      'Content-Type: multipart/alternative; boundary="warmhello-boundary"',
      `Message-ID: ${messageId}`,
      "",
      "--warmhello-boundary",
      'Content-Type: text/plain; charset="UTF-8"',
      "Content-Transfer-Encoding: 8bit",
      "",
      input.text,
      "",
      "--warmhello-boundary",
      'Content-Type: text/html; charset="UTF-8"',
      "Content-Transfer-Encoding: 8bit",
      "",
      htmlBody,
      "",
      "--warmhello-boundary--",
      "",
    ]
      .filter((line): line is string => line !== null)
      .join("\r\n");

    const authUser = Buffer.from(env.SMTP_USERNAME, "utf8").toString("base64");
    const authPass = Buffer.from(env.SMTP_PASSWORD, "utf8").toString("base64");

    const greeting = await readSmtpResponse(socket);
    if (!greeting.startsWith("220")) {
      throw new Error(greeting.trim() || "SMTP greeting failed.");
    }

    await sendSmtpCommand(socket, `EHLO ${hostName}`, [250]);
    await sendSmtpCommand(socket, "AUTH LOGIN", [334]);
    await sendSmtpCommand(socket, authUser, [334]);
    await sendSmtpCommand(socket, authPass, [235]);
    await sendSmtpCommand(socket, `MAIL FROM:<${env.EMAIL_FROM_ADDRESS}>`, [250]);
    await sendSmtpCommand(socket, `RCPT TO:<${input.to}>`, [250, 251]);
    await sendSmtpCommand(socket, "DATA", [354]);
    await sendSmtpCommand(socket, `${message}\r\n.`, [250]);
    await sendSmtpCommand(socket, "QUIT", [221]);

    return { ok: true as const, id: messageId };
  } catch (error) {
    const message = error instanceof Error ? error.message : "SMTP delivery failed.";
    return { ok: false as const, message };
  } finally {
    socket?.destroy();
  }
}

export async function sendEmail(input: EmailInput): Promise<EmailResult> {
  if (env.SMTP_HOST && env.SMTP_PORT && env.SMTP_USERNAME && env.SMTP_PASSWORD) {
    return sendSmtpMail(input);
  }

  if (!env.EMAIL_PROVIDER || !env.EMAIL_API_KEY) {
    void input;
    return {
      ok: false,
      message: "Email is not configured yet. Add SMTP or provider credentials to enable delivery.",
    };
  }

  return {
    ok: false,
    message: `Email provider "${env.EMAIL_PROVIDER}" is not implemented yet.`,
  };
}
