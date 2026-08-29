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
import {
  PRIVACY_CHOICE_CATEGORIES,
  PRIVACY_CHOICES_FOOTER_LINK,
  PRIVACY_CHOICES_SAVED_MESSAGE,
} from "@/lib/constants";
import { LEGAL_ENTITY_PLACEHOLDERS } from "@/lib/legal-placeholders";

const SUPPORT_EMAIL = LEGAL_ENTITY_PLACEHOLDERS.SUPPORT_EMAIL;

const STORAGE_KEY = "wh:privacy-choices:v1" as const;
const COOKIE_NAME = "wh_privacy_choices_v1" as const;

type CategoryKey = keyof typeof PRIVACY_CHOICE_CATEGORIES;

type PrivacyChoices = Record<CategoryKey, boolean>;

const DEFAULT_CHOICES: PrivacyChoices = {
  necessary: true,
  analytics: false,
  advertising: false,
  saleSharing: false,
};

type PrivacyChoicesContextValue = {
  open: () => void;
  close: () => void;
  save: (choices: PrivacyChoices) => void;
  reset: () => void;
  state: {
    open: boolean;
    choices: PrivacyChoices;
    savedAt: string | null;
  };
};

const PrivacyChoicesContext = createContext<PrivacyChoicesContextValue | null>(null);

function readStoredChoices(): { choices: PrivacyChoices; savedAt: string | null } {
  if (typeof window === "undefined") return { choices: DEFAULT_CHOICES, savedAt: null };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { choices: DEFAULT_CHOICES, savedAt: null };
    const parsed = JSON.parse(raw) as Partial<{ choices: PrivacyChoices; savedAt: string }>;
    if (!parsed.choices) return { choices: DEFAULT_CHOICES, savedAt: null };
    const choices: PrivacyChoices = {
      necessary: true,
      analytics: !!parsed.choices.analytics,
      advertising: !!parsed.choices.advertising,
      saleSharing: !!parsed.choices.saleSharing,
    };
    return { choices, savedAt: parsed.savedAt ?? null };
  } catch {
    return { choices: DEFAULT_CHOICES, savedAt: null };
  }
}

function writeStoredChoices(choices: PrivacyChoices) {
  if (typeof document === "undefined") return;
  const savedAt = new Date().toISOString();
  const payload = JSON.stringify({ choices, savedAt });
  try {
    window.localStorage.setItem(STORAGE_KEY, payload);
  } catch {
    /* ignore storage errors */
  }
  const cookieValue = encodeURIComponent(payload);
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${COOKIE_NAME}=${cookieValue}; path=/; SameSite=Lax; max-age=${maxAge}`;
}

export function PrivacyChoicesModalProvider({ children }: { children: ReactNode }) {
  const storedInitial = readStoredChoices();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [choices, setChoices] = useState<PrivacyChoices>(storedInitial.choices);
  const [savedAt, setSavedAt] = useState<string | null>(storedInitial.savedAt);

  useEffect(() => {
    setMounted(true);
    const rehydrated = readStoredChoices();
    setChoices(rehydrated.choices);
    setSavedAt(rehydrated.savedAt);
  }, []);

  const open = useCallback(() => {
    const rehydrated = readStoredChoices();
    setChoices(rehydrated.choices);
    setSavedAt(rehydrated.savedAt);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  const save = useCallback((next: PrivacyChoices) => {
    const locked: PrivacyChoices = { ...next, necessary: true };
    setChoices(locked);
    writeStoredChoices(locked);
    setSavedAt(new Date().toISOString());
  }, []);

  const reset = useCallback(() => {
    setChoices(DEFAULT_CHOICES);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    if (typeof document !== "undefined") {
      document.cookie = `${COOKIE_NAME}=; path=/; SameSite=Lax; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    }
    setSavedAt(null);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
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
  }, [isOpen, close]);

  const ctxValue = useMemo<PrivacyChoicesContextValue>(
    () => ({ open, close, save, reset, state: { open: isOpen, choices, savedAt } }),
    [open, close, save, reset, isOpen, choices, savedAt],
  );

  return (
    <PrivacyChoicesContext.Provider value={ctxValue}>
      {children}
      {mounted
        ? createPortal(
            <PrivacyChoicesModalDialog />,
            typeof document !== "undefined" ? document.body : (null as unknown as HTMLElement),
          )
        : null}
    </PrivacyChoicesContext.Provider>
  );
}

function usePrivacyChoices() {
  const ctx = useContext(PrivacyChoicesContext);
  if (!ctx) {
    throw new Error("usePrivacyChoices must be used within PrivacyChoicesModalProvider");
  }
  return ctx;
}

export function YourPrivacyChoicesButton({
  className,
  variant = "link",
}: {
  className?: string;
  variant?: "link" | "button";
}) {
  const { open } = usePrivacyChoices();
  const base =
    variant === "button"
      ? "button secondary"
      : "footer-link-button";
  return (
    <button
      type="button"
      className={`${base} ${className ?? ""}`}
      onClick={open}
      aria-label="Open Your Privacy Choices preference center"
    >
      {variant === "link" ? (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <svg
            viewBox="0 0 24 24"
            width="12"
            height="12"
            aria-hidden="true"
            fill="currentColor"
            style={{ opacity: 0.85 }}
          >
            <path d="M12 1l2.9 4.4L20 6.4l-3.2 3.5L17.5 15 12 12.8 6.5 15l0.7-5.1L4 6.4l5.1-1L12 1z" />
          </svg>
          {PRIVACY_CHOICES_FOOTER_LINK}
        </span>
      ) : (
        PRIVACY_CHOICES_FOOTER_LINK
      )}
    </button>
  );
}

function PrivacyChoicesModalDialog() {
  const ctx = usePrivacyChoices();
  const { open: isOpen, choices: stored, savedAt } = ctx.state;
  const [draft, setDraft] = useState<PrivacyChoices>(stored);
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    setDraft(stored);
    setMessage("");
  }, [isOpen, stored]);

  if (!isOpen) return null;

  const toggle = (key: CategoryKey) => {
    if (PRIVACY_CHOICE_CATEGORIES[key].alwaysOn) return;
    setDraft((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const acceptAll = () => {
    setDraft({ necessary: true, analytics: true, advertising: true, saleSharing: true });
  };

  const rejectAll = () => {
    setDraft({ necessary: true, analytics: false, advertising: false, saleSharing: false });
  };

  const onSave = () => {
    ctx.save(draft);
    setMessage(PRIVACY_CHOICES_SAVED_MESSAGE);
    setTimeout(() => setMessage(""), 2400);
    setTimeout(() => ctx.close(), 900);
  };

  return (
    <div
      className="share-modal privacy-choices-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-choices-title"
      aria-describedby="privacy-choices-desc"
      onClick={(e) => {
        if (e.target === e.currentTarget) ctx.close();
      }}
    >
      <div className="share-modal-overlay" />
      <div className="share-dialog privacy-choices-dialog" role="document">
        <div className="share-dialog-head">
          <h2 id="privacy-choices-title" className="share-dialog-title">
            {PRIVACY_CHOICES_FOOTER_LINK}
          </h2>
          <button
            type="button"
            aria-label="Close privacy choices dialog"
            className="share-dialog-close"
            onClick={ctx.close}
          >
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <p
          id="privacy-choices-desc"
          className="section-meta"
          style={{ marginTop: 12, marginBottom: 12 }}
        >
          Manage your preferences for non-essential technologies. Depending on your jurisdiction,
          certain categories (Targeted Advertising, Sale/Sharing) may be treated as opt-out by
          default. You can update these choices at any time.
        </p>

        <div className="privacy-choices-actions" style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <button type="button" className="button tertiary" onClick={acceptAll}>
            Accept All
          </button>
          <button type="button" className="button tertiary" onClick={rejectAll}>
            Reject Non-Essential
          </button>
          <button type="button" className="button tertiary" onClick={ctx.reset}>
            Reset Saved Choices
          </button>
        </div>

        <div className="privacy-choices-categories" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {(Object.keys(PRIVACY_CHOICE_CATEGORIES) as CategoryKey[]).map((key) => {
            const meta = PRIVACY_CHOICE_CATEGORIES[key];
            const checked = meta.alwaysOn ? true : draft[key];
            const disabled = meta.alwaysOn;
            return (
              <div
                key={key}
                className="privacy-choice-card"
                style={{
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 12,
                  padding: "14px 16px",
                  background: "rgba(255,255,255,0.03)",
                }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                    cursor: disabled ? "not-allowed" : "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={disabled}
                    onChange={() => toggle(key)}
                    style={{ marginTop: 4 }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <strong style={{ fontSize: 14 }}>{meta.title}</strong>
                      {meta.alwaysOn ? (
                        <span
                          style={{
                            fontSize: 11,
                            padding: "2px 8px",
                            borderRadius: 999,
                            background: "rgba(255,255,255,0.08)",
                            color: "#a8b0c5",
                          }}
                        >
                          Always active
                        </span>
                      ) : null}
                    </div>
                    <p className="section-meta" style={{ marginTop: 6, marginBottom: 0, fontSize: 13 }}>
                      {meta.description}
                    </p>
                  </div>
                </label>
              </div>
            );
          })}
        </div>

        <div
          className="privacy-choices-cta-row"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginTop: 20,
            flexWrap: "wrap",
          }}
        >
          <p className="section-meta" style={{ margin: 0, fontSize: 12 }}>
            {savedAt ? `Last saved: ${new Date(savedAt).toLocaleString()}` : "No saved preferences yet."}{" "}
            <a
              href="/privacy#cookies-choices"
              className="inline-link"
              style={{ fontSize: 12 }}
              onClick={(e) => {
                e.preventDefault();
                ctx.close();
                if (typeof window !== "undefined") {
                  window.location.href = "/privacy#cookies-choices";
                }
              }}
            >
              Learn more in the Privacy Policy
            </a>
            . For additional privacy requests, email{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="inline-link" style={{ fontSize: 12 }}>
              {SUPPORT_EMAIL}
            </a>
            .
          </p>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {message ? (
              <span
                className="contact-form-status"
                style={{
                  fontSize: 13,
                  color: "#7be3a9",
                  fontWeight: 600,
                }}
              >
                {message}
              </span>
            ) : null}
            <button type="button" className="button tertiary" onClick={ctx.close}>
              Close
            </button>
            <button type="button" className="button primary" onClick={onSave}>
              Save My Choices
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
