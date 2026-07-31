import Image from "next/image";
import Link from "next/link";
import {
  dashboardAuthHref,
  protectAuthHref,
  signInUpHref,
  trialAuthHref,
} from "@/lib/routes";
import { LogoutButton } from "@/components/logout-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { getSubscriberSessionId } from "@/lib/subscriber-session";

export async function SiteHeader() {
  const subscriberId = await getSubscriberSessionId();
  const trialCtaHref = subscriberId ? dashboardAuthHref : trialAuthHref;
  const signInCtaHref = subscriberId ? dashboardAuthHref : signInUpHref;

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
          <Link href={protectAuthHref} className="button buy-now-button site-header-button">
            Buy Now
          </Link>
          <Link href={trialCtaHref} className="button primary site-header-button">
            Start Free Trial
          </Link>
          <Link href={dashboardAuthHref} className="button secondary site-header-button">
            View Family Dashboard
          </Link>
          <Link href={signInCtaHref} className="button secondary site-header-button">
            Log In / Sign Up
          </Link>
          {subscriberId ? <LogoutButton /> : null}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
