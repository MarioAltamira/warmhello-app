"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function ForgotFormInner() {
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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({ email: trimmed, redirect }),
      });
      clearTimeout(timeoutId);
      let data: { ok?: boolean; message?: string } = {};
      try {
        data = (await response.json()) as typeof data;
      } catch {
        data = {};
      }
      if (!response.ok && response.status >= 500) {
        setMessage(
          data.message ??
            "Our email service is temporarily busy. Please wait 60 seconds and try again.",
        );
        setIsSent(false);
        return;
      }
      setMessage(
        data.message ??
          "If that email is registered, check your inbox for a secure link.",
      );
      setIsSent(true);
    } catch (err) {
      clearTimeout(timeoutId);
      const isAbort =
        (typeof DOMException !== "undefined" &&
          err instanceof DOMException &&
          err.name === "AbortError") ||
        (err instanceof Error && err.name === "AbortError");
      if (isAbort) {
        setMessage(
          "Your request is taking longer than usual. Please check your connection and try again, or email sales@warm-hello.com for help.",
        );
      } else {
        setMessage("We could not send a request right now. Please try again in a moment.");
      }
      setIsSent(false);
    } finally {
      clearTimeout(timeoutId);
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
            <Link
              href={"/auth?mode=login" as unknown as any}
              className="button secondary auth-submit"
            >
              Return to Log In
            </Link>
          )}
          {message ? <p className="auth-copy">{message}</p> : null}
          <p className="auth-copy" style={{ marginTop: 12, fontSize: 13 }}>
            Wrong page?{" "}
            <Link href={"/auth?mode=login" as unknown as any}>Back to Log In</Link>
          </p>
        </article>
      </section>
    </main>
  );
}

export default function ForgotPage() {
  return (
    <Suspense
      fallback={
        <main className="shell">
          <section className="card auth-hero">
            <p className="eyebrow">Loading...</p>
            <h1>Preparing your secure log-in link request...</h1>
          </section>
        </main>
      }
    >
      <ForgotFormInner />
    </Suspense>
  );
}
