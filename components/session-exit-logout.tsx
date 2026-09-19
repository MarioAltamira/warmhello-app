"use client";

import { useEffect, useRef } from "react";

const PRESENCE_COOKIE_NAME = "warmhello_logged_in";

function setPresenceCookie() {
  if (typeof document === "undefined") return;
  const secure = typeof window !== "undefined" && window.location.protocol === "https:";
  const attrs: string[] = [
    `${PRESENCE_COOKIE_NAME}=1`,
    "path=/",
    "SameSite=Lax",
    `Max-Age=${60 * 60 * 24 * 7}`,
  ];
  if (secure) attrs.push("Secure");
  document.cookie = attrs.join("; ");
}

function clearPresenceCookie() {
  if (typeof document === "undefined") return;
  const secure = typeof window !== "undefined" && window.location.protocol === "https:";
  const paths = ["/", "/dashboard", "/auth", "/checkout", "/subscribe"];
  const secureFlags = secure ? [true] : [true, false];
  for (const path of paths) {
    for (const secureFlag of secureFlags) {
      const attrs: string[] = [
        `${PRESENCE_COOKIE_NAME}=`,
        `path=${path}`,
        "Max-Age=0",
        "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
        "SameSite=Lax",
      ];
      if (secureFlag) attrs.push("Secure");
      document.cookie = attrs.join("; ");
    }
  }
}

function hasPresenceCookie() {
  if (typeof document === "undefined") return false;
  const pairs = document.cookie.split(";").map((s) => s.trim());
  for (const pair of pairs) {
    const eq = pair.indexOf("=");
    if (eq < 0) continue;
    const name = pair.slice(0, eq).trim();
    const value = pair.slice(eq + 1).trim();
    if (name === PRESENCE_COOKIE_NAME && value === "1") return true;
  }
  return false;
}

export function SessionExitLogout() {
  const runningRef = useRef(false);

  useEffect(() => {
    async function syncPresenceWithServer() {
      if (typeof window === "undefined" || runningRef.current) return;
      runningRef.current = true;
      try {
        const response = await fetch("/api/plan/me", {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
        }).catch(() => null);

        const json =
          response && response.ok
            ? await response.json().catch(() => null)
            : null;

        const serverLoggedIn = Boolean(json && json.loggedIn);
        const clientLoggedIn = hasPresenceCookie();

        if (serverLoggedIn && !clientLoggedIn) {
          setPresenceCookie();
        } else if (!serverLoggedIn && clientLoggedIn) {
          clearPresenceCookie();
        }

        window.dispatchEvent(
          new CustomEvent("presenceCookieSettled", {
            detail: { authenticated: serverLoggedIn },
          }),
        );
      } finally {
        runningRef.current = false;
      }
    }

    void syncPresenceWithServer();

    function handlePageHide() {
      clearPresenceCookie();
    }

    function handleRevive() {
      void syncPresenceWithServer();
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void syncPresenceWithServer();
      }
    }

    const origPush = window.history.pushState;
    const origReplace = window.history.replaceState;
    let navTimer: ReturnType<typeof setTimeout> | null = null;

    function handleNav() {
      if (navTimer) clearTimeout(navTimer);
      navTimer = setTimeout(() => void syncPresenceWithServer(), 50);
    }

    window.history.pushState = function patchedPushState(...args: Parameters<typeof origPush>) {
      const result = origPush.apply(this, args);
      handleNav();
      return result;
    };
    window.history.replaceState = function patchedReplaceState(...args: Parameters<typeof origReplace>) {
      const result = origReplace.apply(this, args);
      handleNav();
      return result;
    };

    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("pageshow", handleRevive);
    window.addEventListener("focus", handleRevive);
    window.addEventListener("popstate", handleRevive);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.history.pushState = origPush;
      window.history.replaceState = origReplace;
      if (navTimer) clearTimeout(navTimer);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("pageshow", handleRevive);
      window.removeEventListener("focus", handleRevive);
      window.removeEventListener("popstate", handleRevive);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return null;
}

