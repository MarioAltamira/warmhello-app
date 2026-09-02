"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const MAX_PASSWORD_BYTES = 128;
const HAS_UPPERCASE = /[A-Z]/;
const HAS_LOWERCASE = /[a-z]/;
const HAS_DIGIT = /[0-9]/;
const HAS_SYMBOL = /[^A-Za-z0-9]/;

type ResetPasswordFormProps = {
  token: string;
  redirect: string;
};

function validatePasswordStrengthClient(plaintext: string): {
  valid: boolean;
  error?: string;
} {
  if (!plaintext || typeof plaintext !== "string") {
    return { valid: false, error: "Password is required." };
  }
  const byteCount = new TextEncoder().encode(plaintext).length;
  if (byteCount < 8) {
    return {
      valid: false,
      error: "Use a password at least 8 characters long.",
    };
  }
  if (byteCount > MAX_PASSWORD_BYTES) {
    return {
      valid: false,
      error: `Password must be ${MAX_PASSWORD_BYTES} characters or fewer.`,
    };
  }
  const classes = [
    HAS_UPPERCASE.test(plaintext) ? 1 : 0,
    HAS_LOWERCASE.test(plaintext) ? 1 : 0,
    HAS_DIGIT.test(plaintext) ? 1 : 0,
    HAS_SYMBOL.test(plaintext) ? 1 : 0,
  ].reduce((sum, n) => sum + n, 0);
  if (classes < 2) {
    return {
      valid: false,
      error:
        "Use a password with at least two different character types: uppercase letters, lowercase letters, numbers, or symbols.",
    };
  }
  return { valid: true };
}

export function ResetPasswordForm({
  token,
  redirect,
}: ResetPasswordFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (done) return;
    if (!password) {
      setMessage("Enter your new password.");
      return;
    }
    if (!confirmPassword) {
      setMessage("Confirm your new password.");
      return;
    }
    if (password !== confirmPassword) {
      setMessage(
        "Passwords do not match — please re-type both fields so they are identical.",
      );
      return;
    }
    const strength = validatePasswordStrengthClient(password);
    if (!strength.valid) {
      setMessage(strength.error ?? "Invalid password.");
      return;
    }
    setSubmitting(true);
    setMessage("Setting your password...");
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          token,
          password,
          confirmPassword,
          redirect,
        }),
      });
      clearTimeout(timeoutId);
      let data: {
        ok?: boolean;
        message?: string;
        redirect?: string;
        status?: string;
      } = {};
      try {
        data = (await response.json()) as typeof data;
      } catch {
        data = {};
      }
      if (!response.ok || !data.ok) {
        let msg =
          data.message ??
          "We could not set your password. Please request a new secure link and try again.";
        if (data.status === "reused") {
          msg =
            "This secure link has already been used. To protect your account, each link works only once — please request a new one.";
        } else if (data.status === "expired") {
          msg =
            "This secure link has expired. Links are valid for 30 minutes. Please request a new one.";
        } else if (data.status === "invalid") {
          msg =
            "This secure link is no longer valid. Please request a new one.";
        }
        setMessage(msg);
        setDone(false);
        return;
      }
      setMessage(
        data.message ??
          "Your password has been set. You can now log in with your new password.",
      );
      setDone(true);
      const dest =
        data.redirect && typeof data.redirect === "string"
          ? data.redirect
          : "/auth?mode=login";
      setTimeout(() => router.push(dest as any), 1200);
    } catch (err) {
      clearTimeout(timeoutId);
      const isAbort =
        (typeof DOMException !== "undefined" &&
          err instanceof DOMException &&
          err.name === "AbortError") ||
        (err instanceof Error && err.name === "AbortError");
      if (isAbort) {
        setMessage(
          "Your request is taking longer than usual. Please check your connection and try again.",
        );
      } else {
        setMessage(
          "We could not set your password right now. Please try again in a moment.",
        );
      }
      setDone(false);
    } finally {
      clearTimeout(timeoutId);
      setSubmitting(false);
    }
  }

  return (
    <main className="shell">
      <section className="card auth-hero">
        <p className="eyebrow">Secure sign-in link</p>
        <h1>Set a new password for Warm-Hello</h1>
        <p className="lede">
          Create a strong password to log in with. After you set this, you can
          always change it later from the dashboard Settings page.
        </p>
      </section>
      <section className="auth-grid" style={{ maxWidth: 620, margin: "0 auto" }}>
        <article className="card auth-panel auth-panel-active">
          <p className="auth-kicker">Set your password</p>
          <h2>New password</h2>
          <p className="auth-copy">
            This link works only once and expires after 30 minutes. Once set, your
            previous password (if any) will no longer work.
          </p>
          <form
            id="resetPasswordForm"
            className="form-grid"
            autoComplete="off"
            data-lpignore="true"
            data-form-type="other"
            onSubmit={handleSubmit}
            noValidate
          >
            <label style={{ gridColumn: "1 / -1" }}>
              New password
              <input
                form="resetPasswordForm"
                autoComplete="new-password"
                type="password"
                placeholder="At least 8 characters with letters, numbers, or symbols"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={submitting || done}
              />
              <small
                style={{
                  color: "var(--muted)",
                  fontSize: 12,
                  lineHeight: 1.5,
                  marginTop: 4,
                  display: "inline-block",
                }}
              >
                At least 8 characters. Use at least two different types:
                uppercase, lowercase, numbers, or symbols.
              </small>
            </label>
            <label style={{ gridColumn: "1 / -1" }}>
              Confirm new password
              <input
                form="resetPasswordForm"
                autoComplete="new-password"
                type="password"
                placeholder="Re-type your new password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                disabled={submitting || done}
              />
            </label>
          </form>
          {!done ? (
            <button
              type="submit"
              form="resetPasswordForm"
              className="button primary auth-submit"
              disabled={submitting}
            >
              {submitting ? "Setting password..." : "Set password"}
            </button>
          ) : (
            <Link
              href={"/auth?mode=login" as unknown as any}
              className="button secondary auth-submit"
            >
              Continue to Log In
            </Link>
          )}
          {message ? <p className="auth-copy">{message}</p> : null}
          <p className="auth-copy" style={{ marginTop: 12, fontSize: 13 }}>
            Not working?{" "}
            <Link href={"/forgot" as unknown as any}>
              Request a new secure link
            </Link>{" "}
            or{" "}
            <Link href={"/auth?mode=login" as unknown as any}>
              Back to Log In
            </Link>
            .
          </p>
        </article>
      </section>
    </main>
  );
}
