import { ForgotForm } from "./forgot-form";

type ForgotPageProps = {
  searchParams?: Promise<{
    redirect?: string;
  }>;
};

function sanitizeRedirect(raw: string | null | undefined): string {
  if (!raw) return "/dashboard";
  if (raw.startsWith("/dashboard") || raw === "/onboard") return raw;
  return "/dashboard";
}

export default async function ForgotPage({ searchParams }: ForgotPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const redirect = sanitizeRedirect(resolvedSearchParams.redirect);

  return <ForgotForm redirect={redirect} />;
}
