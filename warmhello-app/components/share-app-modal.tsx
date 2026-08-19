"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

type ShareModalState = {
  open: boolean;
  defaultUrl: string;
  defaultTitle: string;
  defaultText: string;
};

type ShareModalContextValue = {
  open: (opts?: { url?: string; title?: string; text?: string }) => void;
  close: () => void;
  state: ShareModalState;
};

const ShareModalContext = createContext<ShareModalContextValue | null>(null);

const DEFAULT_STATE: ShareModalState = {
  open: false,
  defaultUrl: "",
  defaultTitle: "Warm-Hello",
  defaultText:
    "Warm-Hello - Gentle daily SMS check-ins for seniors living alone. One-tap safety confirmation, automatic family escalation.",
};

type SocialTile = {
  id:
    | "facebook"
    | "youtube"
    | "instagram"
    | "tiktok"
    | "x"
    | "pinterest"
    | "linkedin";
  label: string;
  glyph: ReactNode;
};

const TILES_ROW_1: SocialTile[] = [
  {
    id: "facebook",
    label: "Facebook",
    glyph: (
      <svg viewBox="0 0 24 24" aria-hidden="true" width="32" height="32" fill="currentColor">
        <path d="M13.5 22v-8h2.7l0.4-3.2h-3.1V8.8c0-0.9 0.3-1.6 1.6-1.6h1.7V4.3c-0.3 0-1.3-0.1-2.5-0.1-2.5 0-4.2 1.5-4.2 4.2v2.4H7.5V14h2.6v8h3.4z" />
      </svg>
    ),
  },
  {
    id: "youtube",
    label: "YouTube",
    glyph: (
      <svg viewBox="0 0 24 24" aria-hidden="true" width="36" height="30" fill="currentColor">
        <path d="M23.5 7.3c-0.3-1-1-1.8-2-2C19.5 5 12 5 12 5s-7.5 0-9.5 0.3c-1 0.2-1.8 1-2 2C0.3 9.4 0.3 12 0.3 12s0 2.6 0.2 4.7c0.3 1 1 1.8 2 2 2 0.3 9.5 0.3 9.5 0.3s7.5 0 9.5-0.3c1-0.2 1.8-1 2-2C23.7 14.6 23.7 12 23.7 12s0-2.6-0.2-4.7zM9.7 15.4V8.6l6.2 3.4-6.2 3.4z" />
      </svg>
    ),
  },
  {
    id: "instagram",
    label: "Instagram",
    glyph: (
      <svg viewBox="0 0 24 24" aria-hidden="true" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
      </svg>
    ),
  },
];

const TILES_ROW_2: SocialTile[] = [
  {
    id: "tiktok",
    label: "TikTok",
    glyph: (
      <svg viewBox="0 0 24 24" aria-hidden="true" width="32" height="32" fill="currentColor">
        <path d="M19.5 6.5c-2.7-0.4-4.7-2.7-4.9-5.5h-3.4v12.3c-0.8 0.5-1.7 0.7-2.7 0.7-2.2 0-4-1.8-4-4s1.8-4 4-4c0.3 0 0.7 0 1 0.1V8.6c-0.3-0.1-0.7-0.1-1-0.1-3.9 0-7.1 3.2-7.1 7.1s3.2 7.1 7.1 7.1c3.7 0 6.7-2.9 7.1-6.4v-4.3c1 0.7 2.2 1.1 3.5 1.1V9.7c-1 0-1.9-0.3-2.7-0.9v-2.3z" />
      </svg>
    ),
  },
  {
    id: "x",
    label: "X",
    glyph: (
      <svg viewBox="0 0 24 24" aria-hidden="true" width="32" height="32" fill="currentColor">
        <path d="M18.5 3h3.4l-7.4 8.4 8.7 11.6h-6.8l-5.4-7-6.1 7H1.6l7.9-9L1.2 3h7l4.8 6.4L18.5 3zm-1.2 16.6h1.9L6.8 4.3h-2l12.5 15.3z" />
      </svg>
    ),
  },
  {
    id: "pinterest",
    label: "Pinterest",
    glyph: (
      <svg viewBox="0 0 24 24" aria-hidden="true" width="32" height="32" fill="currentColor">
        <path d="M12 0.5c-6.3 0-11.5 5.1-11.5 11.5 0 4.9 3 9.1 7.3 10.8-0.1-0.9-0.2-2.4 0-3.4 0.2-0.9 1.3-5.7 1.3-5.7s-0.3-0.6-0.3-1.5c0-1.4 0.8-2.5 1.8-2.5 0.9 0 1.3 0.7 1.3 1.5 0 0.9-0.6 2.2-0.9 3.5-0.3 1 0.5 1.9 1.5 1.9 1.8 0 3.2-1.9 3.2-4.8 0-2.5-1.8-4.3-4.4-4.3-3.1 0-4.9 2.3-4.9 4.7 0 0.9 0.3 1.9 0.7 2.5 0.1 0.1 0.1 0.2 0 0.3-0.1 0.3-0.3 1-0.3 1.2-0.1 0.2-0.2 0.3-0.3 0.2-0.9-0.4-1.4-1.7-1.4-2.8 0-2.3 1.7-4.4 4.8-4.4 2.5 0 4.4 1.8 4.4 4.1 0 2.5-1.5 4.4-3.7 4.4-0.7 0-1.3-0.4-1.5-0.8l-0.4 1.6c-0.2 0.6-0.5 1.3-0.8 1.8 0.6 0.2 1.3 0.3 2 0.3 6.3 0 11.5-5.1 11.5-11.5S18.3 0.5 12 0.5z" />
      </svg>
    ),
  },
];

const TILE_LINKEDIN: SocialTile = {
  id: "linkedin",
  label: "LinkedIn",
  glyph: (
    <svg viewBox="0 0 24 24" aria-hidden="true" width="32" height="32" fill="currentColor">
      <path d="M20.5 2h-17C2.7 2 2 2.7 2 3.5v17c0 0.8 0.7 1.5 1.5 1.5h17c0.8 0 1.5-0.7 1.5-1.5v-17C22 2.7 21.3 2 20.5 2zM8 19H5V9h3V19zM6.5 7.7c-0.9 0-1.7-0.7-1.7-1.7s0.7-1.6 1.7-1.6c0.9 0 1.6 0.7 1.6 1.6S7.5 7.7 6.5 7.7zM19 19h-3v-4.7c0-1.1 0-2.6-1.6-2.6-1.6 0-1.9 1.2-1.9 2.5V19h-3V9h2.9v1.4h0c0.4-0.8 1.4-1.6 2.9-1.6 3.1 0 3.7 2.1 3.7 4.7V19z" />
    </svg>
  ),
};

function intentUrlFor(tileId: SocialTile["id"], args: { url: string; title: string; text: string }) {
  const { url, text } = args;
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(`${args.title}: ${text}`);
  switch (tileId) {
    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
    case "youtube":
      return `https://www.youtube.com/results?search_query=${encodeURIComponent("Warm-Hello gentle daily check-ins for seniors")}`;
    case "instagram":
      return `https://www.instagram.com/`;
    case "tiktok":
      return `https://www.tiktok.com/`;
    case "x":
      return `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`;
    case "pinterest":
      return `https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedText}`;
    case "linkedin":
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
  }
}

export function ShareAppModalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ShareModalState>(DEFAULT_STATE);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const open = useCallback<ShareModalContextValue["open"]>((opts) => {
    setState((prev) => ({
      open: true,
      defaultUrl: opts?.url ?? typeof window !== "undefined" ? window.location.href : "",
      defaultTitle: opts?.title ?? DEFAULT_STATE.defaultTitle,
      defaultText: opts?.text ?? DEFAULT_STATE.defaultText,
    }));
  }, []);

  const close = useCallback(() => {
    setState((prev) => ({ ...prev, open: false }));
  }, []);

  useEffect(() => {
    if (!state.open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    const prior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prior;
    };
  }, [state.open, close]);

  const ctxValue = useMemo<ShareModalContextValue>(
    () => ({ open, close, state }),
    [open, close, state],
  );

  return (
    <ShareModalContext.Provider value={ctxValue}>
      {children}
      {mounted
        ? createPortal(
            <ShareAppModal />,
            typeof document !== "undefined" ? document.body : (null as unknown as HTMLElement),
          )
        : null}
    </ShareModalContext.Provider>
  );
}

function useShareModal() {
  const ctx = useContext(ShareModalContext);
  if (!ctx) {
    throw new Error("useShareModal must be used within ShareAppModalProvider");
  }
  return ctx;
}

export function ShareAppButton({
  label = "Share",
  className,
}: {
  label?: string;
  className?: string;
}) {
  const { open } = useShareModal();
  return (
    <button
      type="button"
      onClick={() => open()}
      className={`button secondary site-header-button share-button ${className ?? ""}`}
      aria-label="Share Warm-Hello"
    >
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="currentColor" style={{ marginRight: 6 }}>
        <path d="M18 16c-0.9 0-1.7 0.4-2.3 1l-7.1-4.1c0.1-0.3 0.2-0.6 0.2-0.9s-0.1-0.6-0.2-0.9L15.6 7c0.7 0.6 1.5 1 2.4 1 1.9 0 3.5-1.6 3.5-3.5S19.9 1 18 1s-3.5 1.6-3.5 3.5c0 0.3 0.1 0.6 0.2 0.9L7.6 9.5C6.9 8.9 6 8.5 5 8.5 3.1 8.5 1.5 10.1 1.5 12s1.6 3.5 3.5 3.5c1 0 1.9-0.4 2.6-1l7.2 4.2c-0.1 0.3-0.2 0.6-0.2 0.9 0 1.7 1.4 3.1 3.1 3.1S21 19.7 21 18s-1.4-3-3-3h0z" />
      </svg>
      {label}
    </button>
  );
}

function ShareAppModal() {
  const { state, close } = useShareModal();
  const [url, setUrl] = useState(state.defaultUrl);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setUrl(state.defaultUrl || window.location.href);
    }
  }, [state.open, state.defaultUrl]);

  if (!state.open) return null;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  };

  const onWebShare = async () => {
    if (!("share" in navigator)) return;
    try {
      await navigator.share({
        title: state.defaultTitle,
        text: state.defaultText,
        url,
      });
      close();
    } catch {
      /* user cancel */
    }
  };

  const onTile = (tile: SocialTile) => {
    const intent = intentUrlFor(tile.id, {
      url,
      title: state.defaultTitle,
      text: state.defaultText,
    });
    window.open(intent, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      className="share-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="share-modal-overlay" />
      <div className="share-dialog" role="document">
        <div className="share-dialog-head">
          <h2 id="share-modal-title" className="share-dialog-title">
            Share this App
          </h2>
          <button
            type="button"
            aria-label="Close share dialog"
            className="share-dialog-close"
            onClick={close}
          >
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="share-copy-row">
          <div className="share-copy-input-wrap">
            <input
              type="url"
              className="share-copy-input"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onFocus={(e) => e.currentTarget.select()}
              aria-label="Share link URL"
              readOnly
            />
          </div>
          <button
            type="button"
            className={`share-copy-button ${copied ? "copied" : ""}`}
            onClick={copyLink}
          >
            {copied ? "Copied!" : "Copy link"}
          </button>
        </div>

        {typeof navigator !== "undefined" && "share" in navigator ? (
          <div className="share-webshare-row">
            <button type="button" className="share-webshare-button" onClick={onWebShare}>
              Use device share sheet
            </button>
          </div>
        ) : null}

        <div className="share-tiles">
          {TILES_ROW_1.map((tile) => (
            <button
              key={tile.id}
              type="button"
              className={`share-tile share-tile-${tile.id}`}
              onClick={() => onTile(tile)}
              aria-label={`Share via ${tile.label}`}
            >
              <div className="share-tile-icon">{tile.glyph}</div>
              <div className="share-tile-label">{tile.label}</div>
            </button>
          ))}
        </div>

        <div className="share-tiles">
          {TILES_ROW_2.map((tile) => (
            <button
              key={tile.id}
              type="button"
              className={`share-tile share-tile-${tile.id}`}
              onClick={() => onTile(tile)}
              aria-label={`Share via ${tile.label}`}
            >
              <div className="share-tile-icon">{tile.glyph}</div>
              <div className="share-tile-label">{tile.label}</div>
            </button>
          ))}
        </div>

        <div className="share-tiles share-tiles-center">
          <button
            key={TILE_LINKEDIN.id}
            type="button"
            className={`share-tile share-tile-${TILE_LINKEDIN.id}`}
            onClick={() => onTile(TILE_LINKEDIN)}
            aria-label={`Share via ${TILE_LINKEDIN.label}`}
          >
            <div className="share-tile-icon">{TILE_LINKEDIN.glyph}</div>
            <div className="share-tile-label">{TILE_LINKEDIN.label}</div>
          </button>
        </div>
      </div>
    </div>
  );
}
