"use client";

import { FloatingReturnButton } from "@/components/floating-return-button";
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

export default function CheckInLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const showFloatingReturn = isPreviewFlow(pathname, searchParams);

  return (
    <>
      {children}
      {showFloatingReturn ? <FloatingReturnButton /> : null}
    </>
  );
}
