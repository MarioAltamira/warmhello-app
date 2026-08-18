import { Buffer } from "node:buffer";
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

const SMTP_TIMEOUT_MS = 30_000;

function readSmtpResponse(socket: tls.TLSSocket) {
  return new Promise<string>((resolve, reject) => {
    let response = "";
    let timeout: NodeJS.Timeout | null = null;

    const cleanup = () => {
      socket.off("data", onData);
      socket.off("error", onError);
      socket.off("end", onEnd);
      if (timeout) clearTimeout(timeout);
    };

    timeout = setTimeout(() => {
      cleanup();
      reject(new Error("SMTP response timed out."));
    }, SMTP_TIMEOUT_MS);

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
  socket: tls.TLSSocket,
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

function extractProviderId(dataResponse: string, fallbackId: string): string | null {
  if (!dataResponse) return fallbackId;
  const match = dataResponse.match(/250[^\n]*?(?:ok\s+)?(<[^>\n]+@[^>\n]+>)/i);
  if (match && match[1]) return match[1];
  return fallbackId;
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
  let responseTimeout: NodeJS.Timeout | null = null;

  try {
    socket = await new Promise<tls.TLSSocket>((resolve, reject) => {
      const connectTimeout = setTimeout(() => {
        reject(new Error(`SMTP connection to ${env.SMTP_HOST}:${env.SMTP_PORT} timed out.`));
      }, SMTP_TIMEOUT_MS);

      const connection = tls.connect(
        {
          host: env.SMTP_HOST,
          port: env.SMTP_PORT,
          servername: env.SMTP_HOST,
          minVersion: "TLSv1.2",
          rejectUnauthorized: true,
        },
        () => {
          clearTimeout(connectTimeout);
          resolve(connection);
        },
      );
      connection.once("error", (err) => {
        clearTimeout(connectTimeout);
        reject(err);
      });
    });

    socket.setTimeout(SMTP_TIMEOUT_MS);
    socket.on("timeout", () => {
      socket?.destroy(new Error("SMTP socket idle timeout."));
    });

    const hostName = env.APP_URL.replace(/^https?:\/\//, "").replace(/\/.*$/, "") || "localhost";
    const localMessageId = `<warmhello-contact-${Date.now()}@warm-hello.com>`;
    const htmlBody = input.html.replace(/\r?\n/g, "");
    const message = [
      `From: Warm-Hello <${env.EMAIL_FROM_ADDRESS}>`,
      `To: ${input.to}`,
      input.replyTo ? `Reply-To: ${input.replyTo}` : null,
      `Subject: ${encodeHeader(input.subject)}`,
      "MIME-Version: 1.0",
      'Content-Type: multipart/alternative; boundary="warmhello-boundary"',
      `Message-ID: ${localMessageId}`,
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

    const dataResponse = await sendSmtpCommand(socket, `${message}\r\n.`, [250]);
    const providerMessageId = extractProviderId(dataResponse, localMessageId);

    await sendSmtpCommand(socket, "QUIT", [221]);

    return { ok: true as const, id: providerMessageId };
  } catch (error) {
    const message = error instanceof Error ? error.message : "SMTP delivery failed.";
    return { ok: false as const, message };
  } finally {
    if (responseTimeout) clearTimeout(responseTimeout);
    try { socket?.destroySoon(); } catch {
      try { socket?.destroy(); } catch {}
    }
  }
}

export async function sendEmail(input: EmailInput): Promise<EmailResult> {
  if (env.SMTP_HOST && env.SMTP_PORT && env.SMTP_USERNAME && env.SMTP_PASSWORD) {
    return sendSmtpMail(input);
  }

  void input;
  return {
    ok: false,
    message: "Email is not configured yet. Add SMTP credentials to enable delivery.",
  };
}
