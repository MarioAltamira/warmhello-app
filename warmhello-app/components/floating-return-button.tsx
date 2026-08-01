"use client";

import { usePathname, useRouter } from "next/navigation";

export function FloatingReturnButton() {
  const pathname = usePathname();
  const router = useRouter();
  const canGoBack = typeof window !== "undefined" && window.history.length > 1;

  if (pathname === "/") {
    return null;
  }

  function handleReturn() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/");
  }

  return (
    <button
      type="button"
      className="floating-return-button"
      onClick={handleReturn}
      aria-label={canGoBack ? "Return to the previous screen" : "Return to the home screen"}
    >
      Return
    </button>
  );
}
