"use client";

import { FloatingReturnButton } from "@/components/floating-return-button";
import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const PREVIEW_TOKEN = "demo-token";

function isPreviewFlow(pathname: string | null, searchParams: ReturnType<typeof useSearchParams> | null) {
  if (!pathname) return false;
  const match = pathname.match(/^\/checkin\/([^/]+)/);
  const token = match?.[1];
  if (token === PREVIEW_TOKEN) return true;
  if (!searchParams) return false;
  const preview = searchParams.get("preview");
  return preview === "1" || preview === "true";
}

const BODY_PADDING_TOP_RESTORE_KEY =
  "__warmhello_checkin_body_padding_restore__" as const;
const NAV_LOCKED_KEY = "__warmhello_checkin_nav_locked__" as const;

function suppressDashboardRedirectsDuringCheckin() {
  if (typeof window === "undefined") return () => {};
  const anyWin = window as unknown as Record<string, unknown>;

  if (anyWin[NAV_LOCKED_KEY] === true) return () => {};
  anyWin[NAV_LOCKED_KEY] = true;

  const originalReplace = window.location.replace.bind(window.location);
  const originalAssign = window.location.assign.bind(window.location);

  function isNavigationAwayFromCheckin(next: unknown): boolean {
    if (typeof next !== "string") return false;
    try {
      const target = new URL(next, window.location.origin);
      if (target.origin !== window.location.origin) return false;
      const path = target.pathname;
      if (path.startsWith("/checkin/")) return false;
      if (path.startsWith("/s/")) return false;
      if (path.startsWith("/api/")) return false;
      if (path === "/") return false;
      return true;
    } catch {
      return false;
    }
  }

  function guarded(
    next: unknown,
    original: (url: string | URL) => void,
    method: "replace" | "assign",
  ) {
    if (isNavigationAwayFromCheckin(next)) {
      // Block navigation while user is actively reading check-in SMS UI.
      // This specifically blocks the scenario where a client auth listener
      // (presenceCookieSettled etc.) auto-navigates logged-in subscribers
      // to /dashboard as soon as they tap the SMS short-link.
      console.warn(
        `[checkin] blocked window.location.${method} to ${String(next)} while user is on a check-in route.`,
      );
      return;
    }
    original(next as string | URL);
  }

  Object.defineProperty(window.location, "replace", {
    configurable: true,
    writable: true,
    value: (next: unknown) => guarded(next, originalReplace, "replace"),
  });
  Object.defineProperty(window.location, "assign", {
    configurable: true,
    writable: true,
    value: (next: unknown) => guarded(next, originalAssign, "assign"),
  });

  const originalHrefSetter = Object.getOwnPropertyDescriptor(Location.prototype, "href")?.set;
  if (originalHrefSetter) {
    Object.defineProperty(window.location, "href", {
      configurable: true,
      enumerable: true,
      get() {
        return window.location.toString();
      },
      set(next: unknown) {
        if (isNavigationAwayFromCheckin(next)) {
          console.warn(
            `[checkin] blocked window.location.href set to ${String(next)} while user is on a check-in route.`,
          );
          return;
        }
        originalHrefSetter.call(window.location, next);
      },
    });
  }

  const winOnBeforeUnload = (event: BeforeUnloadEvent) => {
    // Only guard: do not prompt — just gives us a hook; real guard is above.
    void event;
  };
  window.addEventListener("beforeunload", winOnBeforeUnload);

  const winOnPopstate = (event: PopStateEvent) => {
    void event;
  };
  window.addEventListener("popstate", winOnPopstate);

  return () => {
    Object.defineProperty(window.location, "replace", {
      configurable: true,
      writable: true,
      value: originalReplace,
    });
    Object.defineProperty(window.location, "assign", {
      configurable: true,
      writable: true,
      value: originalAssign,
    });
    if (originalHrefSetter) {
      const currentHrefGet = Object.getOwnPropertyDescriptor(window.location, "href")?.get;
      Object.defineProperty(window.location, "href", {
        configurable: true,
        enumerable: true,
        get: currentHrefGet ?? (() => window.location.toString()),
        set: originalHrefSetter.bind(window.location),
      });
    }
    window.removeEventListener("beforeunload", winOnBeforeUnload);
    window.removeEventListener("popstate", winOnPopstate);
    delete anyWin[NAV_LOCKED_KEY];
  };
}

export default function CheckInLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const showFloatingReturn = isPreviewFlow(pathname, searchParams);
  const restoreRef = useRef<() => void>(() => {});

  useEffect(() => {
    const prior = getComputedStyle(document.body).paddingTop;
    const priorInline = document.body.style.paddingTop;
    const anyWin = window as unknown as Record<string, unknown>;
    if (typeof anyWin[BODY_PADDING_TOP_RESTORE_KEY] === "undefined") {
      anyWin[BODY_PADDING_TOP_RESTORE_KEY] = priorInline;
    }
    document.body.style.paddingTop = "0px";
    document.documentElement.style.scrollPaddingTop = "0px";
    restoreRef.current = suppressDashboardRedirectsDuringCheckin();
    return () => {
      restoreRef.current?.();
      const restore = (anyWin[BODY_PADDING_TOP_RESTORE_KEY] as string | undefined) ?? "";
      document.body.style.paddingTop = restore;
      document.documentElement.style.scrollPaddingTop = "";
      delete anyWin[BODY_PADDING_TOP_RESTORE_KEY];
    };
  }, []);

  return (
    <>
      {children}
      {showFloatingReturn ? <FloatingReturnButton /> : null}
    </>
  );
}
