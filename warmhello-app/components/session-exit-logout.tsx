"use client";

import { useEffect } from "react";

const PRESENCE_COOKIE_NAME = "warmhello_logged_in";

export function SessionExitLogout() {
  useEffect(() => {
    function clearPresenceCookie() {
      if (typeof document === "undefined") return;
      const secure = typeof window !== "undefined" && window.location.protocol === "https:";
      const paths = ["/", "/dashboard", "/auth", "/checkout", "/subscribe"];
      for (const path of paths) {
        const attrs: string[] = [
          `${PRESENCE_COOKIE_NAME}=`,
          `path=${path}`,
          `Max-Age=0`,
          `Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
          `SameSite=Lax`,
        ];
        if (secure) attrs.push("Secure");
        document.cookie = attrs.join("; ");
      }
    }

    function handlePageHide() {
      clearPresenceCookie();
    }

    window.addEventListener("pagehide", handlePageHide);
    return () => {
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, []);

  return null;
}

