import Link from "next/link";
import { redirect } from "next/navigation";
import { TimelineClient } from "@/components/timeline-client";
import { getSubscriberSession } from "@/lib/subscriber-session";
import { getSubscriberTimeline } from "@/lib/timeline";

export default async function DashboardTimelinePage() {
  const { subscriberId, sessionExpired } = await getSubscriberSession();

  if (!subscriberId) {
    redirect(
      sessionExpired
        ? "/auth?mode=login&redirect=%2Fdashboard%2Ftimeline&source=dashboard&session=expired"
        : "/auth?mode=login&redirect=%2Fdashboard%2Ftimeline&source=dashboard",
    );
  }

  const timeline = await getSubscriberTimeline(subscriberId, 7);

  return (
    <main className="shell">
      <div className="card">
        <p className="eyebrow">Subscriber Dashboard</p>
        <h1>7-day timeline</h1>
        <p className="lede">
          See what the trial emails and check-in workflow will do over the next 7 days. The
          compressed view maps 1 day to 1 minute so you can preview the sequence quickly.
        </p>
        <div className="actions" style={{ marginTop: 16 }}>
          <Link href="/dashboard" className="button secondary">
            Back to Dashboard
          </Link>
        </div>
      </div>

      <TimelineClient initialTimeline={timeline} />
    </main>
  );
}

