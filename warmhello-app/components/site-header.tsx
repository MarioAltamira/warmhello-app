import Image from "next/image";
import Link from "next/link";
import {
  dashboardAuthHref,
  trialAuthHref,
} from "@/lib/routes";
import { HeaderAuthActions } from "@/components/header-auth-actions";
import { ThemeToggle } from "@/components/theme-toggle";
import { SmartBuyNowButton } from "@/components/smart-buy-now-button";
import { ShareAppButton } from "@/components/share-app-modal";

export async function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="site-header-brand" aria-label="Warm-Hello home">
          <Image
            src="/warmhello-logo.png"
            alt="Warm-Hello"
            width={176}
            height={44}
            priority
            className="site-header-logo"
          />
        </Link>

        <nav className="site-header-nav" aria-label="Primary">
          <Link href="/" className="button secondary site-header-button">
            Home
          </Link>
          <SmartBuyNowButton className="button buy-now-button site-header-button" />
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
