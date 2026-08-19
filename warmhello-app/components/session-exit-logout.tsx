"use client";

import { useEffect } from "react";

const PRESENCE_COOKIE_NAME = "warmhello_logged_in";
const PRESENCE_COOKIE_PATH = "/";
const PRESENCE_COOKIE_SAMESITE: "lax" | "strict" | "none" = "lax";
const PRESENCE_COOKIE_SECURE = process.env.NODE_ENV === "production";

function clearPresenceCookie() {
  const parts: string[] = [];
  parts.push(`${PRESENCE_COOKIE_NAME}=`);
  parts.push("path=" + PRESENCE_COOKIE_PATH);
  if (PRESENCE_COOKIE_SECURE) {
    parts.push("Secure");
  }
  if (PRESENCE_COOKIE_SAMESITE === "lax") parts.push("SameSite=Lax");
  if (PRESENCE_COOKIE_SAMESITE === "strict") parts.push("SameSite=Strict");
  if (PRESENCE_COOKIE_SAMESITE === "none") parts.push("SameSite=None");
  parts.push("Max-Age=0");
  document.cookie = parts.join("; ");
}

export function SessionExitLogout() {
  return null;
}

