import { redirect } from "next/navigation";

type AuthMagicPageProps = {
  searchParams?: Promise<{
    token?: string;
    redirect?: string;
    destination?: string;
  }>;
};

export default async function AuthMagicPage({
  searchParams,
}: AuthMagicPageProps) {
  const resolved = (await searchParams) ?? {};
  const token = resolved.token?.trim() ?? "";
  const destination =
    resolved.redirect?.trim() || resolved.destination?.trim() || "";
  const params = new URLSearchParams();
  if (token) params.set("token", token);
  if (destination) params.set("redirect", destination);
  const target = params.toString()
    ? `/reset-password?${params.toString()}`
    : "/reset-password";
  redirect(target as any, "replace");
}
