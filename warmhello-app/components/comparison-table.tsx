import {
  PRICING_PLANS,
  pricingPlanFor,
  type BillingCurrency,
} from "@/lib/pricing";

type Column = "warmhello" | "pers" | "callcenter";

type RowCell = {
  /** If plain text: render as p. If 'check' render green-check, if 'dash' render n/a dash */
  value: string;
  variant?: "default" | "check" | "dash" | "highlight";
};

type ComparisonRow = {
  feature: string;
  warmhello: RowCell;
  pers: RowCell;
  callcenter: RowCell;
};

const COLS: { key: Column; label: string; sub: string }[] = [
  {
    key: "warmhello",
    label: "Warm-Hello",
    sub: "Gentle morning SMS check-ins",
  },
  {
    key: "pers",
    label: "Traditional PERS",
    sub: "Pendant / medical-alert style system",
  },
  {
    key: "callcenter",
    label: "Call-Center Check-In",
    sub: "Operator calls every morning",
  },
];

const TICK = "✓";
const DASH = "—";

function buildRows(currency: BillingCurrency): ComparisonRow[] {
  const plan = pricingPlanFor(currency);
  const other =
    currency === "USD" ? PRICING_PLANS.CAD : PRICING_PLANS.USD;
  const costCell: RowCell = {
    variant: "highlight",
    value: `${plan.currency} ${plan.monthlyLabel.replace(
      new RegExp(`^${plan.currency}\\s+`, "i"),
      "",
    )} · ${plan.dailyLabel.replace(
      new RegExp(`^${plan.currency}\\s+`, "i"),
      "",
    )} · billed ${plan.yearlyLabel.replace(
      new RegExp(`^${plan.currency}\\s+`, "i"),
      "",
    )} (or ${other.currency} $${other.monthlyAmount.toFixed(2)} per month · $${other.dailyAmount.toFixed(2)} per day · billed $${other.yearlyAmount.toFixed(2)} per year for ${other.currency === "USD" ? "United States" : "Canada"} customers)`,
  };

  return [
    {
      feature: "Hardware required",
      warmhello: { value: "None - works on any phone with SMS" },
      pers: { value: "Pendant or wristband + base station" },
      callcenter: { value: "None - landline or mobile works" },
    },
    {
      feature: "What the senior does",
      warmhello: {
        value: "Taps one secure link in a text then one large I'm-OK button",
      },
      pers: { value: "Wears a button and presses it only in an emergency" },
      callcenter: { value: "Answers the phone and talks to an operator" },
    },
    {
      feature: "Routine check-ins every morning",
      warmhello: { variant: "check", value: TICK + " - every day at a time you set" },
      pers: { variant: "dash", value: DASH + " - event-based, button press only" },
      callcenter: { variant: "check", value: TICK + " - scheduled daily call window" },
    },
    {
      feature: "Escalation after missed checks",
      warmhello: {
        variant: "check",
        value:
          TICK +
          " - gentle reminder after 1 hour, family alerted by SMS & email after 2 misses",
      },
      pers: {
        value:
          "Operator dispatch only if the button is pressed; no daily reassurance",
      },
      callcenter: {
        value:
          "Follows internal protocol after a no-answer (often a secondary contact list only)",
      },
    },
    {
      feature: "How it feels for the senior",
      warmhello: { value: "A quick morning wave - warm, not clinical" },
      pers: { value: "Medical-style pendant - often feels like a hospital device" },
      callcenter: { value: "Forced call with a stranger reading a script" },
    },
    {
      feature: "Monthly cost for families",
      warmhello: costCell,
      pers: { value: "$30 – $50/month + equipment fees + contracts" },
      callcenter: { value: "$15 – $30/month, usually annual commitments" },
    },
    {
      feature: "Cancel anytime, no fees",
      warmhello: { variant: "check", value: TICK + " - dashboard, one click" },
      pers: { variant: "dash", value: DASH + " - 1–3 year contracts are standard" },
      callcenter: {
        value:
          "Often 30/60-day notice required + early-termination recovery fees",
      },
    },
  ];
}

type Props = {
  currency: BillingCurrency;
};

export function ComparisonTable({ currency }: Props) {
  const rows = buildRows(currency);

  return (
    <div className="comparison-wrap" role="table" aria-label="Compare Warm-Hello against medical-alert pendants and call-center daily check-ins">
      <div className="comparison-head" role="rowgroup">
        <div className="comparison-row comparison-row-head" role="row">
          <div className="comparison-cell comparison-corner" role="columnheader">
            Feature
          </div>
          {COLS.map((col) => (
            <div
              key={col.key}
              className={`comparison-cell comparison-head-cell comparison-head-${col.key}`}
              role="columnheader"
              aria-colspan={1}
            >
              <div className="comparison-head-title">{col.label}</div>
              <div className="comparison-head-sub">{col.sub}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="comparison-body" role="rowgroup">
        {rows.map((row) => (
          <div
            key={row.feature}
            className="comparison-row"
            role="row"
          >
            <div className="comparison-cell comparison-feature" role="rowheader">
              {row.feature}
            </div>
            <div
              className={`comparison-cell comparison-value comparison-value-warmhello ${
                row.warmhello.variant === "check"
                  ? "is-check"
                  : row.warmhello.variant === "highlight"
                    ? "is-highlight"
                    : ""
              }`}
              role="cell"
            >
              <p className="comparison-cell-text">{row.warmhello.value}</p>
            </div>
            <div
              className={`comparison-cell comparison-value ${
                row.pers.variant === "check" ? "is-check" : row.pers.variant === "dash" ? "is-dash" : ""
              }`}
              role="cell"
            >
              <p className="comparison-cell-text">{row.pers.value}</p>
            </div>
            <div
              className={`comparison-cell comparison-value ${
                row.callcenter.variant === "check"
                  ? "is-check"
                  : row.callcenter.variant === "dash"
                    ? "is-dash"
                    : ""
              }`}
              role="cell"
            >
              <p className="comparison-cell-text">{row.callcenter.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
