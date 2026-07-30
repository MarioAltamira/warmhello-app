import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthPageContent } from "@/components/auth-page-content";
import { getSubscriberSession } from "@/lib/subscriber-session";

export default async function AuthPage() {
  const { subscriberId, sessionExpired } = await getSubscriberSession();

  if (subscriberId) {
    redirect("/dashboard");
  }

  return (
    <Suspense fallback={<main className="shell" />}>
      <AuthPageContent sessionExpired={sessionExpired} />
    </Suspense>
  );
}
