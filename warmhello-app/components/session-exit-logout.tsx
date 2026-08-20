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
    `Max-Age=${60 * 60 * 24 * 30}`,
  ];
  if (secure) attrs.push("Secure");
  document.cookie = attrs.join("; ");
}

function clearPresenceCookie() {
  if (typeof document === "undefined") return;
  const secure = typeof window !== "undefined" && window.location.protocol === "https:";
  const paths = ["/", "/dashboard", "/auth", "/checkout", "/subscribe"];
  for (const path of paths) {
    const attrs: string[] = [
      `${PRESENCE_COOKIE_NAME}=`,
      `path=${path}`,
      "Max-Age=0",
      "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
      "SameSite=Lax",
    ];
    if (secure) attrs.push("Secure");
    document.cookie = attrs.join("; ");
  }
}

function hasPresenceCookie() {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split(";")
    .map((s) => s.trim())
    .some((p) => p.startsWith(`${PRESENCE_COOKIE_NAME}=`) && p.endsWith("=1"));
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

    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("pageshow", handleRevive);
    window.addEventListener("focus", handleRevive);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        void syncPresenceWithServer();
      }
    });

    return () => {
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("pageshow", handleRevive);
      window.removeEventListener("focus", handleRevive);
      document.removeEventListener("visibilitychange", handleRevive);
    };
  }, []);

  return null;
}

