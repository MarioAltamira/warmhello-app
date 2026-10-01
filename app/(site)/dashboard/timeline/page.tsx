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
        <div style={{ display: "flex", gap: 14, justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 auto", minWidth: 260 }}>
            <p className="eyebrow">Subscriber Dashboard</p>
            <h1 style={{ marginTop: 8 }}>7-day timeline</h1>
            <p className="lede" style={{ marginTop: 8 }}>
              See what the trial emails and check-in workflow will do over the next 7 days.
              The compressed view maps 1 day to 1 minute so you can preview the sequence quickly.
            </p>
          </div>
          <div className="actions" style={{ marginTop: 2, gap: 10 }}>
            <a
              href="/dashboard"
              className="button secondary"
              data-force-navigation="reload"
            >
              Back to Dashboard
            </a>
          </div>
        </div>
      </div>

      <TimelineClient initialTimeline={timeline} />
    </main>
  );
}

