import { MagicForm } from "./magic-form";

type AuthMagicPageProps = {
  searchParams?: Promise<{
    token?: string;
    redirect?: string;
    destination?: string;
  }>;
};

function sanitizeDestination(raw: string | null | undefined): string {
  if (!raw) return "/dashboard";
  if (raw.startsWith("/dashboard") || raw === "/onboard") return raw;
  return "/dashboard";
}

export default async function AuthMagicPage({ searchParams }: AuthMagicPageProps) {
  const resolved = (await searchParams) ?? {};
  const token = resolved.token?.trim() ?? null;
  const destination = sanitizeDestination(
    resolved.redirect ?? resolved.destination ?? "/dashboard",
  );
  return <MagicForm token={token} destination={destination} />;
}
