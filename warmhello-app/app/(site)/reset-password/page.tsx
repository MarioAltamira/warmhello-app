import { ResetPasswordForm } from "./reset-password-form";

type ResetPasswordPageProps = {
  searchParams?: Promise<{
    token?: string;
    redirect?: string;
  }>;
};

function sanitizeRedirect(raw: string | null | undefined): string {
  if (!raw) return "/dashboard";
  if (raw.startsWith("/dashboard") || raw === "/onboard") return raw;
  return "/dashboard";
}

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const resolved = (await searchParams) ?? {};
  const token = resolved.token?.trim() ?? "";
  const redirect = sanitizeRedirect(resolved.redirect);

  if (!token) {
    return (
      <main className="shell">
        <section className="card auth-hero">
          <p className="eyebrow">Set or reset your password</p>
          <h1>Secure link is missing.</h1>
          <p className="lede">
            To set or reset your password, open the link in the email we sent you. If you
            can&rsquo;t find the email, use &ldquo;Can&rsquo;t log in? Email me a
            secure sign-in link&rdquo; from the Log In page.
          </p>
        </section>
        <section className="auth-grid" style={{ maxWidth: 620, margin: "0 auto" }}>
          <article className="card auth-panel auth-panel-active">
            <p className="auth-copy" style={{ marginTop: 8 }}>
              No link was provided. Return to{" "}
              <a href="/forgot" className="inline-link">
                request a new secure link
              </a>{" "}
              or go back to{" "}
              <a href="/auth?mode=login" className="inline-link">
                Log In
              </a>
              .
            </p>
          </article>
        </section>
      </main>
    );
  }

  return <ResetPasswordForm token={token} redirect={redirect} />;
}
