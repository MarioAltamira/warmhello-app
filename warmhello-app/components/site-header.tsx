import Image from "next/image";
import Link from "next/link";
import {
  dashboardAuthHref,
  signInUpHref,
  trialAuthHref,
} from "@/lib/routes";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="site-header-brand" aria-label="WarmHello home">
          <Image
            src="/warmhello-logo.png"
            alt="WarmHello"
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
          <Link href={trialAuthHref} className="button primary site-header-button">
            Start Free Trial
          </Link>
          <Link href={dashboardAuthHref} className="button secondary site-header-button">
            View Family Dashboard
          </Link>
          <Link href={signInUpHref} className="button secondary site-header-button">
            Log In / Sign Up
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
