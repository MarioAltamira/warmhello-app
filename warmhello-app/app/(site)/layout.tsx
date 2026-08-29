import { FloatingReturnButton } from "@/components/floating-return-button";
import { PrivacyChoicesModalProvider } from "@/components/privacy-choices-modal";
import { SessionExitLogout } from "@/components/session-exit-logout";
import { SiteHeader } from "@/components/site-header";
import { ShareAppModalProvider } from "@/components/share-app-modal";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <PrivacyChoicesModalProvider>
      <ShareAppModalProvider>
        <SiteHeader />
        <SessionExitLogout />
        {children}
        <FloatingReturnButton />
      </ShareAppModalProvider>
    </PrivacyChoicesModalProvider>
  );
}

