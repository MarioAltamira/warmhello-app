import Image from "next/image";
import Link from "next/link";
import {
  dashboardAuthHref,
  protectAuthHref,
  trialAuthHref,
} from "@/lib/routes";
import { HeaderAuthActions } from "@/components/header-auth-actions";
import { ThemeToggle } from "@/components/theme-toggle";

export async function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="site-header-brand" aria-label="Warm-Hello home">
          <Image
            src="/warmhello-logo.png"
            alt="Warm-Hello"
            width={160}
            height={42}
            priority
            className="site-header-logo"
          />
        </Link>

        <nav className="site-header-nav" aria-label="Primary">
          <Link href="/" className="button secondary site-header-button">
            Home
          </Link>
          <Link href={protectAuthHref} className="button buy-now-button site-header-button">
            Buy Now
          </Link>
          <Link href={trialAuthHref} className="button primary site-header-button">
            Start Free Trial
          </Link>
          <Link href={dashboardAuthHref} className="button secondary site-header-button">
            View Family Dashboard
          </Link>
          <HeaderAuthActions />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
