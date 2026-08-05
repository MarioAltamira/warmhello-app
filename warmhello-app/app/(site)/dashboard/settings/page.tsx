import Link from "next/link";
import { redirect } from "next/navigation";
import { EmailPreferencesCard } from "@/components/email-preferences-card";
import { SubscriptionManagementCard } from "@/components/subscription-management-card";
import { getDashboardSnapshot } from "@/lib/checkins";
import { prisma } from "@/lib/prisma";
import { getSubscriberSession } from "@/lib/subscriber-session";

export default async function DashboardSettingsPage() {
  const { subscriberId, sessionExpired } = await getSubscriberSession();

  if (!subscriberId) {
    redirect(
      sessionExpired
        ? "/auth?mode=login&redirect=%2Fdashboard%2Fsettings&source=dashboard&session=expired"
        : "/auth?mode=login&redirect=%2Fdashboard%2Fsettings&source=dashboard",
    );
  }

  const snapshot = await getDashboardSnapshot(subscriberId);
  const emailOptedOut = prisma
    ? Boolean(
        (
          await prisma.subscriber.findUnique({
            where: { id: subscriberId },
            select: { unsubscribedAt: true },
          })
        )?.unsubscribedAt,
      )
    : false;

  return (
    <main className="shell">
      <div className="card">
        <p className="eyebrow">Subscriber Dashboard</p>
        <h1>Settings</h1>
        <p className="lede">
          Manage your subscription, billing, and email notification preferences.
        </p>
        <div className="actions" style={{ marginTop: 16 }}>
          <Link href="/dashboard" className="button secondary">
            Back to Dashboard
          </Link>
        </div>
      </div>

      <SubscriptionManagementCard
        subscriberId={snapshot.subscriberId ?? subscriberId}
        subscriptionStatus={snapshot.subscriptionStatus}
        showBuyNow={snapshot.showBuyNow}
        customerEmail={snapshot.subscriberEmail ?? ""}
      />

      <EmailPreferencesCard initialEmailOptedOut={emailOptedOut} />
    </main>
  );
}

