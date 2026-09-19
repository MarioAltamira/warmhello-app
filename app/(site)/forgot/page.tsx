import { ForgotForm } from "./forgot-form";
import { sanitizeRedirect } from "@/lib/routes";

type ForgotPageProps = {
  searchParams?: Promise<{
    redirect?: string;
  }>;
};

export default async function ForgotPage({ searchParams }: ForgotPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const redirect = sanitizeRedirect(resolvedSearchParams.redirect);

  return <ForgotForm redirect={redirect} />;
}
