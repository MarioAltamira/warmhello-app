"use client";

import { useState } from "react";

export function LogoutButton() {
  const [busy, setBusy] = useState(false);

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

  return (
    <button className="button secondary site-header-button" onClick={handleLogout} disabled={busy}>
      Log Out
    </button>
  );
}

