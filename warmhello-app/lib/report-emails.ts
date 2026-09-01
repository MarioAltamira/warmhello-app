import { env } from "@/lib/env";
import { sendEmail } from "@/lib/email";
import type { DailySummary, MonthlySummary } from "@/lib/reports";
import { currencyLabel } from "@/lib/reports";
import { LEGAL_ENTITY_PLACEHOLDERS } from "@/lib/legal-placeholders";

const RECAP_DIRECT_DELIVERY = "warm.hello4s@gmail.com";
const SALES_EMAIL_DISPLAY = "sales@warm-hello.com";
const SUPPORT_EMAIL = SALES_EMAIL_DISPLAY;

function buildLogoHeader(): string {
  return `<p><img src="${env.APP_URL}/warmhello-logo-b.png" alt="Warm-Hello" width="140" /></p>`;
}

function buildReportFooter(): { html: string; text: string } {
  const entity = LEGAL_ENTITY_PLACEHOLDERS.LEGAL_ENTITY_NAME;
  const mailing = LEGAL_ENTITY_PLACEHOLDERS.CA_MAILING_ADDRESS;
  const html = `<div style="margin-top:28px; padding-top:14px; border-top:1px solid #e2e8f0; font-size:12px; color:#59617a; line-height:1.55;">
<p style="margin:0 0 6px 0;">${entity} · ${mailing}</p>
<p style="margin:0;">Questions? Email <a href="mailto:${SUPPORT_EMAIL}" style="color:#59617a;">${SUPPORT_EMAIL}</a>.</p>
<p style="margin:6px 0 0 0;">This is an automated operational report sent by Warm-Hello. Replies go to the sales inbox.</p>
</div>`;
  const text = `\n\n${entity}\n${mailing}\nQuestions? Email ${SUPPORT_EMAIL}\nAutomated operational report.`;
  return { html, text };
}

function kpiRow(label: string, value: string | number, highlight?: string) {
  const color = highlight ?? "#0f172a";
  return `<div style="flex:1 1 0; min-width:140px; padding:10px 14px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; margin:4px;">
<p style="margin:0 0 4px 0; font-size:12px; color:#64748b; font-weight:600; letter-spacing:0.04em; text-transform:uppercase;">${label}</p>
<p style="margin:0; font-size:22px; font-weight:800; color:${color}; line-height:1.1;">${String(value)}</p>
</div>`;
}

function trRow(cells: string[]) {
  return `<tr>${cells.map((c) => `<td style="padding:8px 10px; border-bottom:1px solid #e2e8f0; font-size:13px; color:#0f172a;">${c}</td>`).join("")}</tr>`;
}

function table(headers: string[], rows: string[][]) {
  return `<div style="overflow-x:auto; margin:14px 0 18px;">
<table style="width:100%; border-collapse:separate; border-spacing:0; border:1px solid #e2e8f0; border-radius:12px; overflow:hidden;">
<thead style="background:#f1f5f9;">
<tr>
${headers
  .map(
    (h) =>
      `<th style="padding:10px 12px; font-size:12px; color:#475569; letter-spacing:0.06em; text-transform:uppercase; font-weight:700; text-align:left; border-bottom:1px solid #e2e8f0;">${h}</th>`,
  )
  .join("")}
</tr>
</thead>
<tbody>
${rows.map(trRow).join("")}
</tbody>
</table>
</div>`;
}

function empty(msg: string) {
  return `<p style="color:#64748b; font-style:italic; padding:12px 14px; background:#f8fafc; border:1px dashed #cbd5e1; border-radius:12px;">${msg}</p>`;
}

function money(amount: number, currencyCode: string) {
  const symbol = String(currencyCode).toUpperCase() === "CAD" ? "C$" : "$";
  return `${symbol}${Number(amount).toFixed(2)}`;
}

export function buildDailyReportHtml(s: DailySummary): { html: string; text: string } {
  const footer = buildReportFooter();
  const newRows = s.newSubscribers.rows.map((r) => [
    new Date(r.createdAt).toLocaleString("en-US", { timeZone: "America/Toronto" }),
    r.fullName,
    r.email,
    currencyLabel(r.billingCurrency),
    r.subscriptionStatus,
    r.seniorName ?? "—",
    r.seniorPhone ?? "—",
  ]);
  const trialRows = s.trialExpiredToday.rows.map((r) => [
    r.fullName,
    r.email,
    r.trialEndedAt
      ? new Date(r.trialEndedAt).toLocaleString("en-US", { timeZone: "America/Toronto" })
      : "—",
  ]);
  const checkoutRows = s.paidCheckouts.rows.map((r) => [
    new Date(r.createdAt).toLocaleString("en-US", { timeZone: "America/Toronto" }),
    r.fullName,
    r.email,
    r.billingInterval,
    money(r.amountUsd, "USD"),
    money(r.amountCad, "CAD"),
  ]);

  const html = `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color:#0f172a; max-width:880px; margin:0 auto;">
${buildLogoHeader()}
<h1 style="margin:8px 0 4px 0; font-size:28px; font-weight:800; color:#0f172a;">Daily Warm-Hello Report</h1>
<p style="margin:0 0 18px 0; font-size:14px; color:#475569;">
Date: <strong>${s.dateLabel}</strong> (Eastern Time · America/Toronto)<br />
Window: ${new Date(s.rangeStartIso).toLocaleString("en-US", { timeZone: "America/Toronto" })} →
${new Date(s.rangeEndIso).toLocaleString("en-US", { timeZone: "America/Toronto" })}
</p>

<div style="display:flex; flex-wrap:wrap; gap:8px; margin:14px 0 18px;">
${kpiRow("Total Subscribers", s.subscriberTotals.total, "#0f172a")}
${kpiRow("New Sign-Ups", s.newSubscribers.count, "#2563eb")}
${kpiRow("Trial → Expired", s.trialExpiredToday.count, "#7c3aed")}
${kpiRow("Paid Checkouts", s.paidCheckouts.count, "#16a34a")}
${kpiRow("Check-Ins Scheduled", s.checkIns.totalScheduled, "#0f172a")}
${kpiRow("Okay", s.checkIns.okay, "#22c55e")}
${kpiRow("Call Me", s.checkIns.callRequested, "#0ea5e9")}
${kpiRow("Escalated", s.checkIns.escalated, "#dc2626")}
${kpiRow("Expired", s.checkIns.expired, "#94a3b8")}
${kpiRow("STOP Replies", s.complianceSms.stopCount, "#991b1b")}
${kpiRow("HELP Replies", s.complianceSms.helpCount, "#a16207")}
</div>

<h2 style="font-size:18px; margin:20px 0 10px; color:#0f172a;">New Sign-Ups Today</h2>
${
  newRows.length
    ? table(
        ["Signed Up (ET)", "Caregiver", "Email", "Currency", "Status", "Senior", "Phone"],
        newRows,
      )
    : empty("No new subscribers signed up yesterday.")
}

<h2 style="font-size:18px; margin:20px 0 10px; color:#0f172a;">Paid Checkouts / Conversions</h2>
${
  checkoutRows.length
    ? table(["Paid At (ET)", "Caregiver", "Email", "Plan", "USD", "CAD"], checkoutRows)
    : empty("No paid checkouts processed yesterday.")
}
<p style="margin:0 0 8px 0; font-size:14px;"><strong>USD Total:</strong> ${money(
  s.paidCheckouts.totalUsd,
  "USD",
)} &nbsp; · &nbsp; <strong>CAD Total:</strong> ${money(s.paidCheckouts.totalCad, "CAD")}</p>

<h2 style="font-size:18px; margin:20px 0 10px; color:#0f172a;">Trials Expiring End Of Day Yesterday</h2>
${trialRows.length ? table(["Caregiver", "Email", "Trial Ended At (ET)"], trialRows) : empty("No trials ended yesterday.")}

<h2 style="font-size:18px; margin:20px 0 10px; color:#0f172a;">Check-In Response Breakdown</h2>
<table style="width:100%; border-collapse:separate; border-spacing:0; border:1px solid #e2e8f0; border-radius:12px; overflow:hidden;">
<tbody>
${[
  ["Scheduled", String(s.checkIns.totalScheduled), "#475569"],
  ["Okay (confirmed)", String(s.checkIns.okay), "#16a34a"],
  ["Call Me requested", String(s.checkIns.callRequested), "#2563eb"],
  ["Escalated to contact", String(s.checkIns.escalated), "#dc2626"],
  ["Expired (no response)", String(s.checkIns.expired), "#94a3b8"],
  ["Pending / Open", String(s.checkIns.pending), "#0ea5e9"],
]
  .map(
    (row) =>
      `<tr><td style="padding:8px 12px; border-bottom:1px solid #e2e8f0; font-size:13px; color:#475569;">${row[0]}</td><td style="padding:8px 12px; border-bottom:1px solid #e2e8f0; font-size:15px; font-weight:800; color:${row[2]}; text-align:right;">${row[1]}</td></tr>`,
  )
  .join("")}
</tbody>
</table>

<h2 style="font-size:18px; margin:20px 0 10px; color:#0f172a;">Compliance SMS Inbound</h2>
<p style="font-size:14px; color:#334155; margin:0 0 4px;">
<strong>STOP replies (opt out):</strong> ${s.complianceSms.stopCount} &nbsp; · &nbsp;
<strong>HELP replies:</strong> ${s.complianceSms.helpCount}
</p>
${footer.html}
</div>`;

  const text = `Warm-Hello Daily Report — ${s.dateLabel} (Eastern)
Range: ${s.rangeStartIso} → ${s.rangeEndIso}

KPIs
  Total Subscribers: ${s.subscriberTotals.total}
  New Sign-Ups: ${s.newSubscribers.count}
  Trials Expired Today: ${s.trialExpiredToday.count}
  Paid Checkouts: ${s.paidCheckouts.count}  (USD ${s.paidCheckouts.totalUsd.toFixed(
    2,
  )}  CAD ${s.paidCheckouts.totalCad.toFixed(2)})
  Check-Ins Scheduled: ${s.checkIns.totalScheduled}
    Okay: ${s.checkIns.okay}
    Call Me: ${s.checkIns.callRequested}
    Escalated: ${s.checkIns.escalated}
    Expired: ${s.checkIns.expired}
    Pending: ${s.checkIns.pending}
  STOP replies: ${s.complianceSms.stopCount}  HELP replies: ${s.complianceSms.helpCount}

New Sign-Ups (${s.newSubscribers.count})
${
  s.newSubscribers.rows.length
    ? s.newSubscribers.rows
        .map((r) => `· ${r.fullName} <${r.email}> · Currency ${r.billingCurrency} · Senior ${r.seniorName ?? "n/a"} ${r.seniorPhone ?? ""}`)
        .join("\n")
    : "None"
}

Paid Checkouts (${s.paidCheckouts.count})
${
  s.paidCheckouts.rows.length
    ? s.paidCheckouts.rows
        .map(
          (r) =>
            `· ${r.fullName} <${r.email}> · ${r.billingInterval} · USD ${r.amountUsd.toFixed(
              2,
            )} CAD ${r.amountCad.toFixed(2)}`,
        )
        .join("\n")
    : "None"
}

Trials Expiring End Of Day (${s.trialExpiredToday.count})
${
  s.trialExpiredToday.rows.length
    ? s.trialExpiredToday.rows.map((r) => `· ${r.fullName} <${r.email}>`).join("\n")
    : "None"
}${footer.text}`;

  return { html, text };
}

export function buildMonthlyReportHtml(s: MonthlySummary): { html: string; text: string } {
  const footer = buildReportFooter();
  const revenueRows = s.revenue.rows.map((r) => [
    new Date(r.createdAt).toLocaleDateString("en-US", { timeZone: "America/Toronto" }),
    r.fullName,
    r.email,
    r.billingInterval,
    money(r.amountUsd, "USD"),
    money(r.amountCad, "CAD"),
  ]);
  const churnRows = s.churned.rows.map((r) => [
    r.fullName,
    r.email,
    r.cancellationRequestedAt
      ? new Date(r.cancellationRequestedAt).toLocaleDateString("en-US", { timeZone: "America/Toronto" })
      : "—",
    r.cancellationDate
      ? new Date(r.cancellationDate).toLocaleDateString("en-US", { timeZone: "America/Toronto" })
      : "—",
  ]);
  const trialRows = s.trials.newRows.map((r) => [
    new Date(r.createdAt).toLocaleDateString("en-US", { timeZone: "America/Toronto" }),
    r.fullName,
    r.email,
    currencyLabel(r.billingCurrency),
  ]);

  const conversionRate =
    s.trials.createdCount > 0 ? `${Math.round((s.trials.convertedToPaid / s.trials.createdCount) * 100)}%` : "—";

  const html = `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color:#0f172a; max-width:880px; margin:0 auto;">
${buildLogoHeader()}
<h1 style="margin:8px 0 4px 0; font-size:30px; font-weight:800; color:#0f172a;">Monthly Warm-Hello Report</h1>
<p style="margin:0 0 18px 0; font-size:14px; color:#475569;">
<strong>${s.monthLabel}</strong> &nbsp; ${s.firstDayIso} → ${s.lastDayIso} (Eastern Time)
</p>

<div style="display:flex; flex-wrap:wrap; gap:8px; margin:14px 0 18px;">
${kpiRow("Revenue USD", money(s.revenue.totalUsd, "USD"), "#16a34a")}
${kpiRow("Revenue CAD", money(s.revenue.totalCad, "CAD"), "#16a34a")}
${kpiRow("Paid Transactions", s.revenue.rows.length, "#22c55e")}
${kpiRow("Trials Created", s.trials.createdCount, "#2563eb")}
${kpiRow("Trial → Paid", `${s.trials.convertedToPaid} · ${conversionRate}`, "#7c3aed")}
${kpiRow("Trials Expired (no purchase)", s.trials.expiredWithoutPurchase, "#0ea5e9")}
${kpiRow("Churned Subscribers", s.churned.count, "#dc2626")}
${kpiRow("Check-Ins Scheduled", s.checkIns.totalScheduled, "#0f172a")}
${kpiRow("Escalations Fired", s.escalations.succeeded, "#dc2626")}
${kpiRow("SMS Sent", s.operationalCounts.smsSentCount, "#475569")}
${kpiRow("STOP Replies", s.operationalCounts.stopCount, "#991b1b")}
${kpiRow("HELP Replies", s.operationalCounts.helpCount, "#a16207")}
${kpiRow("Active Seniors (today)", s.operationalCounts.activeSeniors, "#16a34a")}
</div>

<h2 style="font-size:18px; margin:20px 0 10px; color:#0f172a;">Revenue · ${s.monthLabel}</h2>
${revenueRows.length ? table(["Date", "Caregiver", "Email", "Plan", "USD", "CAD"], revenueRows) : empty("No paid revenue recorded this month.")}
<p style="font-size:14px; margin:0 0 6px 0;">
  <strong>Total USD:</strong> ${money(s.revenue.totalUsd, "USD")} ·
  <strong>Total CAD:</strong> ${money(s.revenue.totalCad, "CAD")}
</p>

<h2 style="font-size:18px; margin:20px 0 10px; color:#0f172a;">Trials & Conversion</h2>
${trialRows.length ? table(["Signed Up", "Caregiver", "Email", "Currency"], trialRows) : empty("No new trials this month.")}
<p style="font-size:14px; color:#334155;">
Trials created: <strong>${s.trials.createdCount}</strong> ·
Converted to paid: <strong>${s.trials.convertedToPaid}</strong> (${conversionRate}) ·
Expired without purchase: <strong>${s.trials.expiredWithoutPurchase}</strong>
</p>

<h2 style="font-size:18px; margin:20px 0 10px; color:#0f172a;">Churned / Canceled</h2>
${churnRows.length ? table(["Caregiver", "Email", "Requested", "Canceled At"], churnRows) : empty("No cancelations this month.")}

<h2 style="font-size:18px; margin:20px 0 10px; color:#0f172a;">Check-Ins · Month</h2>
<table style="width:100%; border-collapse:separate; border-spacing:0; border:1px solid #e2e8f0; border-radius:12px; overflow:hidden;">
<tbody>
${[
  ["Scheduled", String(s.checkIns.totalScheduled), "#475569"],
  ["Okay", String(s.checkIns.okay), "#16a34a"],
  ["Call Me", String(s.checkIns.callRequested), "#2563eb"],
  ["Escalated", String(s.checkIns.escalated), "#dc2626"],
  ["Expired", String(s.checkIns.expired), "#94a3b8"],
]
  .map(
    (r) =>
      `<tr><td style="padding:8px 12px; border-bottom:1px solid #e2e8f0; font-size:13px; color:#475569;">${r[0]}</td><td style="padding:8px 12px; border-bottom:1px solid #e2e8f0; text-align:right; font-size:15px; font-weight:800; color:${r[2]};">${r[1]}</td></tr>`,
  )
  .join("")}
</tbody>
</table>

<h2 style="font-size:18px; margin:20px 0 10px; color:#0f172a;">Escalations · Month</h2>
<p style="font-size:14px; color:#334155;">
Total alert jobs: <strong>${s.escalations.totalAlertJobs}</strong> ·
Succeeded: <strong>${s.escalations.succeeded}</strong> ·
Failed: <strong>${s.escalations.failed}</strong>
</p>

<h2 style="font-size:18px; margin:20px 0 10px; color:#0f172a;">End-Of-Month Subscriber Snapshot</h2>
<table style="width:100%; border-collapse:separate; border-spacing:0; border:1px solid #e2e8f0; border-radius:12px; overflow:hidden;">
<tbody>
${[
  ["Total Subscribers", s.snapshotEndOfMonth.totalSubscribers, "#0f172a"],
  ["Active Paid", s.snapshotEndOfMonth.activePaid, "#16a34a"],
  ["Trial", s.snapshotEndOfMonth.trial, "#2563eb"],
  ["Past Due", s.snapshotEndOfMonth.pastDue, "#d97706"],
  ["Canceled", s.snapshotEndOfMonth.canceled, "#94a3b8"],
]
  .map(
    (r) =>
      `<tr><td style="padding:8px 12px; border-bottom:1px solid #e2e8f0; font-size:13px; color:#475569;">${r[0]}</td><td style="padding:8px 12px; border-bottom:1px solid #e2e8f0; text-align:right; font-size:15px; font-weight:800; color:${r[2]};">${r[1]}</td></tr>`,
  )
  .join("")}
</tbody>
</table>

${footer.html}
</div>`;

  const text = `Warm-Hello Monthly Report — ${s.monthLabel}
Window: ${s.firstDayIso} → ${s.lastDayIso} (Eastern)

KPIs
  Revenue USD: ${s.revenue.totalUsd.toFixed(2)}
  Revenue CAD: ${s.revenue.totalCad.toFixed(2)}
  Paid transactions: ${s.revenue.rows.length}
  Trials created: ${s.trials.createdCount}
  Trial → Paid: ${s.trials.convertedToPaid} (${conversionRate})
  Trials expired no purchase: ${s.trials.expiredWithoutPurchase}
  Churned: ${s.churned.count}
  Check-ins scheduled: ${s.checkIns.totalScheduled}
    Okay: ${s.checkIns.okay}  Call Me: ${s.checkIns.callRequested}
    Escalated: ${s.checkIns.escalated}  Expired: ${s.checkIns.expired}
  Escalations total: ${s.escalations.totalAlertJobs} ok=${s.escalations.succeeded} failed=${s.escalations.failed}
  SMS sent: ${s.operationalCounts.smsSentCount}  STOP=${s.operationalCounts.stopCount}  HELP=${s.operationalCounts.helpCount}
  Active seniors today: ${s.operationalCounts.activeSeniors}

Revenue (${s.revenue.rows.length})
${
  s.revenue.rows.length
    ? s.revenue.rows
        .map(
          (r) =>
            `· ${new Date(r.createdAt).toLocaleDateString("en-US", {
              timeZone: "America/Toronto",
            })}  ${r.fullName}  ${r.billingInterval}  USD ${r.amountUsd.toFixed(2)}  CAD ${r.amountCad.toFixed(2)}`,
        )
        .join("\n")
    : "None"
}

Trials created (${s.trials.createdCount})
${
  trialRows.length
    ? s.trials.newRows.map((r) => `· ${r.fullName} <${r.email}> · ${r.billingCurrency}`).join("\n")
    : "None"
}

Churned / Canceled (${s.churned.count})
${
  s.churned.rows.length
    ? s.churned.rows.map((r) => `· ${r.fullName} <${r.email}>`).join("\n")
    : "None"
}

End-of-month snapshot
  Total: ${s.snapshotEndOfMonth.totalSubscribers}
  Active Paid: ${s.snapshotEndOfMonth.activePaid}
  Trial: ${s.snapshotEndOfMonth.trial}
  Past Due: ${s.snapshotEndOfMonth.pastDue}
  Canceled: ${s.snapshotEndOfMonth.canceled}${footer.text}`;

  return { html, text };
}

export async function sendDailySalesReport(summary: DailySummary, recipients: string[] = [RECAP_DIRECT_DELIVERY]) {
  const subject = `Warm-Hello Daily Report — ${summary.dateLabel}`;
  const { html, text } = buildDailyReportHtml(summary);
  const to = recipients.join(",");
  const result = await sendEmail({
    to,
    subject,
    html,
    text,
    replyTo: SALES_EMAIL_DISPLAY,
  });
  return {
    ...result,
    recipients,
    subject,
  };
}

export async function sendMonthlySalesReport(summary: MonthlySummary, recipients: string[] = [RECAP_DIRECT_DELIVERY]) {
  const subject = `Warm-Hello Monthly Report — ${summary.monthLabel}`;
  const { html, text } = buildMonthlyReportHtml(summary);
  const to = recipients.join(",");
  const result = await sendEmail({
    to,
    subject,
    html,
    text,
    replyTo: SALES_EMAIL_DISPLAY,
  });
  return {
    ...result,
    recipients,
    subject,
  };
}
