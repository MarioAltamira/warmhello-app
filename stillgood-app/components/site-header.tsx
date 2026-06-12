import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

const trialAuthHref = "/auth?mode=signup&redirect=%2Fonboard&source=trial";
const dashboardAuthHref = "/auth?mode=login&redirect=%2Fdashboard&source=dashboard";
const signInUpHref = "/auth?mode=signup&redirect=%2Fonboard&source=header";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="site-header-brand" aria-label="StillGood home">
          <Image
            src="/StillGood Logo.png"
            alt="StillGood"
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
            Start FREE Trial
          </Link>
          <Link href={dashboardAuthHref} className="button secondary site-header-button">
            View Family Dashboard
          </Link>
          <Link href={signInUpHref} className="button secondary site-header-button">
            Sign In/Up
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
