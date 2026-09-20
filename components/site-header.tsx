"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  dashboardAuthHref,
  trialAuthHref,
} from "@/lib/routes";
import { HeaderAuthActions } from "@/components/header-auth-actions";
import { ThemeToggle } from "@/components/theme-toggle";
import { ShareAppButton } from "@/components/share-app-modal";

const MOBILE_BREAKPOINT = 720;

function isMobileViewport() {
  if (typeof window === "undefined") return false;
  return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`).matches;
}

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsMobile(isMobileViewport());
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = (ev: MediaQueryListEvent) => {
      setIsMobile(ev.matches);
      if (!ev.matches) setMenuOpen(false);
    };
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    }
    mql.addListener(onChange);
    return () => mql.removeListener(onChange);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") closeMenu();
    };
    const onClickOutside = (ev: MouseEvent) => {
      const target = ev.target as Node;
      const nav = document.querySelector(".site-header-nav");
      const toggle = document.querySelector(".site-header-menu-toggle");
      if (
        nav &&
        toggle &&
        !nav.contains(target) &&
        !toggle.contains(target)
      ) {
        closeMenu();
      }
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClickOutside);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClickOutside);
      document.body.style.overflow = "";
    };
  }, [menuOpen, closeMenu]);

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link
          href="/"
          className="site-header-brand"
          aria-label="Warm-Hello home"
          onClick={closeMenu}
        >
          <Image
            src="/warmhello-logo-b.png"
            alt="Warm-Hello"
            width={220}
            height={55}
            priority
            className="site-header-logo"
          />
        </Link>

        {isMobile ? (
          <button
            type="button"
            className="site-header-menu-toggle"
            aria-expanded={menuOpen}
            aria-controls="site-header-nav"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? (
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        ) : null}

        <nav
          id="site-header-nav"
          className={`site-header-nav${menuOpen ? " is-open" : ""}`}
          aria-label="Primary"
        >
          <Link
            href="/"
            className="button secondary site-header-button"
            onClick={closeMenu}
          >
            Home
          </Link>
          <Link
            href={trialAuthHref}
            className="button primary site-header-button"
            onClick={closeMenu}
          >
            Start Free Trial
          </Link>
          <Link
            href={dashboardAuthHref}
            className="button secondary site-header-button"
            onClick={closeMenu}
          >
            View Family Dashboard
          </Link>
          <HeaderAuthActions onAuthenticatedAction={closeMenu} />
          <ThemeToggle onToggle={closeMenu} />
          <ShareAppButton label="Share" onBeforeOpen={closeMenu} />
        </nav>
      </div>
    </header>
  );
}

export default SiteHeader;
