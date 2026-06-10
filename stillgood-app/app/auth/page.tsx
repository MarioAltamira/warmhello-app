"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

const allowedRedirects = new Set(["/onboard", "/dashboard"]);

function getSafeRedirect(redirect: string | null) {
  if (redirect && allowedRedirects.has(redirect)) {
    return redirect;
  }

  return "/onboard";
}

function getHeading(source: string | null, redirectPath: string) {
  if (source === "dashboard" || redirectPath === "/dashboard") {
    return {
      eyebrow: "Welcome Back",
      title: "Log in or create an account to view your family dashboard.",
      lede: "Use one secure entry point before opening your household overview and check-in activity.",
    };
  }

  if (source === "protect") {
    return {
      eyebrow: "Protect A Loved One",
      title: "Create an account or log in before you start protecting your loved one.",
      lede: "This quick step takes you into household setup so you can launch the trial and daily check-ins.",
    };
  }

  return {
    eyebrow: "Start Your Trial",
    title: "Create an account or log in to begin the 14-day trial.",
    lede: "Set up your StillGood household, choose a morning check-in time, and invite the right contacts.",
  };
}

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectPath = getSafeRedirect(searchParams.get("redirect"));
  const mode = searchParams.get("mode") === "login" ? "login" : "signup";
  const heading = getHeading(searchParams.get("source"), redirectPath);

  function handleContinue() {
    router.push(redirectPath);
  }

  return (
    <main className="shell">
      <section className="card auth-hero">
        <p className="eyebrow">{heading.eyebrow}</p>
        <h1>{heading.title}</h1>
        <p className="lede">{heading.lede}</p>
      </section>

      <section className="auth-grid">
        <article className={`card auth-panel ${mode === "signup" ? "auth-panel-active" : ""}`}>
          <p className="auth-kicker">New to StillGood?</p>
          <h2>Sign Up</h2>
          <p className="auth-copy">
            Create your account, then continue into the setup flow for your family.
          </p>
          <div className="form-grid">
            <label>
              Full name
              <input type="text" placeholder="Jordan Miller" />
            </label>
            <label>
              Email address
              <input type="email" placeholder="jordan@example.com" />
            </label>
            <label>
              Password
              <input type="password" placeholder="Create a password" />
            </label>
          </div>
          <button type="button" className="button primary auth-submit" onClick={handleContinue}>
            Create Account
          </button>
        </article>

        <article className={`card auth-panel ${mode === "login" ? "auth-panel-active" : ""}`}>
          <p className="auth-kicker">Already have an account?</p>
          <h2>Log In</h2>
          <p className="auth-copy">
            Sign in to continue where you left off and manage your household.
          </p>
          <div className="form-grid">
            <label>
              Email address
              <input type="email" placeholder="jordan@example.com" />
            </label>
            <label>
              Password
              <input type="password" placeholder="Enter your password" />
            </label>
          </div>
          <button type="button" className="button secondary auth-submit" onClick={handleContinue}>
            Log In
          </button>
        </article>
      </section>

      <section className="card auth-footnote">
        <p className="auth-note">
          This screen is ready to connect to a real authentication provider next. For now,
          it routes users through a dedicated sign-up or log-in step before entering the
          selected experience.
        </p>
        <div className="actions">
          <Link href="/" className="button secondary">
            Return To Landing Page
          </Link>
        </div>
      </section>
    </main>
  );
}
