"use client";

import { FloatingReturnButton } from "@/components/floating-return-button";
import { useEffect } from "react";
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

export default function CheckInLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const showFloatingReturn = isPreviewFlow(pathname, searchParams);

  useEffect(() => {
    const prior = getComputedStyle(document.body).paddingTop;
    const priorInline = document.body.style.paddingTop;
    const anyWin = window as unknown as Record<string, unknown>;
    if (typeof anyWin[BODY_PADDING_TOP_RESTORE_KEY] === "undefined") {
      anyWin[BODY_PADDING_TOP_RESTORE_KEY] = priorInline;
    }
    document.body.style.paddingTop = "0px";
    document.documentElement.style.scrollPaddingTop = "0px";
    return () => {
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
