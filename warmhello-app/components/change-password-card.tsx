"use client";

import { useState } from "react";

type ChangePasswordCardProps = {
  hasPassword: boolean;
};

const MAX_PASSWORD_BYTES = 128;
const HAS_UPPERCASE = /[A-Z]/;
const HAS_LOWERCASE = /[a-z]/;
const HAS_DIGIT = /[0-9]/;
const HAS_SYMBOL = /[^A-Za-z0-9]/;

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

export function ChangePasswordCard({ hasPassword }: ChangePasswordCardProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<"ok" | "error">("error");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);

    if (!hasPassword) {
      if (!newPassword) {
        setStatusTone("error");
        setStatus("Enter your first password for Warm Hello.");
        return;
      }
      if (!confirmPassword) {
        setStatusTone("error");
        setStatus("Confirm your first password.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setStatusTone("error");
        setStatus(
          "Passwords do not match — please re-type both fields so they are identical.",
        );
        return;
      }
      const strength = validatePasswordStrengthClient(newPassword);
      if (!strength.valid) {
        setStatusTone("error");
        setStatus(strength.error ?? "Invalid password.");
        return;
      }
    } else {
      if (!currentPassword) {
        setStatusTone("error");
        setStatus("Enter your current password to confirm this change.");
        return;
      }
      if (!newPassword) {
        setStatusTone("error");
        setStatus("Enter your new password.");
        return;
      }
      if (!confirmPassword) {
        setStatusTone("error");
        setStatus("Confirm your new password.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setStatusTone("error");
        setStatus(
          "Passwords do not match — please re-type both fields so they are identical.",
        );
        return;
      }
      if (currentPassword === newPassword) {
        setStatusTone("error");
        setStatus(
          "Your new password must be different from your current password.",
        );
        return;
      }
      const strength = validatePasswordStrengthClient(newPassword);
      if (!strength.valid) {
        setStatusTone("error");
        setStatus(strength.error ?? "Invalid password.");
        return;
      }
    }

    setSubmitting(true);
    setStatusTone("error");
    setStatus(hasPassword ? "Changing your password..." : "Setting your password...");
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);
    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          currentPassword: hasPassword ? currentPassword : undefined,
          newPassword,
          confirmPassword,
        }),
      });
      clearTimeout(timeoutId);
      let data: { ok?: boolean; message?: string; field?: string } = {};
      try {
        data = (await response.json()) as typeof data;
      } catch {
        data = {};
      }
      if (!response.ok || !data.ok) {
        let msg =
          data.message ??
          "We could not update your password right now. Please try again in a moment.";
        if (
          response.status === 403 &&
          (!data.ok || data.field === "currentPassword")
        ) {
          msg =
            "Current password is incorrect. If you do not remember it, use 'Can't log in? Email me a secure sign-in link' from the Log In page.";
        }
        setStatusTone("error");
        setStatus(msg);
        return;
      }
      setStatusTone("ok");
      setStatus(
        data.message ??
          (hasPassword
            ? "Your password has been changed."
            : "Your first password has been set."),
      );
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      clearTimeout(timeoutId);
      const isAbort =
        (typeof DOMException !== "undefined" &&
          err instanceof DOMException &&
          err.name === "AbortError") ||
        (err instanceof Error && err.name === "AbortError");
      setStatusTone("error");
      if (isAbort) {
        setStatus(
          "Your request is taking longer than usual. Please check your connection and try again.",
        );
      } else {
        setStatus(
          "We could not update your password right now. Please try again in a moment.",
        );
      }
    } finally {
      clearTimeout(timeoutId);
      setSubmitting(false);
    }
  }

  return (
    <section className="card" style={{ marginTop: 24 }}>
      <p className="eyebrow">Account security</p>
      <h2>{hasPassword ? "Change password" : "Set your first password"}</h2>
      <p className="lede">
        {hasPassword
          ? "Use a strong password to keep your Warm-Hello account secure. You can change it any time here."
          : "You created your account before passwords were enabled. Setting a first password lets you log in directly with your email and password instead of requesting a secure link every time."}
      </p>

      <form
        id="changePasswordForm"
        className="form-grid"
        style={{ marginTop: 16 }}
        autoComplete="off"
        data-lpignore="true"
        data-form-type="other"
        onSubmit={handleSubmit}
        noValidate
      >
        {hasPassword ? (
          <label style={{ gridColumn: "1 / -1" }}>
            Current password
            <input
              form="changePasswordForm"
              type="password"
              autoComplete="current-password"
              placeholder="Your current password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              disabled={submitting}
            />
          </label>
        ) : null}
        <label style={{ gridColumn: "1 / -1" }}>
          {hasPassword ? "New password" : "Create a password"}
          <input
            form="changePasswordForm"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters with letters, numbers, or symbols"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            disabled={submitting}
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
          Confirm {hasPassword ? "new" : ""} password
          <input
            form="changePasswordForm"
            type="password"
            autoComplete="new-password"
            placeholder={
              hasPassword ? "Re-type your new password" : "Re-type your password"
            }
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            disabled={submitting}
          />
        </label>
      </form>

      <div className="actions" style={{ marginTop: 16 }}>
        <button
          className="button primary"
          type="submit"
          form="changePasswordForm"
          disabled={submitting}
        >
          {submitting
            ? hasPassword
              ? "Changing password..."
              : "Setting password..."
            : hasPassword
              ? "Change password"
              : "Set first password"}
        </button>
      </div>

      {status ? (
        <p
          style={{
            marginTop: 14,
            color: statusTone === "ok" ? "var(--success)" : "var(--danger)",
          }}
        >
          {status}
        </p>
      ) : null}
    </section>
  );
}
