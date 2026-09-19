"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore } from "react";

const PRESENCE_COOKIE_NAME = "warmhello_logged_in";

type VerifiedState =
  | { verified: false }
  | { verified: true; authenticated: boolean };

let _verifiedCache: VerifiedState = { verified: false };

function getVerifiedState(): VerifiedState {
  if (typeof window === "undefined") {
    return { verified: false };
  }
  return _verifiedCache;
}

function setVerifiedState(authenticated: boolean) {
  _verifiedCache = { verified: true, authenticated };
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

  const verifiedState = useSyncExternalStore<VerifiedState>(
    (callback) => {
      if (typeof window === "undefined") {
        return () => {};
      }

      const settled = (evt?: Event) => {
        const custom = evt as CustomEvent<{ authenticated?: boolean }> | undefined;
        if (custom?.detail && typeof custom.detail.authenticated === "boolean") {
          setVerifiedState(custom.detail.authenticated);
        }
        callback();
      };
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
    () => getVerifiedState(),
    () => ({ verified: false } as VerifiedState),
  );

  let loggedIn = false;
  if (verifiedState.verified) {
    loggedIn = verifiedState.authenticated;
  }

  async function handleLogout() {
    if (busy) {
      return;
    }

    setBusy(true);
    clearAllClientSideCookies();
    setVerifiedState(false);
    try {
      await fetch("/api/session", {
        method: "DELETE",
        credentials: "same-origin",
        cache: "no-store",
      }).catch(() => {});
    } finally {
      clearAllClientSideCookies();
      setVerifiedState(false);
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

