"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function ForgotForm() {
  const searchParams = useSearchParams();
  const redirect = (() => {
    const raw = searchParams.get("redirect");
    if (!raw) return "/dashboard";
    if (raw.startsWith("/dashboard") || raw === "/onboard") return raw;
    return "/dashboard";
  })();

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [isSent, setIsSent] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      setMessage("Please enter the email address associated with your Warm-Hello account.");
      return;
    }
    setSubmitting(true);
    setMessage("");
    try {
      const response = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, redirect }),
      });
      const data = (await response.json()) as { ok?: boolean; message?: string };
      setMessage(data.message ?? "If that email is registered, check your inbox for a secure link.");
      setIsSent(true);
    } catch {
      setMessage("We could not send a request right now. Please try again in a moment.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="shell">
      <section className="card auth-hero">
        <p className="eyebrow">Account Access</p>
        <h1>Forgot your sign-in?</h1>
        <p className="lede">
          Enter the email address you used to create your Warm-Hello account. We&rsquo;ll
          send you a single-use secure link to log you back in.
        </p>
      </section>

      <section className="auth-grid" style={{ maxWidth: 620, margin: "0 auto" }}>
        <article className="card auth-panel auth-panel-active">
          <p className="auth-kicker">Request a secure log-in link</p>
          <h2>Email me a sign-in link</h2>
          <p className="auth-copy">
            Links expire after 30 minutes and work only once. You&rsquo;ll receive an email
            with a big button to log in directly.
          </p>
          <form
            id="forgotForm"
            className="form-grid"
            autoComplete="off"
            data-lpignore="true"
            data-form-type="other"
            onSubmit={handleSubmit}
            noValidate
          >
            <label style={{ gridColumn: "1 / -1" }}>
              Account email
              <input
                form="forgotForm"
                type="email"
                name="forgotEmail"
                autoComplete="email"
                placeholder="jordan@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={submitting || isSent}
              />
            </label>
          </form>
          {!isSent ? (
            <button
              type="submit"
              form="forgotForm"
              className="button primary auth-submit"
              disabled={submitting}
            >
              {submitting ? "Sending link..." : "Send secure log-in link"}
            </button>
          ) : (
            <Link href={"/auth?mode=login" as unknown as any} className="button secondary auth-submit">
              Return to Log In
            </Link>
          )}
          {message ? <p className="auth-copy">{message}</p> : null}
          <p className="auth-copy" style={{ marginTop: 12, fontSize: 13 }}>
            Wrong page? <Link href={"/auth?mode=login" as unknown as any}>Back to Log In</Link>
          </p>
        </article>
      </section>
    </main>
  );
}

export default function ForgotPage() {
  return (
    <Suspense fallback={<main className="shell"><section className="card auth-hero"><p className="eyebrow">Loading...</p></section></main>}>
      <ForgotForm />
    </Suspense>
  );
}
