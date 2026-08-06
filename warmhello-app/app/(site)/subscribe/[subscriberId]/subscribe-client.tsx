"use client";

import { useEffect, useState } from "react";

export default function SubscribeClient({ subscriberId }: { subscriberId: string }) {
  const [status, setStatus] = useState<string>("Taking you to checkout...");
  const [failed, setFailed] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      try {
        const res = await fetch(`/api/subscribe/${encodeURIComponent(subscriberId)}`, {
          method: "POST",
        });
        const data = (await res.json()) as {
          ok?: boolean;
          url?: string | null;
          message?: string;
        };
        if (cancelled) {
          return;
        }
        if (!res.ok || !data.ok || !data.url) {
          setFailed(true);
          setStatus(data.message ?? "Checkout is not available right now.");
          return;
        }
        window.location.href = data.url;
      } catch {
        if (cancelled) {
          return;
        }
        setFailed(true);
        setStatus("We could not start checkout right now.");
      }
    }

    void start();

    return () => {
      cancelled = true;
    };
  }, [subscriberId]);

  async function retry() {
    setFailed(false);
    setStatus("Taking you to checkout...");
    try {
      const res = await fetch(`/api/subscribe/${encodeURIComponent(subscriberId)}`, {
        method: "POST",
      });
      const data = (await res.json()) as {
        ok?: boolean;
        url?: string | null;
        message?: string;
      };
      if (!res.ok || !data.ok || !data.url) {
        setFailed(true);
        setStatus(data.message ?? "Checkout is not available right now.");
        return;
      }
      window.location.href = data.url;
    } catch {
      setFailed(true);
      setStatus("We could not start checkout right now.");
    }
  }

  return (
    <>
      <p style={{ marginTop: 12 }}>{status}</p>
      {failed ? (
        <div className="actions" style={{ marginTop: 20, justifyContent: "center" }}>
          <button type="button" className="button primary" onClick={() => void retry()}>
            Activate your Warm-Hello subscription here
          </button>
          <a href="/dashboard" className="button secondary">
            Back to Dashboard
          </a>
        </div>
      ) : null}
    </>
  );
}
