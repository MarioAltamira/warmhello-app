"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore } from "react";

function hasSubscriberCookie() {
  if (typeof document === "undefined") {
    return false;
  }

  return document.cookie
    .split(";")
    .map((part) => part.trim())
    .some((part) => part.startsWith("warmhello_subscriber_id=") && part !== "warmhello_subscriber_id=");
}

export function HeaderAuthActions() {
  const [busy, setBusy] = useState(false);
  usePathname();

  const loggedIn = useSyncExternalStore(
    (callback) => {
      if (typeof window === "undefined") {
        return () => {};
      }

      window.addEventListener("focus", callback);
      window.addEventListener("popstate", callback);
      document.addEventListener("visibilitychange", callback);
      return () => {
        window.removeEventListener("focus", callback);
        window.removeEventListener("popstate", callback);
        document.removeEventListener("visibilitychange", callback);
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
    try {
      await fetch("/api/session", { method: "DELETE" });
    } finally {
      window.location.href = "/auth";
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

