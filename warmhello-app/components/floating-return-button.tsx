"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export function FloatingReturnButton() {
  const pathname = usePathname();
  const router = useRouter();
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    setCanGoBack(window.history.length > 1);
  }, [pathname]);

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
