import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

export const subscriberSessionCookieName = "warmhello_subscriber_id";
export const subscriberSessionBootCookieName = "warmhello_session_boot";
export const subscriberSessionPresenceCookieName = "warmhello_logged_in";

declare global {
  // Persist the current boot id across module reloads in development.
  var __warmhelloSessionBootId: string | undefined;
}

const SIGNING_SECRET = env.JOB_SIGNING_SECRET;
const COOKIE_VERSION = "v1";
const HMAC_ALG = "sha256";

function signPayload(payload: string): string {
  const mac = createHmac(HMAC_ALG, SIGNING_SECRET)
    .update(`${COOKIE_VERSION}:${payload}`)
    .digest("base64url");
  return `${COOKIE_VERSION}.${payload}.${mac}`;
}

export function verifySigned(signed: string | null): string | null {
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

  return payload;
}

function getCurrentSessionBootId() {
  if (!globalThis.__warmhelloSessionBootId) {
    globalThis.__warmhelloSessionBootId = crypto.randomUUID();
  }

  return globalThis.__warmhelloSessionBootId;
}

export const subscriberSessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export const subscriberSessionPresenceCookieOptions = {
  httpOnly: false,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export async function getSubscriberSessionId() {
  const session = await getSubscriberSession();
  return session.subscriberId;
}

export async function getSubscriberSession() {
  const cookieStore = await cookies();
  const signedSubscriberId = cookieStore.get(subscriberSessionCookieName)?.value ?? null;
  const subscriberId = verifySigned(signedSubscriberId);

  if (!subscriberId) {
    return {
      subscriberId: null,
      sessionExpired: false,
    };
  }

  return {
    subscriberId,
    sessionExpired: false,
  };
}

export function getSubscriberSessionBootId() {
  return signPayload(getCurrentSessionBootId());
}

export function signSessionSubscriberId(subscriberId: string) {
  return signPayload(subscriberId);
}
