import Image from "next/image";
import Link from "next/link";
import {
  dashboardAuthHref,
  trialAuthHref,
} from "@/lib/routes";
import { HeaderAuthActions } from "@/components/header-auth-actions";
import { ThemeToggle } from "@/components/theme-toggle";
import { ShareAppButton } from "@/components/share-app-modal";

export async function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="site-header-brand" aria-label="Warm-Hello home">
          <Image
            src="/warmhello-logo-b.png"
            alt="Warm-Hello"
            width={220}
            height={55}
            priority
            className="site-header-logo"
          />
        </Link>

        <nav className="site-header-nav" aria-label="Primary">
          <Link href="/" className="button secondary site-header-button">
            Home
          </Link>
          <Link href={trialAuthHref} className="button primary site-header-button">
            Start Free Trial
          </Link>
          <Link href={dashboardAuthHref} className="button secondary site-header-button">
            View Family Dashboard
          </Link>
          <HeaderAuthActions />
          <ThemeToggle />
          <ShareAppButton label="Share" />
        </nav>
      </div>
    </header>
  );
}
