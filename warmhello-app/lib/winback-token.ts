import { createHmac, timingSafeEqual } from "crypto";
import { deriveSigningKey } from "@/lib/env";

type WinbackPayload = {
  subscriberId: string;
  exp: number;
};

function encodeJson(value: unknown) {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

function decodeJson<T>(value: string) {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as T;
}

function sign(value: string) {
  return createHmac("sha256", deriveSigningKey("winback")).update(value).digest("base64url");
}

export function createWinbackToken(input: { subscriberId: string; expiresInDays?: number }) {
  const expiresInDays = input.expiresInDays ?? 30;
  const exp = Date.now() + expiresInDays * 24 * 60 * 60 * 1000;
  const payload: WinbackPayload = { subscriberId: input.subscriberId, exp };
  const encoded = encodeJson(payload);
  const signature = sign(encoded);
  return `${encoded}.${signature}`;
}

export function verifyWinbackToken(token: string) {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) {
    return { ok: false as const, message: "Invalid token." };
  }

  const expected = sign(encoded);
  const valid =
    expected.length === signature.length &&
    timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  if (!valid) {
    return { ok: false as const, message: "Invalid token." };
  }

  const payload = decodeJson<WinbackPayload>(encoded);
  if (!payload?.subscriberId || typeof payload.subscriberId !== "string") {
    return { ok: false as const, message: "Invalid token." };
  }

  if (typeof payload.exp !== "number" || payload.exp < Date.now()) {
    return { ok: false as const, message: "Token expired." };
  }

  return { ok: true as const, subscriberId: payload.subscriberId };
}
