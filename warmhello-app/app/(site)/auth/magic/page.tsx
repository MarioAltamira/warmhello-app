"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

type MagicStatus =
  | "loading"
  | "ok"
  | "expired"
  | "invalid"
  | "reused"
  | "error"
  | "ready";

function MagicPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<MagicStatus>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function apply() {
      if (!token) {
        setStatus("invalid");
        setMessage("This log-in link is missing its security token. Please request a new link.");
        return;
      }
      try {
        const response = await fetch("/api/auth/magic", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = (await response.json()) as {
          ok?: boolean;
          status?: MagicStatus;
          message?: string;
          redirect?: string;
        };
        if (cancelled) return;
        const next = data.status;
        if (data.ok && next === "ok") {
          setStatus("ok");
          setMessage("You are signed in. Redirecting to your Dashboard...");
          const target = data.redirect ?? "/dashboard";
          setTimeout(() => router.replace(target as unknown as any), 1500);
          return;
        }
        if (next === "expired") {
          setStatus("expired");
          setMessage(data.message ?? "This log-in link has expired. Please request a new one.");
          return;
        }
        if (next === "reused") {
          setStatus("reused");
          setMessage(
            data.message ??
              "This log-in link has already been used once. For your security, please request a new one.",
          );
          return;
        }
        setStatus("invalid");
        setMessage(data.message ?? "This log-in link is no longer valid. Please request a new one.");
      } catch {
        if (cancelled) return;
        setStatus("error");
        setMessage("Something went wrong while verifying your link. Please try again.");
      }
    }
    void apply();
    return () => {
      cancelled = true;
    };
  }, [token, router]);

  let heading = "";
  let eyebrow = "";
  let statusColor = "#92400e";
  if (status === "ok") {
    heading = "Sign-in successful";
    eyebrow = "Secure log-in link verified";
    statusColor = "#065f46";
  } else if (status === "expired") {
    heading = "This log-in link has expired";
    eyebrow = "Link expired";
    statusColor = "#92400e";
  } else if (status === "reused") {
    heading = "This log-in link was already used";
    eyebrow = "Single-use link already consumed";
    statusColor = "#92400e";
  } else if (status === "invalid" || status === "error") {
    heading = "This log-in link is no longer valid";
    eyebrow = "Link invalid";
    statusColor = "#7f1d1d";
  } else {
    heading = "Verifying your secure log-in link...";
    eyebrow = "Verifying";
    statusColor = "#0f766e";
  }

  return (
    <main className="shell">
      <section className="card auth-hero">
        <p className="eyebrow" style={{ color: statusColor }}>
          {eyebrow}
        </p>
        <h1>{heading}</h1>
        {message ? <p className="lede">{message}</p> : null}
      </section>

      <section className="auth-grid" style={{ maxWidth: 620, margin: "0 auto" }}>
        <article className="card auth-panel auth-panel-active">
          {status === "loading" ? (
            <p className="auth-copy">
              Please wait a moment while we verify your link. This happens automatically.
            </p>
          ) : status === "ok" ? (
            <>
              <p className="auth-kicker">You are all set</p>
              <h2 style={{ color: "#065f46" }}>Redirecting...</h2>
              <p className="auth-copy">
                If you are not redirected within a few seconds, go to your Dashboard directly.
              </p>
              <Link href="/dashboard" className="button primary auth-submit">
                Go to Dashboard
              </Link>
            </>
          ) : (
            <>
              <p className="auth-kicker">Request a new link</p>
              <h2>Let&rsquo;s get you a fresh log-in link</h2>
              <p className="auth-copy">
                Links work only once, and expire after 30 minutes for your account safety.
              </p>
              <Link
                href={"/forgot" as unknown as any}
                className="button primary auth-submit"
                style={{ textDecoration: "none", textAlign: "center" }}
              >
                Request a new secure log-in link
              </Link>
              <p className="auth-copy" style={{ marginTop: 12, fontSize: 13 }}>
                Remember how you signed in? <Link href={"/auth?mode=login" as unknown as any}>Back to Log In</Link>
              </p>
            </>
          )}
        </article>
      </section>
    </main>
  );
}

export default function AuthMagicPage() {
  return (
    <Suspense
      fallback={
        <main className="shell">
          <section className="card auth-hero">
            <p className="eyebrow">Loading...</p>
            <h1>Checking your secure link...</h1>
          </section>
        </main>
      }
    >
      <MagicPageInner />
    </Suspense>
  );
}
