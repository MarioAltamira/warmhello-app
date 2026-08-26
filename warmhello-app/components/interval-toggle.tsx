"use client";

import { useCallback } from "react";
import {
  BillingInterval,
  DEFAULT_INTERVAL,
  INTERVAL_SWITCH_OPTIONS,
  isBillingInterval,
} from "@/lib/pricing";

type Props = {
  value: BillingInterval;
  onChange: (next: BillingInterval) => void;
  compact?: boolean;
  className?: string;
};

export function IntervalToggle({ value, onChange, compact, className }: Props) {
  const handleClick = useCallback(
    (next: BillingInterval) => {
      if (!isBillingInterval(next)) return;
      if (next === value) return;
      onChange(next);
    },
    [value, onChange],
  );

  const defaultValue = DEFAULT_INTERVAL;

  return (
    <div
      role="tablist"
      aria-label="Billing frequency"
      className={`interval-toggle-wrap ${compact ? "is-compact" : ""} ${className ?? ""}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: 4,
        borderRadius: 999,
        background: "var(--surface-elevated)",
        border: "1px solid var(--border)",
        gap: 4,
      }}
    >
      {INTERVAL_SWITCH_OPTIONS.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => handleClick(option.value)}
            className={`interval-toggle-option ${active ? "is-active" : ""}`}
            style={{
              padding: compact ? "8px 16px" : "10px 22px",
              borderRadius: 999,
              border: "none",
              cursor: "pointer",
              fontWeight: active ? 600 : 500,
              fontSize: compact ? 13 : 14,
              lineHeight: 1,
              transition: "background 160ms ease, color 160ms ease",
              background: active ? "var(--accent)" : "transparent",
              color: active ? "var(--accent-contrast)" : "var(--text)",
            }}
          >
            {option.label}
            {option.value === "annual" ? (
              <span
                aria-hidden
                style={{
                  display: "inline-block",
                  marginLeft: 8,
                  padding: "2px 8px",
                  borderRadius: 999,
                  fontSize: compact ? 10 : 11,
                  fontWeight: 700,
                  background: active
                    ? "rgba(255,255,255,0.18)"
                    : "color-mix(in oklab, var(--accent) 18%, transparent)",
                  color: active ? "var(--accent-contrast)" : "var(--accent)",
                  letterSpacing: 0.2,
                  textTransform: "uppercase",
                }}
              >
                Save ~20%
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export default IntervalToggle;
