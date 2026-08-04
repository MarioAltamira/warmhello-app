"use client";

import { useMemo, useState } from "react";
import type { SubscriberTimeline, TimelineEvent } from "@/lib/timeline";

type TimelineClientProps = {
  initialTimeline: SubscriberTimeline;
};

function formatChannel(channel: TimelineEvent["channel"]) {
  return channel === "email" ? "Email" : "SMS";
}

function formatKind(kind: string) {
  return kind
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function TimelineClient({ initialTimeline }: TimelineClientProps) {
  const [timeline, setTimeline] = useState(initialTimeline);
  const [useSimulation, setUseSimulation] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const events = useMemo(() => timeline.events, [timeline.events]);
  const smsHistory = useMemo(() => timeline.smsHistory, [timeline.smsHistory]);

  async function refresh() {
    setBusy("refresh");
    setNotice(null);
    try {
      const res = await fetch("/api/timeline?days=7", { cache: "no-store" });
      const data = (await res.json()) as { ok: boolean; message?: string; timeline?: SubscriberTimeline };
      if (!data.ok || !data.timeline) {
        setNotice(data.message ?? "Could not load timeline.");
        return;
      }
      setTimeline(data.timeline);
    } finally {
      setBusy(null);
    }
  }

  async function runAction(action: "trial-welcome" | "trial-nudge" | "trial-final" | "checkin-now") {
    setBusy(action);
    setNotice(null);
    try {
      const res = await fetch(`/api/timeline/actions/${action}`, { method: "POST" });
      const data = (await res.json()) as { ok: boolean; message?: string };
      if (!res.ok || !data.ok) {
        setNotice(data.message ?? "Action failed.");
        return;
      }
      setNotice("Done.");
      await refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="card" style={{ marginTop: 24 }}>
      <div className="actions" style={{ justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div className="actions" style={{ gap: 12, flexWrap: "wrap" }}>
          <button
            type="button"
            className="button secondary"
            onClick={() => setUseSimulation((value) => !value)}
          >
            {useSimulation ? "Showing compressed timeline" : "Showing real timeline"}
          </button>
          <button
            type="button"
            className="button secondary"
            onClick={() => void refresh()}
            disabled={busy !== null}
          >
            Refresh
          </button>
        </div>

        <div className="actions" style={{ gap: 12, flexWrap: "wrap" }}>
          <button
            type="button"
            className="button secondary"
            onClick={() => void runAction("trial-welcome")}
            disabled={busy !== null}
          >
            Send Trial Welcome Now
          </button>
          <button
            type="button"
            className="button secondary"
            onClick={() => void runAction("trial-nudge")}
            disabled={busy !== null}
          >
            Send Trial Nudge Now
          </button>
          <button
            type="button"
            className="button secondary"
            onClick={() => void runAction("trial-final")}
            disabled={busy !== null}
          >
            Send Trial Final Now
          </button>
          <button
            type="button"
            className="button primary"
            onClick={() => void runAction("checkin-now")}
            disabled={busy !== null}
          >
            Send Check-In Now
          </button>
        </div>
      </div>

      {notice ? <p style={{ marginTop: 12 }}>{notice}</p> : null}

      <div className="card" style={{ marginTop: 16 }}>
        <p className="eyebrow">Next 7 days</p>
        <h2 style={{ marginTop: 8 }}>Scheduled + projected messages</h2>

        <div className="status-list" style={{ marginTop: 16 }}>
          {events.length === 0 ? (
            <p>No upcoming activity found yet.</p>
          ) : (
            events.map((event) => (
              <div key={event.id} className="status-row" style={{ gap: 16 }}>
                <span style={{ flex: 1 }}>
                  {formatChannel(event.channel)} · {formatKind(event.kind)}
                </span>
                <span style={{ width: 220, textAlign: "right" }}>
                  {useSimulation ? event.simulatedLabel : event.scheduledLabel}
                </span>
                <span style={{ width: 110, textAlign: "right" }}>{event.status}</span>
                <span style={{ width: 170, textAlign: "right" }}>
                  {event.actionUrl ? (
                    <a href={event.actionUrl} className="button secondary">
                      Open
                    </a>
                  ) : null}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <p className="eyebrow">Last 7 days</p>
        <h2 style={{ marginTop: 8 }}>SMS delivery log</h2>
        <div className="status-list" style={{ marginTop: 16 }}>
          {smsHistory.length === 0 ? (
            <p>No SMS has been sent yet.</p>
          ) : (
            smsHistory.map((log) => (
              <div key={log.id} className="status-row" style={{ gap: 16, alignItems: "flex-start" }}>
                <span style={{ width: 180 }}>{log.createdLabel}</span>
                <span style={{ width: 80 }}>{log.status}</span>
                <span style={{ width: 120 }}>{log.kind ? formatKind(log.kind) : "SMS"}</span>
                <span style={{ flex: 1, whiteSpace: "pre-wrap" }}>{log.body}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
