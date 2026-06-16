"use client";

import type { Route } from "next";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

const allowedRedirects = new Set<Route>(["/onboard", "/dashboard"]);

function getSafeRedirect(redirect: string | null): Route {
  if (redirect && allowedRedirects.has(redirect as Route)) {
    return redirect as Route;
  }

  return "/onboard";
}

function getHeading(source: string | null, redirectPath: Route) {
  if (source === "dashboard" || redirectPath === "/dashboard") {
    return {
      eyebrow: "Welcome Back",
      title: "Log in or create an account to view your family dashboard.",
      lede: "",
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
    title: "Create an account or log in to begin the 7-day trial.",
    lede: "Set up your WarmHello household, choose a morning check-in time, and invite the right contacts.",
  };
}

function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectPath = getSafeRedirect(searchParams.get("redirect"));
  const mode = searchParams.get("mode") === "login" ? "login" : "signup";
  const heading = getHeading(searchParams.get("source"), redirectPath);

  useEffect(() => {
    // #region debug-point A:auth-css-links
    const report = (phase: string) =>
      fetch("http://127.0.0.1:7777/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: "auth-css-chunk",
          runId: "pre-fix",
          hypothesisId: "A",
          location: "app/auth/page.tsx",
          msg: `[DEBUG] auth css links ${phase}`,
          data: {
            mode,
            hrefs: Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map((link) =>
              link.getAttribute("href"),
            ),
          },
          ts: Date.now(),
        }),
      }).catch(() => {});
    report("mount");
    const timeoutId = window.setTimeout(() => report("after-timeout"), 1200);
    return () => window.clearTimeout(timeoutId);
    // #endregion
  }, [mode]);

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
          <p className="auth-kicker">New to WarmHello?</p>
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
            Log in to continue where you left off and manage your household.
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
    </main>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<main className="shell" />}>
      <AuthPageContent />
    </Suspense>
  );
}
