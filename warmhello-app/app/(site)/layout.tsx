import { FloatingReturnButton } from "@/components/floating-return-button";
import { SessionExitLogout } from "@/components/session-exit-logout";
import { SiteHeader } from "@/components/site-header";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <SessionExitLogout />
      {children}
      <FloatingReturnButton />
    </>
  );
}

