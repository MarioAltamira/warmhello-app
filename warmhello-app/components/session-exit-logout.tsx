"use client";

import { useEffect } from "react";

export function SessionExitLogout() {
  useEffect(() => {
    function handlePageHide() {
      fetch("/api/session", { method: "DELETE", keepalive: true }).catch(() => undefined);
    }

    window.addEventListener("pagehide", handlePageHide);
    return () => window.removeEventListener("pagehide", handlePageHide);
  }, []);

  return null;
}

