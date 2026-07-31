"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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
  const [loggedIn, setLoggedIn] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setLoggedIn(hasSubscriberCookie());
  }, []);

  async function handleLogout() {
    if (busy) {
      return;
    }

    setBusy(true);
    try {
      await fetch("/api/session", { method: "DELETE" });
    } finally {
      setLoggedIn(false);
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

