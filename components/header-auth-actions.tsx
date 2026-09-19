"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore } from "react";

const PRESENCE_COOKIE_NAME = "warmhello_logged_in";

function hasSubscriberCookie() {
  if (typeof document === "undefined") {
    return false;
  }

  const pairs = document.cookie.split(";").map((part) => part.trim());
  for (const pair of pairs) {
    const eq = pair.indexOf("=");
    if (eq < 0) continue;
    const name = pair.slice(0, eq).trim();
    const value = pair.slice(eq + 1).trim();
    if (name === PRESENCE_COOKIE_NAME && value === "1") return true;
  }
  return false;
}

function clearAllClientSideCookies() {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:";
  const cookieNames = [
    PRESENCE_COOKIE_NAME,
  ];
  for (const name of cookieNames) {
    for (const path of ["/", "/dashboard", "/auth", "/checkout", "/subscribe"]) {
      for (const secureFlag of [true, false]) {
        if (secure && !secureFlag) continue;
        const attrs: string[] = [
          `${name}=`,
          `path=${path}`,
          `Max-Age=0`,
          `Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
          `SameSite=Lax`,
        ];
        if (secureFlag) attrs.push("Secure");
        document.cookie = attrs.join("; ");
      }
    }
  }
}

export function HeaderAuthActions() {
  const [busy, setBusy] = useState(false);
  usePathname();

  const loggedIn = useSyncExternalStore(
    (callback) => {
      if (typeof window === "undefined") {
        return () => {};
      }

      const settled = () => callback();
      window.addEventListener("focus", callback);
      window.addEventListener("popstate", callback);
      window.addEventListener("pageshow", callback);
      window.addEventListener("presenceCookieSettled", settled);
      document.addEventListener("visibilitychange", callback);
      const t1 = window.setTimeout(callback, 100);
      const t2 = window.setTimeout(callback, 500);
      const t3 = window.setTimeout(callback, 1500);
      return () => {
        window.removeEventListener("focus", callback);
        window.removeEventListener("popstate", callback);
        window.removeEventListener("pageshow", callback);
        window.removeEventListener("presenceCookieSettled", settled);
        document.removeEventListener("visibilitychange", callback);
        window.clearTimeout(t1);
        window.clearTimeout(t2);
        window.clearTimeout(t3);
      };
    },
    () => hasSubscriberCookie(),
    () => false,
  );

  async function handleLogout() {
    if (busy) {
      return;
    }

    setBusy(true);
    clearAllClientSideCookies();
    try {
      await fetch("/api/session", {
        method: "DELETE",
        credentials: "same-origin",
        cache: "no-store",
      }).catch(() => {});
    } finally {
      clearAllClientSideCookies();
      window.location.replace("/auth");
    }
  }

  if (!loggedIn) {
    return (
      <Link href="/auth" className="button secondary site-header-button">
        Log In / Sign Up
      </Link>
    );
  }

  return (
    <button className="button secondary site-header-button" onClick={handleLogout} disabled={busy}>
      Log Out
    </button>
  );
}

