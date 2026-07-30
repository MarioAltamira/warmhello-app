"use client";

import type { Route } from "next";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

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

type AuthPageContentProps = {
  sessionExpired?: boolean;
};

export function AuthPageContent({ sessionExpired = false }: AuthPageContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [signupForm, setSignupForm] = useState({
    fullName: "",
    email: "",
    password: "",
  });
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });
  const [signupStatus, setSignupStatus] = useState("");
  const [loginStatus, setLoginStatus] = useState("");
  const [submitting, setSubmitting] = useState<"signup" | "login" | null>(null);

  const redirectPath = getSafeRedirect(searchParams.get("redirect"));
  const mode = searchParams.get("mode") === "login" ? "login" : "signup";
  const heading = getHeading(searchParams.get("source"), redirectPath);
  const showSessionExpiredMessage =
    sessionExpired || searchParams.get("session") === "expired";

  function updateSignupField(name: keyof typeof signupForm, value: string) {
    setSignupForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function updateLoginField(name: keyof typeof loginForm, value: string) {
    setLoginForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleCreateAccount() {
    const trimmedName = signupForm.fullName.trim();
    const trimmedEmail = signupForm.email.trim();

    if (!trimmedName || !trimmedEmail) {
      setSignupStatus("Enter your name and email first so we can prefill the household setup.");
      return;
    }

    const destination = new URLSearchParams();
    destination.set("subscriberName", trimmedName);
    destination.set("subscriberEmail", trimmedEmail);
    setSignupStatus("");
    router.push(`/onboard?${destination.toString()}`);
  }

  async function handleLogin() {
    const trimmedEmail = loginForm.email.trim();

    if (!trimmedEmail) {
      setLoginStatus("Enter the subscriber email you used when creating the household.");
      return;
    }

    setSubmitting("login");
    setLoginStatus("Logging in...");

    try {
      const response = await fetch("/api/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: trimmedEmail,
        }),
      });

      const data = (await response.json()) as { ok?: boolean; message?: string };

      if (!response.ok || !data.ok) {
        setLoginStatus(data.message ?? "We could not log you in right now.");
        return;
      }

      router.push(redirectPath === "/dashboard" ? "/dashboard" : redirectPath);
    } catch {
      setLoginStatus("We could not log you in right now.");
    } finally {
      setSubmitting(null);
    }
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
              <input
                type="text"
                placeholder="Jordan Miller"
                value={signupForm.fullName}
                onChange={(event) => updateSignupField("fullName", event.target.value)}
              />
            </label>
            <label>
              Email address
              <input
                type="email"
                placeholder="jordan@example.com"
                value={signupForm.email}
                onChange={(event) => updateSignupField("email", event.target.value)}
              />
            </label>
            <label>
              Password
              <input
                type="password"
                placeholder="Create a password"
                value={signupForm.password}
                onChange={(event) => updateSignupField("password", event.target.value)}
              />
            </label>
          </div>
          <button
            type="button"
            className="button primary auth-submit"
            onClick={handleCreateAccount}
            disabled={submitting === "signup"}
          >
            Create Account
          </button>
          {signupStatus ? <p className="auth-copy">{signupStatus}</p> : null}
        </article>

        <article className={`card auth-panel ${mode === "login" ? "auth-panel-active" : ""}`}>
          <p className="auth-kicker">Already have an account?</p>
          <h2>Log In</h2>
          <p className="auth-copy">
            Log in to continue where you left off and manage your household.
          </p>
          {showSessionExpiredMessage ? (
            <p className="auth-copy">Session expired, please log in again.</p>
          ) : null}
          <div className="form-grid">
            <label>
              Email address
              <input
                type="email"
                placeholder="jordan@example.com"
                value={loginForm.email}
                onChange={(event) => updateLoginField("email", event.target.value)}
              />
            </label>
            <label>
              Password
              <input
                type="password"
                placeholder="Enter your password"
                value={loginForm.password}
                onChange={(event) => updateLoginField("password", event.target.value)}
              />
            </label>
          </div>
          <button
            type="button"
            className="button secondary auth-submit"
            onClick={handleLogin}
            disabled={submitting === "login"}
          >
            Log In
          </button>
          {loginStatus ? <p className="auth-copy">{loginStatus}</p> : null}
        </article>
      </section>
    </main>
  );
}
