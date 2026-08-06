"use client";

import { useEffect, useState } from "react";
import {
  BillingCurrency,
  CURRENCY_COOKIE_MAX_AGE,
  CURRENCY_COOKIE_NAME,
  CURRENCY_SWITCH_OPTIONS,
  isBillingCurrency,
} from "@/lib/pricing";

type CurrencyToggleProps = {
  initial?: BillingCurrency | string | null;
  onChanged?: (next: BillingCurrency) => void;
  compact?: boolean;
};

function getInitialValue(initial: BillingCurrency | string | null | undefined): BillingCurrency {
  if (initial && isBillingCurrency(initial)) return initial;
  if (typeof document !== "undefined") {
    const match = document.cookie
      .split("; ")
      .map((chunk) => chunk.split("="))
      .find(([name]) => name === CURRENCY_COOKIE_NAME);
    const fromCookie = match ? decodeURIComponent(match[1]) : null;
    if (isBillingCurrency(fromCookie)) return fromCookie;
  }
  const lang = (typeof navigator !== "undefined" && navigator.language) || "";
  if (/(-ca|fr-ca|en-ca)/i.test(lang)) return "CAD";
  return "USD";
}

export function CurrencyToggle({ initial, onChanged, compact }: CurrencyToggleProps) {
  const [value, setValue] = useState<BillingCurrency>(() => getInitialValue(initial));

  useEffect(() => {
    if (initial && isBillingCurrency(initial)) {
      setValue((current) => (current === initial ? current : initial));
    }
  }, [initial]);

  function handleChange(nextRaw: BillingCurrency) {
    const next = isBillingCurrency(nextRaw) ? nextRaw : "USD";
    setValue(next);
    document.cookie = `${CURRENCY_COOKIE_NAME}=${encodeURIComponent(next)}; path=/; max-age=${CURRENCY_COOKIE_MAX_AGE}; SameSite=Lax`;
    onChanged?.(next);
    // Reload so all SSR pricing copy updates server-side too without a full SPA rewrite.
    window.location.reload();
  }

  if (compact) {
    return (
      <div className="currency-toggle currency-toggle-compact" aria-label="Currency">
        {CURRENCY_SWITCH_OPTIONS.map((option) => {
          const selected = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              className={selected ? "currency-chip currency-chip-active" : "currency-chip"}
              onClick={() => handleChange(option.value)}
              title={option.label}
            >
              <span aria-hidden>{option.flag}</span>
              <span>{option.value}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="currency-toggle" role="radiogroup" aria-label="Display currency">
      <p className="currency-toggle-label">Displaying in</p>
      <div className="currency-toggle-row">
        {CURRENCY_SWITCH_OPTIONS.map((option) => {
          const selected = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              className={selected ? "currency-chip currency-chip-active" : "currency-chip"}
              onClick={() => handleChange(option.value)}
            >
              <span aria-hidden>{option.flag}</span>
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default CurrencyToggle;
