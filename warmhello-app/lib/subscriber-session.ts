import { cookies } from "next/headers";

export const subscriberSessionCookieName = "warmhello_subscriber_id";
export const subscriberSessionBootCookieName = "warmhello_session_boot";

declare global {
  // Persist the current boot id across module reloads in development.
  var __warmhelloSessionBootId: string | undefined;
}

function getCurrentSessionBootId() {
  if (!globalThis.__warmhelloSessionBootId) {
    globalThis.__warmhelloSessionBootId = crypto.randomUUID();
  }

  return globalThis.__warmhelloSessionBootId;
}

export const subscriberSessionCookieOptions = {
  httpOnly: false,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
};

export async function getSubscriberSessionId() {
  const session = await getSubscriberSession();
  return session.subscriberId;
}

export async function getSubscriberSession() {
  const cookieStore = await cookies();
  const subscriberId = cookieStore.get(subscriberSessionCookieName)?.value ?? null;
  const sessionBootId =
    cookieStore.get(subscriberSessionBootCookieName)?.value ?? null;
  const currentBootId = getCurrentSessionBootId();

  if (!subscriberId) {
    return {
      subscriberId: null,
      sessionExpired: false,
    };
  }

  if (sessionBootId !== currentBootId) {
    return {
      subscriberId: null,
      sessionExpired: true,
    };
  }

  return {
    subscriberId,
    sessionExpired: false,
  };
}

export function getSubscriberSessionBootId() {
  return getCurrentSessionBootId();
}
