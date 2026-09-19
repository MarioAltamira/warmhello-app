import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { deriveSigningKey, env } from "@/lib/env";

export const subscriberSessionCookieName = "warmhello_subscriber_id";
export const subscriberSessionBootCookieName = "warmhello_session_boot";
export const subscriberSessionPresenceCookieName = "warmhello_logged_in";

declare global {
  // Persist the current boot id across module reloads in development.
  var __warmhelloSessionBootId: string | undefined;
}

const SIGNING_SECRET = deriveSigningKey("session");
const ONBOARD_SIGNING_SECRET = deriveSigningKey("onboard-grant");
const COOKIE_VERSION = "v2";
const HMAC_ALG = "sha256";
const SESSION_ABSOLUTE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const SESSION_COOKIE_MAX_AGE_S = 7 * 24 * 60 * 60;
const SESSION_PAYLOAD_SEP = "|";

function signPayload(payload: string): string {
  const mac = createHmac(HMAC_ALG, SIGNING_SECRET)
    .update(`${COOKIE_VERSION}:${payload}`)
    .digest("base64url");
  return `${COOKIE_VERSION}.${payload}.${mac}`;
}

type VerifiedSessionPayload = {
  subscriberId: string;
  issuedAtMs: number;
  expired: boolean;
};

export function verifySignedSession(
  signed: string | null,
): VerifiedSessionPayload | null {
  if (!signed) return null;
  const parts = signed.split(".");
  if (parts.length !== 3) return null;
  const [version, payload, mac] = parts;

  if (version !== COOKIE_VERSION) return null;

  const expected = createHmac(HMAC_ALG, SIGNING_SECRET)
    .update(`${version}:${payload}`)
    .digest("base64url");

  try {
    const a = Buffer.from(mac, "base64url");
    const b = Buffer.from(expected, "base64url");
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

  const sepIdx = payload.indexOf(SESSION_PAYLOAD_SEP);
  if (sepIdx < 0) return null;
  const subscriberId = payload.slice(0, sepIdx);
  const issuedAtMs = Number(payload.slice(sepIdx + 1));
  if (!subscriberId || !Number.isFinite(issuedAtMs)) return null;
  const expired = issuedAtMs <= 0 ? false : Date.now() - issuedAtMs > SESSION_ABSOLUTE_TTL_MS;
  return { subscriberId, issuedAtMs, expired };
}

export function verifySigned(signed: string | null): string | null {
  const s = verifySignedSession(signed);
  if (!s || s.expired) return null;
  return s.subscriberId;
}

function getCurrentSessionBootId() {
  if (!globalThis.__warmhelloSessionBootId) {
    globalThis.__warmhelloSessionBootId = crypto.randomUUID();
  }

  return globalThis.__warmhelloSessionBootId;
}

const IS_APP_URL_HTTPS = env.APP_URL?.startsWith("https://") ?? false;

export const subscriberSessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production" || IS_APP_URL_HTTPS,
  path: "/",
  maxAge: SESSION_COOKIE_MAX_AGE_S,
};

export const subscriberSessionPresenceCookieOptions = {
  httpOnly: false,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production" || IS_APP_URL_HTTPS,
  path: "/",
  maxAge: SESSION_COOKIE_MAX_AGE_S,
};

export async function getSubscriberSessionId() {
  const session = await getSubscriberSession();
  return session.subscriberId;
}

export async function getSubscriberSession() {
  const cookieStore = await cookies();
  const signedSubscriberId = cookieStore.get(subscriberSessionCookieName)?.value ?? null;
  const verified = verifySignedSession(signedSubscriberId);
  const subscriberId = verified && !verified.expired ? verified.subscriberId : null;
  const sessionExpired = Boolean(verified && verified.expired);

  if (!subscriberId) {
    return {
      subscriberId: null,
      sessionExpired,
    };
  }

  return {
    subscriberId,
    sessionExpired,
  };
}

export function getSubscriberSessionBootId() {
  return signPayload(getCurrentSessionBootId());
}

export function signSessionSubscriberId(subscriberId: string) {
  const payload = `${subscriberId}${SESSION_PAYLOAD_SEP}${Date.now()}`;
  return signPayload(payload);
}

const ONBOARD_GRANT_PREFIX = "onboard";
const ONBOARD_GRANT_TTL_MS = 10 * 60 * 1000;

export function signOnboardGrant(subscriberId: string): string {
  const iat = Date.now();
  const raw = `${subscriberId}:${iat}`;
  const mac = createHmac(HMAC_ALG, ONBOARD_SIGNING_SECRET)
    .update(`${ONBOARD_GRANT_PREFIX}:${raw}`)
    .digest("base64url");
  return `${ONBOARD_GRANT_PREFIX}.${Buffer.from(raw, "utf8").toString("base64url")}.${mac}`;
}

export function verifyOnboardGrant(signed: string | null): string | null {
  if (!signed || typeof signed !== "string") return null;
  const parts = signed.split(".");
  if (parts.length !== 3) return null;
  const [prefix, b64raw, mac] = parts;
  if (prefix !== ONBOARD_GRANT_PREFIX) return null;
  let raw: string;
  try {
    raw = Buffer.from(b64raw, "base64url").toString("utf8");
  } catch {
    return null;
  }
  const expected = createHmac(HMAC_ALG, ONBOARD_SIGNING_SECRET)
    .update(`${ONBOARD_GRANT_PREFIX}:${raw}`)
    .digest("base64url");
  try {
    const a = Buffer.from(mac, "base64url");
    const b = Buffer.from(expected, "base64url");
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  const idx = raw.lastIndexOf(":");
  if (idx < 0) return null;
  const subscriberId = raw.slice(0, idx);
  const iat = Number(raw.slice(idx + 1));
  if (!subscriberId || !Number.isFinite(iat)) return null;
  if (Date.now() - iat > ONBOARD_GRANT_TTL_MS) return null;
  return subscriberId;
}
