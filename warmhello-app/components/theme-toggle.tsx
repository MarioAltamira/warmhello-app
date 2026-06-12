"use client";

import { useEffect, useState } from "react";

const THEME_STORAGE_KEY = "warmhello-theme";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    const nextIsDark = savedTheme === "dark";

    document.documentElement.dataset.theme = nextIsDark ? "dark" : "light";
    setIsDark(nextIsDark);
    setIsReady(true);
  }, []);

  function handleToggle() {
    const nextIsDark = !isDark;

    document.documentElement.dataset.theme = nextIsDark ? "dark" : "light";
    window.localStorage.setItem(THEME_STORAGE_KEY, nextIsDark ? "dark" : "light");
    setIsDark(nextIsDark);
  }

  return (
    <button
      type="button"
      className="button secondary site-header-button theme-toggle-button"
      onClick={handleToggle}
      aria-pressed={isDark}
    >
      {isReady ? `Dark Theme ${isDark ? "On" : "Off"}` : "Dark Theme"}
    </button>
  );
}
