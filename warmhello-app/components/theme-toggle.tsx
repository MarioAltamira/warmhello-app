"use client";

import { useEffect, useSyncExternalStore } from "react";

const THEME_STORAGE_KEY = "warmhello-theme";

function subscribeTheme(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener("storage", callback);
  window.addEventListener("warmhello-theme", callback as EventListener);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("warmhello-theme", callback as EventListener);
  };
}

function getThemeSnapshot() {
  if (typeof window === "undefined") {
    return "light";
  }

  return window.localStorage.getItem(THEME_STORAGE_KEY) ?? "light";
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, () => "light");
  const isDark = theme === "dark";

  useEffect(() => {
    document.documentElement.dataset.theme = isDark ? "dark" : "light";
  }, [isDark]);

  function handleToggle() {
    const nextIsDark = !isDark;

    document.documentElement.dataset.theme = nextIsDark ? "dark" : "light";
    window.localStorage.setItem(THEME_STORAGE_KEY, nextIsDark ? "dark" : "light");
    window.dispatchEvent(new Event("warmhello-theme"));
  }

  return (
    <button
      type="button"
      className="button secondary site-header-button theme-toggle-button"
      onClick={handleToggle}
      aria-pressed={isDark}
    >
      {`Dark Theme ${isDark ? "On" : "Off"}`}
    </button>
  );
}
