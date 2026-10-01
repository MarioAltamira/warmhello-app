import * as fs from "node:fs";
import * as path from "node:path";

const OUT_DIR = path.join(process.cwd(), "scripts", "email-previews");
fs.mkdirSync(OUT_DIR, { recursive: true });

const APP_URL = "https://warm-hello.com";
const LEGAL_ENTITY = "Warm-Hello Ltd.";
const CA_MAILING = "123 Example Street, Suite 400, Toronto ON M5V 2T6, Canada";
const SALES_EMAIL = "sales@warm-hello.com";
const LOGO = `${APP_URL}/warmhello-logo-b.png`;

const SAMPLE = {
  caregiverName: "Sarah Chen",
  caregiverEmail: "sarah.chen.84@gmail.com",
  subscriberId: "sub_sample0001",
  seniorFirstName: "Margaret",
  seniorLastName: "Halliwell",
  seniorPhone: "+14165550142",
  seniorPhoneLast4: "0142",
  senior2First: "James",
  senior2Last: "Chen",
  contact1Name: "Robert Chen",
  contact1Rel: "Son",
  contact1Phone: "+14165550199",
  contact2Name: "Priya Natarajan",
  contact2Rel: "Neighbour + Close Friend",
  contact2Phone: "+14165550188",
  checkInHour: 8,
  checkInMinute: 30,
  timezone: "America/Toronto",
  billingInterval: "annual" as "annual" | "monthly",
  currency: "CAD" as "CAD" | "USD",
  planMonthCAD: "$14.99 CAD",
  planYearCAD: "$144.00 CAD",
  planMonthUSD: "$12.00 USD",
  planYearUSD: "$108.00 USD",
  nextRenewal: new Date(Date.UTC(2027, 8, 15, 0, 0, 0)),
  trialStart: new Date(Date.UTC(2026, 8, 24, 0, 0, 0)),
  trialEnd: new Date(Date.UTC(2026, 9, 1, 0, 0, 0)),
  winbackDiscountedCAD: "$108.00 CAD",
  winbackDiscountedUSD: "$81.00 USD",
  invoiceAmountUSD: 108.0,
  invoiceAmountCAD: 144.0,
  ipAddress: "206.248.172.44",
  deletionEffective: new Date(Date.UTC(2026, 9, 1, 14, 22, 0)),
  optedOutAt: new Date(Date.UTC(2026, 8, 28, 9, 11, 0)),
  optedInAt: new Date(Date.UTC(2026, 8, 30, 10, 3, 0)),
  passwordSetWhen: new Date(Date.UTC(2026, 8, 24, 12, 2, 0)),
  passwordChangedWhen: new Date(Date.UTC(2026, 8, 26, 19, 45, 0)),
  magicExpiresLabel: "Oct 01, 2026 11:35 AM (30 minutes from now)",
  scheduledCheckInIso: new Date(Date.UTC(2026, 9, 1, 12, 30, 0)).toISOString(),
  checkInToken: "smp_sample_abc123token456",
  stripeReceiptUrl: "https://pay.stripe.com/receipts/ca/pi_3QaBcDefGhIjKlMnOpQrStUv/cs_test_a1b2c3d4e5f6/receipt",
  stripeHostedInvoiceUrl: "https://invoice.stripe.com/i/acct_123abc/test_YWNjdF8xMDk0N18xMjM0NTY3OA_0123456789abcdef?s=def",
  dashboardLink: `${APP_URL}/dashboard`,
  settingsLink: `${APP_URL}/dashboard/settings`,
  subscribeLink: `${APP_URL}/subscribe/subsample0001`,
  winbackLink: `${APP_URL}/api/winback/sig_abc123sample456`,
  unsubscribeLink: `${APP_URL}/unsubscribe/tok_sample789xyz`,
  checkInLink: `${APP_URL}/checkin/smp_sample_abc123token456`,
  authLoginPage: `${APP_URL}/auth?mode=login`,
  termsLink: `${APP_URL}/terms`,
  privacyLink: `${APP_URL}/privacy`,
  magicLink: `${APP_URL}/auth/reset/tok_abc123magiclink456def789`,
};

function pad2(n: number) { return n.toString().padStart(2, "0"); }
function esc(s: unknown): string {
  const v = typeof s === "string" ? s : String(s ?? "");
  return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function dateLabel(d: Date) {
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

function buildFooter(opts: { unsubCopy: string; unsubLink: string }) {
  const identityHtml =
    `<p style="margin: 0 0 8px 0; font-size: 12px; line-height: 1.55; color: #3a3f54;">` +
    `${LEGAL_ENTITY} · ${CA_MAILING}. Questions? Email <a href="mailto:${SALES_EMAIL}" style="color: #59617a; text-decoration: underline;">${SALES_EMAIL}</a>.` +
    `</p>`;
  return {
    html: identityHtml +
      `<p style="margin: 0; font-size: 12px; line-height: 1.55; color: #59617a;">` +
      `${opts.unsubCopy} <a href="${opts.unsubLink}" style="color: #59617a; text-decoration: underline;">unsubscribe</a>.` +
      `</p>`,
    text: `\n\n${LEGAL_ENTITY}\n${CA_MAILING}\nQuestions? Email ${SALES_EMAIL}.\n\n${opts.unsubCopy}: ${opts.unsubLink}`,
  };
}
function reportFooter() {
  const html = `<div style="margin-top:28px; padding-top:14px; border-top:1px solid #e2e8f0; font-size:12px; color:#59617a; line-height:1.55;">
<p style="margin:0 0 6px 0;">${LEGAL_ENTITY} · ${CA_MAILING}</p>
<p style="margin:0;">Questions? Email <a href="mailto:${SALES_EMAIL}" style="color:#59617a;">${SALES_EMAIL}</a>.</p>
<p style="margin:6px 0 0 0;">This is an automated operational report sent by Warm-Hello. Replies go to the sales inbox.</p>
</div>`;
  const text = `\n\n${LEGAL_ENTITY}\n${CA_MAILING}\nQuestions? Email ${SALES_EMAIL}\nAutomated operational report.`;
  return { html, text };
}

function plan() {
  const isCAD = SAMPLE.currency === "CAD";
  return {
    month: isCAD ? SAMPLE.planMonthCAD : SAMPLE.planMonthUSD,
    year: isCAD ? SAMPLE.planYearCAD : SAMPLE.planYearUSD,
    sym: isCAD ? "CA$" : "$",
    cur: SAMPLE.currency,
    monthAmt: isCAD ? 14.99 : 12.0,
    yearAmt: isCAD ? 144.0 : 108.0,
    daily: isCAD ? "$0.39 CAD/day" : "$0.30 USD/day",
  };
}

type EmailVariant = { id: string; category: string; name: string; subject: string; replyTo?: string; build: () => { html: string; text: string } };
const VARIANTS: EmailVariant[] = [];

VARIANTS.push({
  id: "01", category: "🧪 Trial Lifecycle", name: "Trial Welcome Email",
  subject: "Welcome to Warm-Hello - A simple morning check-in routine",
  replyTo: SALES_EMAIL,
  build: () => {
    const f = buildFooter({ unsubCopy: "To stop trial emails,", unsubLink: SAMPLE.unsubscribeLink });
    const p = plan();
    return {
      text: `Hi there,\n\nThank you for choosing Warm-Hello to help stay connected with your loved one. We know that balancing their independence with your need to check in can be difficult, and we're here to make that rhythm effortless.\n\nRemember: Warm-Hello is a routine check-in service, NOT an emergency service. In an emergency, call 911.\n\nGetting started is simple:\nIf you haven't already, please finish setting up your account and schedule your preferred morning check-in time via your Dashboard:\n${SAMPLE.dashboardLink}\n\nRemember, there's nothing for your loved one to download or learn. They'll receive a gentle, friendly text each morning with a secure link. A single tap on the big "I'm OK" button is all it takes to keep you in the loop.\n\nYour 7-day free trial does not automatically convert to a paid subscription. No charge will be made when your trial ends. After the trial, choose between:\n- Monthly: ${p.month}\n- Annual: ${p.year}\n\nWe're here to help you get settled. If you have any questions, just hit reply to this email.\n\nWarmly,\nThe Warm-Hello Team${f.text}`,
      html: `<p><img src="${LOGO}" alt="Warm-Hello" width="140" /></p>
<p>Hi there,</p>
<p>Thank you for choosing Warm-Hello to help stay connected with your loved one. We know that balancing their independence with your need to check in can be difficult, and we&rsquo;re here to make that rhythm effortless.</p>
<p style="border-left:4px solid #ffd666; margin:14px 0; padding:10px 14px; background:rgba(255,214,102,0.08); border-radius:8px;">
  <strong style="color:#991b1b;">Reminder:</strong> Warm-Hello is a routine check-in service, <strong>NOT an emergency service</strong>. In an emergency, call 911.
</p>
<p><strong>Getting started is simple:</strong><br />If you haven't already, please finish setting up your account and schedule your preferred morning check-in time via your <a href="${SAMPLE.dashboardLink}">Dashboard</a>.</p>
<p>Remember, there&rsquo;s nothing for your loved one to download or learn. They&rsquo;ll receive a gentle, friendly text each morning with a secure link. A single tap on the big &ldquo;I&rsquo;m OK&rdquo; button is all it takes to keep you in the loop.</p>
<blockquote style="border-left:4px solid #7be3a9; margin:14px 0; padding:10px 14px; background:rgba(123,227,169,0.08); border-radius:8px;">
  <p style="margin:0;">Your 7-day free trial does <strong>not</strong> automatically convert to a paid subscription. No charge will be made when your trial ends. After the trial, choose between:</p>
  <ul style="margin:8px 0 0 20px; padding:0;">
    <li><strong>Monthly:</strong> ${p.month}</li>
    <li><strong>Annual:</strong> ${p.year}</li>
  </ul>
</blockquote>
<p>We&rsquo;re here to help you get settled. If you have any questions, just hit reply to this email.</p>
<p>Warmly,<br />The Warm-Hello Team</p>
${f.html}`,
    };
  },
});

VARIANTS.push({
  id: "02", category: "🧪 Trial Lifecycle", name: "Trial Nudge Email (Day ~3)",
  subject: "How is your first week going with Warm-Hello?",
  replyTo: SALES_EMAIL,
  build: () => {
    const f = buildFooter({ unsubCopy: "To stop trial emails,", unsubLink: SAMPLE.unsubscribeLink });
    const p = plan();
    return {
      text: `Hi there,\n\nWe hope your first few days with Warm-Hello are going smoothly and that ${SAMPLE.seniorFirstName} ${SAMPLE.seniorLastName} is finding the check-in texts friendly and easy to tap.\n\nIf you've been on the fence about continuing, a quick reminder: your 7-day free trial does not automatically convert to a paid subscription. No charge will be made when your trial ends. After the trial, choose between:\n- Monthly: ${p.month}\n- Annual: ${p.year}\n\nIf you're ready to subscribe, pick your plan here:\n${SAMPLE.subscribeLink}\n\nRemember — the whole point of Warm-Hello is a quick check-in that feels more like a morning wave than a medical alert. No apps to install. No equipment to ship. Just a single text each day with a single big green button.\n\nIf you have any feedback, questions, or anything we can improve — reply to this email. We read every message.\n\nWarmly,\nThe Warm-Hello Team${f.text}`,
      html: `<p><img src="${LOGO}" alt="Warm-Hello" width="140" /></p>
<p>Hi there,</p>
<p>We hope your first few days with Warm-Hello are going smoothly and that <strong>${esc(SAMPLE.seniorFirstName)} ${esc(SAMPLE.seniorLastName)}</strong> is finding the check-in texts friendly and easy to tap.</p>
<p>If you&rsquo;ve been on the fence about continuing, a quick reminder:</p>
<blockquote style="border-left:4px solid #7be3a9; margin:14px 0; padding:10px 14px; background:rgba(123,227,169,0.08); border-radius:8px;">
  <p style="margin:0;">Your 7-day free trial does <strong>not</strong> automatically convert to a paid subscription. No charge will be made when your trial ends. After the trial, choose between:</p>
  <ul style="margin:8px 0 0 20px; padding:0;">
    <li><strong>Monthly:</strong> ${p.month}</li>
    <li><strong>Annual:</strong> ${p.year}</li>
  </ul>
</blockquote>
<p>If you&rsquo;re ready to subscribe, <a href="${SAMPLE.subscribeLink}" style="font-weight:600;">pick your plan here &rarr;</a>.</p>
<p>Remember &mdash; the whole point of Warm-Hello is a quick check-in that feels more like a morning wave than a medical alert. No apps to install. No equipment to ship. Just a single text each day with a single big green button.</p>
<p>If you have any feedback, questions, or anything we can improve &mdash; reply to this email. We read every message.</p>
<p>Warmly,<br />The Warm-Hello Team</p>
${f.html}`,
    };
  },
});

VARIANTS.push({
  id: "03", category: "🧪 Trial Lifecycle", name: "Trial Ending Soon Email (Day ~6)",
  subject: "Your Warm-Hello free trial is ending soon",
  replyTo: SALES_EMAIL,
  build: () => {
    const f = buildFooter({ unsubCopy: "To stop trial emails,", unsubLink: SAMPLE.unsubscribeLink });
    const p = plan();
    const trialLabel = dateLabel(SAMPLE.trialEnd);
    return {
      text: `Hi there,\n\nYour 7-day free trial of Warm-Hello is ending on ${trialLabel}.\n\nYour 7-day free trial does not automatically convert to a paid subscription. No charge will be made when your trial ends.\n\nIf you'd like to continue using Warm-Hello, select a paid subscription:\n- Monthly: ${p.month}\n- Annual: ${p.year}\n\nChoose your plan here:\n${SAMPLE.subscribeLink}\n\nYou can also review your account and check-in settings any time from your Dashboard:\n${SAMPLE.dashboardLink}\n\nIf you don't choose a plan, no charge will be made and check-ins will stop after ${trialLabel} until you subscribe.\n\nQuestions? Reply to this email or write to ${SALES_EMAIL}.\n\nWarmly,\nThe Warm-Hello Team${f.text}`,
      html: `<p><img src="${LOGO}" alt="Warm-Hello" width="140" /></p>
<p>Hi there,</p>
<p>Your 7-day free trial of Warm-Hello is ending on <strong>${trialLabel}</strong>.</p>
<blockquote style="border-left:4px solid #ffd666; margin:16px 0; padding:10px 14px; background:rgba(255,214,102,0.08); border-radius:8px;">
  <p style="margin:0;"><strong>Important:</strong> Your 7-day free trial does <strong>not</strong> automatically convert to a paid subscription. No charge will be made when your trial ends.</p>
</blockquote>
<p>If you&rsquo;d like to continue using Warm-Hello, select a paid subscription:</p>
<ul style="margin:0 0 12px 20px; padding:0; line-height:1.7;">
  <li><strong>Monthly:</strong> ${p.month}</li>
  <li><strong>Annual:</strong> ${p.year}</li>
</ul>
<p><a href="${SAMPLE.subscribeLink}" style="font-weight:600;">Choose your plan and continue using Warm-Hello &rarr;</a></p>
<p>You can also review your account and check-in settings any time from your <a href="${SAMPLE.dashboardLink}">Dashboard</a>.</p>
<p>If you don&rsquo;t choose a plan, no charge will be made and check-ins will stop after ${trialLabel} until you subscribe.</p>
<p>Questions? Reply to this email or write to <a href="mailto:${SALES_EMAIL}">${SALES_EMAIL}</a>.</p>
<p>Warmly,<br />The Warm-Hello Team</p>
${f.html}`,
    };
  },
});

VARIANTS.push({
  id: "04", category: "🧪 Trial Lifecycle", name: "Trial Final / Ended Email (Day 7+)",
  subject: "Your trial has ended - stay connected with Warm-Hello",
  replyTo: SALES_EMAIL,
  build: () => {
    const f = buildFooter({ unsubCopy: "To stop trial emails,", unsubLink: SAMPLE.unsubscribeLink });
    const p = plan();
    return {
      text: `Hi there,\n\nYour 7-day free trial of Warm-Hello has ended. Thank you for taking the time to try Warm-Hello and for trusting us with something so personal.\n\nYour 7-day free trial did not automatically convert to a paid subscription. No charge has been made.\n\nTo continue using Warm-Hello for ${esc(SAMPLE.seniorFirstName)} ${esc(SAMPLE.seniorLastName)}, pick a paid subscription:\n- Monthly: ${p.month}\n- Annual: ${p.year}\n\nActivate your Warm-Hello subscription here:\n${SAMPLE.subscribeLink}\n\nIf you don't choose a plan, check-ins will stop until you subscribe. No charge will be made.\n\nThank you for trying Warm-Hello and for trusting us to help bridge the gap between respect for their independence and your own desire to stay in touch.\n\nQuestions? Reply to this email or write to ${SALES_EMAIL}.\n\nWarmly,\nThe Warm-Hello Team${f.text}`,
      html: `<p><img src="${LOGO}" alt="Warm-Hello" width="140" /></p>
<p>Hi there,</p>
<p>Your 7-day free trial of Warm-Hello has ended. Thank you for taking the time to try Warm-Hello and for trusting us with something so personal.</p>
<blockquote style="border-left:4px solid #7be3a9; margin:14px 0; padding:10px 14px; background:rgba(123,227,169,0.08); border-radius:8px;">
  <p style="margin:0;">Your 7-day free trial did <strong>not</strong> automatically convert to a paid subscription. No charge has been made. After the trial, choose between:</p>
  <ul style="margin:8px 0 0 20px; padding:0;">
    <li><strong>Monthly:</strong> ${p.month}</li>
    <li><strong>Annual:</strong> ${p.year}</li>
  </ul>
</blockquote>
<p><a href="${SAMPLE.subscribeLink}" style="font-weight:600;">Activate your Warm-Hello subscription here &rarr;</a></p>
<p>If you don&rsquo;t choose a plan, check-ins will stop until you subscribe. No charge will be made.</p>
<p>Thank you for trying Warm-Hello and for trusting us to help bridge the gap between respect for their independence and your own desire to stay in touch.</p>
<p>Questions? Reply to this email or write to <a href="mailto:${SALES_EMAIL}">${SALES_EMAIL}</a>.</p>
<p>Warmly,<br />The Warm-Hello Team</p>
${f.html}`,
    };
  },
});

function buildSubSuccessEmail(variant: "receipt" | "hosted" | "dashboard") {
  const f = buildFooter({ unsubCopy: "To stop billing-related notices,", unsubLink: SAMPLE.unsubscribeLink });
  const p = plan();
  const interval = SAMPLE.billingInterval;
  const planLabel = interval === "annual" ? p.year : p.month;
  const freqLabel = interval === "annual" ? "Annual (billed once per year)" : "Monthly (billed once per month)";
  const nextRenewal = dateLabel(SAMPLE.nextRenewal);
  const priceLine = `${p.sym}${(interval === "annual" ? p.yearAmt : p.monthAmt).toFixed(2)} ${p.cur}/${interval === "annual" ? "year" : "month"}`;
  const seniors = `${SAMPLE.seniorFirstName} ${SAMPLE.seniorLastName} · ${SAMPLE.senior2First} ${SAMPLE.senior2Last}`;
  const contacts = `${SAMPLE.contact1Name} (${SAMPLE.contact1Rel}) · ${SAMPLE.contact1Phone} / ${SAMPLE.contact2Name} (${SAMPLE.contact2Rel}) · ${SAMPLE.contact2Phone}`;
  const checkIns = `${pad2(SAMPLE.checkInHour)}:${pad2(SAMPLE.checkInMinute)} in ${SAMPLE.timezone} for ${SAMPLE.seniorFirstName} ${SAMPLE.seniorLastName}`;

  let invHtml: string, invText: string;
  if (variant === "receipt") {
    invHtml =
      `<p style="margin:0 0 8px 0; font-weight:600; color:#2b2f44;"><strong>Thank you for your payment.</strong></p>` +
      `<a href="${SAMPLE.stripeReceiptUrl}" target="_blank" rel="noopener" style="font-weight:600;">✅ View payment receipt (Stripe, opens in browser)</a>` +
      `<p style="font-size: 12px; opacity: 0.75; margin: 8px 0 0 0;">This is your official payment receipt from Stripe. It displays your full tax breakdown and Amount paid.</p>`;
    invText = `Thank you for your payment.\nView payment receipt (Stripe, opens in browser): ${SAMPLE.stripeReceiptUrl}\nNote: This is your official payment receipt from Stripe. Displays full tax breakdown and Amount paid.\n`;
  } else if (variant === "hosted") {
    invHtml =
      `<p style="margin:0 0 8px 0; font-weight:600; color:#2b2f44;"><strong>Thank you for your payment.</strong></p>` +
      `<a href="${SAMPLE.stripeHostedInvoiceUrl}" target="_blank" rel="noopener" style="font-weight:600;">🧾 View receipt (Stripe, opens in browser)</a>` +
      `<p style="font-size: 12px; opacity: 0.75; margin: 8px 0 0 0;">We are still confirming your payment with Stripe. This receipt page updates LIVE — in a few seconds it will refresh with the PAID watermark and full amount paid. No need to refresh manually.</p>`;
    invText = `Thank you for your payment.\nView receipt (opens in browser): ${SAMPLE.stripeHostedInvoiceUrl}\nNote: We are still confirming your payment with Stripe. This receipt link updates LIVE — in a few seconds it will refresh with the PAID watermark and full amount paid. No need to refresh manually.`;
  } else {
    invHtml =
      `<p style="margin:0 0 8px 0; font-weight:600; color:#2b2f44;"><strong>Thank you for your payment.</strong></p>` +
      `<a href="${SAMPLE.settingsLink}" target="_blank" rel="noopener" style="font-weight:600;">🧾 View receipt & manage subscription in Dashboard</a>` +
      `<p style="font-size: 12px; opacity: 0.75; margin: 8px 0 0 0;">Your payment has been processed successfully. To manage your subscription (upgrade, cancel, change card), visit your Billing settings in WarmHello Dashboard. PAID status always reflects latest billing state.</p>`;
    invText = `Thank you for your payment.\nView receipt & manage subscription in Dashboard: ${SAMPLE.settingsLink}\nNote: Your payment has been processed successfully. To upgrade / cancel / change your card, visit the Billing settings page above.`;
  }

  const cell = (label: string, val: string, last = false) =>
    `<tr><td width="32%" valign="top" style="background:#f4f7ff;${last ? "" : " border-bottom:1px solid #e5e7eb;"} color:#59617a; font-weight:600; padding:8px;">${label}</td><td valign="top" style="${last ? "" : "border-bottom:1px solid #e5e7eb;"} padding:8px;">${val}</td></tr>`;

  const text = `Hi there,\n\n** Thank you for your payment.** Your Warm-Hello subscription has been successfully activated. Below is a summary of your subscription.\n\n  • Plan:                ${interval === "annual" ? "Annual" : "Monthly"}\n  • Price:               ${priceLine} + applicable taxes\n  • Currency:            ${p.cur}\n  • Billing frequency:   ${freqLabel}\n  • Next renewal date:   ${nextRenewal}\n  • Seniors covered:     ${seniors}\n  • Trusted escalation contacts: ${contacts}\n  • Daily check-in time: ${checkIns}\n  • Receipt:             ${invText}\n\nRenews automatically: Yes, unless cancelled before renewal.\n\nCancellation instructions:\nYou can cancel auto-renewal at any time from Dashboard → Settings → Subscription. Your subscription remains active until the end of your current paid billing period, and no future renewal charges will be made.\n\nLegal:\n  • Terms of Service: ${SAMPLE.termsLink}\n  • Privacy Policy:   ${SAMPLE.privacyLink}\n\nA few important notes:\n\n  1. Check-ins will continue exactly as they were during your trial. No action needed from either you or the senior.\n  2. You can change the senior name, phone numbers, trusted escalation contacts, check-in window time, or billing details at any time from your Dashboard:\n     ${SAMPLE.dashboardLink}\n  3. For any questions, reply to this email or write to ${SALES_EMAIL}.\n\nWarmly,\nThe Warm-Hello Team${f.text}`;

  const html = `<p><img src="${LOGO}" alt="Warm-Hello" width="140" /></p>
<p>Hi there,</p>
<p><strong style="font-size:15px;">Thank you for your payment.</strong> Your Warm-Hello subscription has been <strong>successfully activated</strong>. Below is a summary of your subscription.</p>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse; border:1px solid #e5e7eb; border-radius:12px;">
  <tbody>
  ${cell("Plan", interval === "annual" ? "Annual" : "Monthly")}
  ${cell("Price", `${priceLine} + applicable taxes`)}
  ${cell("Currency", p.cur)}
  ${cell("Billing frequency", freqLabel)}
  ${cell("Next renewal date", nextRenewal)}
  ${cell("Seniors covered", esc(seniors))}
  ${cell("Trusted escalation contacts", esc(contacts))}
  ${cell("Daily check-in time", esc(checkIns))}
  ${cell("Receipt", invHtml, true)}
  </tbody>
</table>
<p style="margin-top:16px; font-weight:600; color:#2b2f44;">Renews automatically: Yes, unless cancelled before renewal.</p>
<p style="margin-top:6px;"><strong>Cancellation instructions:</strong><br />You can cancel auto-renewal at any time from <a href="${SAMPLE.settingsLink}">Dashboard &rarr; Settings &rarr; Subscription</a>. Your subscription remains active until the end of your current paid billing period, and no future renewal charges will be made.</p>
<p style="margin-top:10px;"><strong>Legal:</strong><br />
  &bull; Terms of Service: <a href="${SAMPLE.termsLink}">${SAMPLE.termsLink}</a><br />
  &bull; Privacy Policy: <a href="${SAMPLE.privacyLink}">${SAMPLE.privacyLink}</a>
</p>
<p style="margin-top:24px;"><strong>A few important notes:</strong></p>
<p>
  1. Check-ins will continue exactly as they were during your trial. No action needed from either you or the senior.<br />
  2. You can change the senior name, phone numbers, trusted escalation contacts, check-in window time, or billing details at any time from your <a href="${SAMPLE.dashboardLink}">Dashboard</a>.<br />
  3. For any questions, reply to this email or write to <a href="mailto:${SALES_EMAIL}">${SALES_EMAIL}</a>.
</p>
<p>Warmly,<br />The Warm-Hello Team</p>
${f.html}`;

  return { html, text };
}

VARIANTS.push({ id: "05", category: "💰 Billing", name: "Successful Subscription (Receipt URL Variant)", subject: "Your Warm-Hello subscription is active", replyTo: SALES_EMAIL, build: () => buildSubSuccessEmail("receipt") });
VARIANTS.push({ id: "06", category: "💰 Billing", name: "Successful Subscription (Hosted Invoice Variant)", subject: "Your Warm-Hello subscription is active", replyTo: SALES_EMAIL, build: () => buildSubSuccessEmail("hosted") });
VARIANTS.push({ id: "07", category: "💰 Billing", name: "Successful Subscription (Dashboard Fallback Variant)", subject: "Your Warm-Hello subscription is active", replyTo: SALES_EMAIL, build: () => buildSubSuccessEmail("dashboard") });

VARIANTS.push({
  id: "08", category: "💰 Billing", name: "Annual Renewal Reminder (x days before)",
  subject: `Your Warm-Hello annual subscription renews ${dateLabel(SAMPLE.nextRenewal)}`,
  replyTo: SALES_EMAIL,
  build: () => {
    const f = buildFooter({ unsubCopy: "To stop receiving these billing reminders,", unsubLink: SAMPLE.unsubscribeLink });
    const p = plan();
    const renewalLabel = dateLabel(SAMPLE.nextRenewal);
    return {
      text: `Hi there,\n\nThis is a friendly reminder that your Warm-Hello annual subscription will renew on ${renewalLabel}. You are receiving this email because auto-renewal is currently enabled on your account.\n\nOn the renewal date you will be charged ${p.year} (taxes may apply), and your check-ins will continue uninterrupted for another 12 months.\n\nIf you'd like to review or cancel:\n${SAMPLE.settingsLink}\n\nCancelling is a single click from Dashboard → Settings → Subscription. No phone calls, no emails, no cancellation fees — and your coverage continues until the end of the term you've already paid for.\n\nIf you have any questions about your renewal, reply to this email or write to ${SALES_EMAIL}.\n\nWarmly,\nThe Warm-Hello Team${f.text}`,
      html: `<p><img src="${LOGO}" alt="Warm-Hello" width="140" /></p>
<p>Hi there,</p>
<p>This is a friendly reminder that your Warm-Hello annual subscription will renew on <strong>${renewalLabel}</strong>. You are receiving this email because auto-renewal is currently enabled on your account.</p>
<p>On the renewal date you will be charged <strong>${p.year}</strong> (taxes may apply), and your check-ins will continue uninterrupted for another 12 months.</p>
<p>If you&rsquo;d like to review or cancel, visit <a href="${SAMPLE.settingsLink}">Dashboard &rarr; Settings</a>.</p>
<p>Cancelling is a single click from Dashboard &rarr; Settings &rarr; Subscription. No phone calls, no emails, no cancellation fees &mdash; and your coverage continues until the end of the term you&rsquo;ve already paid for.</p>
<p>If you have any questions about your renewal, reply to this email or write to <a href="mailto:${SALES_EMAIL}">${SALES_EMAIL}</a>.</p>
<p>Warmly,<br />The Warm-Hello Team</p>
${f.html}`,
    };
  },
});

VARIANTS.push({
  id: "09", category: "💰 Billing", name: "Subscription Cancelled (Auto-renew OFF)",
  subject: "Auto-renewal is now OFF on your Warm-Hello subscription",
  replyTo: SALES_EMAIL,
  build: () => {
    const f = buildFooter({ unsubCopy: "To stop billing-related notices,", unsubLink: SAMPLE.unsubscribeLink });
    const label = dateLabel(SAMPLE.nextRenewal);
    return {
      text: `Hi there,\n\nThis is a confirmation that we've turned OFF auto-renewal on your Warm-Hello subscription.\n\nYour subscription will remain active until the end of your current paid billing period on ${label}. During this time, check-ins and trusted escalation notifications continue uninterrupted. No future renewal charges will be made.\n\nIf you'd like to reactivate auto-renewal at any time before ${label}, visit:\n${SAMPLE.settingsLink}\n\nQuestions? Reply to this email or write to ${SALES_EMAIL}.\n\nWarmly,\nThe Warm-Hello Team${f.text}`,
      html: `<p><img src="${LOGO}" alt="Warm-Hello" width="140" /></p>
<p>Hi there,</p>
<p>This is a confirmation that we&rsquo;ve turned <strong>OFF auto-renewal</strong> on your Warm-Hello subscription.</p>
<p>Your subscription will remain active until the end of your current paid billing period on <strong>${label}</strong>. During this time, check-ins and trusted escalation notifications continue uninterrupted. No future renewal charges will be made.</p>
<p>If you&rsquo;d like to reactivate auto-renewal at any time before ${label}, visit <a href="${SAMPLE.settingsLink}">Dashboard &rarr; Settings &rarr; Subscription</a>.</p>
<p>Questions? Reply to this email or write to <a href="mailto:${SALES_EMAIL}">${SALES_EMAIL}</a>.</p>
<p>Warmly,<br />The Warm-Hello Team</p>
${f.html}`,
    };
  },
});

VARIANTS.push({
  id: "10", category: "💰 Billing", name: "Invoice Payment Failed",
  subject: "Action needed: payment did not go through ($144.00 CAD)",
  replyTo: SALES_EMAIL,
  build: () => {
    const f = buildFooter({ unsubCopy: "To stop billing notification emails,", unsubLink: SAMPLE.unsubscribeLink });
    const attempts = 2;
    const amt = "CA$144.00 CAD";
    const due = "Sep 30, 2026";
    return {
      text: `Hi there,\n\nThis is an automated message from Warm-Hello.\n\nWe were unable to process the payment of ${amt} due ${due} for your Warm-Hello subscription. This is attempt ${attempts}.\n\nHow to resolve this right now:\n  • Visit your Dashboard Billing settings to update your payment method:\n    ${SAMPLE.settingsLink}\n  • Or review the charge with your card issuer / bank to make sure there are no blocks on the card.\n\nService remains accessible for a short grace period. If payment cannot be collected, access may be restricted and your subscription eventually cancelled. You can review subscription status at any time:\n  ${SAMPLE.dashboardLink}\n\nWarm-Hello is a routine check-in and notification service only. It does not contact 911 or emergency services. Subscriptions automatically renew unless cancelled before the next renewal date. See the full Terms of Service and Privacy Policy on the website for the cancellation and refund policy that apply.\n\nWarmly,\nThe Warm-Hello Team${f.text}`,
      html: `<p><img src="${LOGO}" alt="Warm-Hello" width="140" /></p>
<p>Hi there,</p>
<p style="margin:18px 0 6px;"><strong style="font-size:15px; color:#92400e;">⚠ Payment not processed</strong></p>
<p style="margin:0 0 10px;">We were unable to process the payment of <strong>${amt}</strong> due ${due} for your Warm-Hello subscription. This is the ${attempts}. billing attempt.</p>
<p><strong>How to resolve this right now:</strong></p>
<ul style="margin:0 0 8px 20px; padding:0; line-height:1.7;">
  <li>Update your payment method in <a href="${SAMPLE.settingsLink}">Billing settings</a></li>
  <li>Contact your card issuer or bank and confirm there are no blocks or holds on the card</li>
</ul>
<p style="color:#59617a;">Service remains accessible during a short grace period. If payment cannot be collected, access may be restricted and your subscription may eventually be cancelled. You can review your subscription status at any time from your <a href="${SAMPLE.dashboardLink}">Dashboard</a>.</p>
<p style="color:#59617a;">Warm-Hello is a routine check-in and notification service. It does not contact 911 or emergency services. Subscriptions automatically renew unless cancelled before the next renewal date. See the full Terms and Privacy Policy on the website for the cancellation and refund policy that apply.</p>
<p>Warmly,<br />The Warm-Hello Team</p>
${f.html}`,
    };
  },
});

VARIANTS.push({
  id: "11", category: "💰 Billing", name: "Winback Offer (25% off Returning Subscribers)",
  subject: "We miss you — 25% off your first year back with Warm-Hello",
  replyTo: SALES_EMAIL,
  build: () => {
    const f = buildFooter({ unsubCopy: "To stop receiving these offer emails,", unsubLink: SAMPLE.unsubscribeLink });
    const p = plan();
    const discounted = p.cur === "CAD" ? "$108.00 CAD for the first year" : "$81.00 USD for the first year";
    return {
      text: `Hi there,\n\nWe noticed your Warm-Hello trial ended and you haven't come back to check-ins yet. We'd love to have you and your family back.\n\nFor a limited time, you can subscribe to the Annual plan and get 25% off your first year: ${discounted} (regularly ${p.year}).\n\nClaim your discount:\n${SAMPLE.winbackLink}\n\nThis link will take you straight to checkout with the discount already applied.\n\nIf you have any questions, reply to this email or write to ${SALES_EMAIL}.\n\nWarmly,\nThe Warm-Hello Team${f.text}`,
      html: `<p><img src="${LOGO}" alt="Warm-Hello" width="140" /></p>
<p>Hi there,</p>
<p>We noticed your Warm-Hello trial ended and you haven&rsquo;t come back to check-ins yet. We&rsquo;d love to have you and your family back.</p>
<p>For a limited time, you can subscribe to the Annual plan and get <strong>25% off your first year</strong>: <strong>${discounted}</strong> (regularly ${p.year}).</p>
<p><a href="${SAMPLE.winbackLink}" style="display:inline-block; background:#2b6cb0; color:#ffffff; padding:12px 20px; border-radius:6px; text-decoration:none; font-weight:600;">Claim your 25% off</a></p>
<p>This link will take you straight to checkout with the discount already applied.</p>
<p>If you have any questions, reply to this email or write to <a href="mailto:${SALES_EMAIL}">${SALES_EMAIL}</a>.</p>
<p>Warmly,<br />The Warm-Hello Team</p>
${f.html}`,
    };
  },
});

VARIANTS.push({
  id: "12", category: "🚨 Escalation Alert", name: "Senior Did Not Respond",
  subject: `Escalation: ${SAMPLE.seniorFirstName} ${SAMPLE.seniorLastName} has not responded to today's check-in`,
  replyTo: SALES_EMAIL,
  build: () => {
    const f = buildFooter({ unsubCopy: "To stop escalation alert emails,", unsubLink: SAMPLE.unsubscribeLink });
    const scheduled = new Date(SAMPLE.scheduledCheckInIso);
    const dateLabelFmt = scheduled.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    const timeLabelFmt = scheduled.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    const seniorFull = `${SAMPLE.seniorFirstName} ${SAMPLE.seniorLastName}`;
    return {
      text: `Hi there,\n\nThis is an automated escalation alert from Warm-Hello.\n\n${seniorFull} has NOT responded to today's daily check-in, which was scheduled for ${dateLabelFmt} at ${timeLabelFmt}. We sent the initial SMS check-in and one friendly follow-up, and after two unanswered attempts we have now alerted the trusted escalation contacts you configured by SMS.\n\nWhat you can do right now:\n\n  • Call ${seniorFull} directly to check in by phone\n  • Review the check-in status and take action from your Dashboard:\n    ${SAMPLE.dashboardLink}\n  • Open the check-in directly (useful if you want to mark it resolved):\n    ${SAMPLE.checkInLink}\n\nIf this was a false alarm (the senior was busy, outside, or napping and will reply shortly), no action is needed — everything is logged in your 7-day timeline for your records.\n\nIf you are no longer the caregiver for this senior, please update your household contacts or remove this senior from Dashboard → Settings → Edit Household.\n\nWarmly,\nThe Warm-Hello Team${f.text}`,
      html: `<p><img src="${LOGO}" alt="Warm-Hello" width="140" /></p>
<p>Hi there,</p>
<p style="margin:18px 0 6px;"><strong style="font-size:15px; color:#991b1b;">⚠ Escalation alert</strong></p>
<p style="margin:0 0 10px;">${esc(seniorFull)} has <strong>not responded</strong> to today's daily check-in, scheduled for <strong>${esc(dateLabelFmt)} at ${esc(timeLabelFmt)}</strong>. We sent the initial SMS and one friendly follow-up; after two unanswered attempts we have now alerted the trusted escalation contacts you configured by SMS.</p>
<p><strong>What you can do right now:</strong></p>
<ul style="margin:0 0 8px 20px; padding:0; line-height:1.7;">
  <li>Call ${esc(seniorFull)} directly to check in by phone</li>
  <li>Review the check-in status and take action from your <a href="${SAMPLE.dashboardLink}">Dashboard</a></li>
  <li>Open the <a href="${SAMPLE.checkInLink}">check-in page directly</a> if you need to mark it resolved</li>
</ul>
<p style="color:#59617a;">If this was a false alarm (the senior was busy, outside, or napping and will reply shortly), no action is needed. The full escalation and outcome are saved in your 7-day timeline for your records.</p>
<p style="color:#59617a;">If you are no longer the caregiver for this senior, please update your household contacts or remove this senior from Dashboard &rarr; Settings &rarr; Edit Household.</p>
<p>Warmly,<br />The Warm-Hello Team</p>
${f.html}`,
    };
  },
});

VARIANTS.push({
  id: "13", category: "🔐 Security / Auth", name: "Magic Link: Set or Reset Password",
  subject: "Set or reset your Warm-Hello password",
  replyTo: SALES_EMAIL,
  build: () => {
    const f = buildFooter({ unsubCopy: "To stop account access notification emails,", unsubLink: SAMPLE.unsubscribeLink });
    const greeting = SAMPLE.caregiverName || "there";
    return {
      text: `Hi ${greeting},\n\nWe received a request to set or reset the password for your Warm-Hello account.\n\nIf you requested this, click the link below to set a new password and log in securely. This link expires ${SAMPLE.magicExpiresLabel} and can only be used once.\n\n${SAMPLE.magicLink}\n\nIf you did NOT request this, you can safely ignore this email. Your account remains secure.\n\nRequest details:\n  Account email: ${SAMPLE.caregiverEmail}\n  Approximate IP: ${SAMPLE.ipAddress}\n\nWarm-Hello is a routine check-in notification service. It does not contact 911 or emergency services and does not offer medical or health monitoring.\n\nWarmly,\nThe Warm-Hello Team${f.text}`,
      html: `<p><img src="${LOGO}" alt="Warm-Hello" width="140" /></p>
<p>Hi ${esc(greeting)},</p>
<p>We received a request to set or reset the password for your Warm-Hello account.</p>
<p>If you requested this, click the big button below to set a new password and log in securely. This link expires <strong>${esc(SAMPLE.magicExpiresLabel)}</strong> and can only be used once.</p>
<p style="text-align:center; margin: 22px 0 8px;">
  <a href="${SAMPLE.magicLink}" style="display:inline-block; background: linear-gradient(180deg, #0f766e, #065f46); color: #f8fafc; font-weight: 600; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-size: 16px; box-shadow: 0 6px 16px -10px rgba(6, 95, 70, 0.8);">Set password and log in</a>
</p>
<p style="text-align:center; color: #59617a; font-size: 13px; word-break: break-all; margin: 4px 0 18px;">
  <a href="${SAMPLE.magicLink}" style="color: #59617a; text-decoration: underline;">${SAMPLE.magicLink}</a>
</p>
<p style="border-left:4px solid #fb923c; margin:14px 0; padding:10px 14px; background:rgba(251,146,60,0.08); border-radius:8px;">
  <strong style="color:#7c2d12;">Not you?</strong> If you did <strong>NOT</strong> request this, you can safely ignore this email. No action is needed and your account remains secure.
</p>
<p style="font-size: 13px; color: #59617a;">
  <strong>Request details:</strong><br />
  Account email: <code style="background: #f1f5f9; padding: 2px 6px; border-radius: 6px;">${esc(SAMPLE.caregiverEmail)}</code><br />Approximate IP: <code style="background:#f1f5f9; padding: 2px 6px; border-radius:6px;">${esc(SAMPLE.ipAddress)}</code>
</p>
<p style="color:#59617a;">Warm-Hello is a routine check-in and notification service only. It does not contact 911 or emergency services, and it does not offer medical or health monitoring.</p>
<p>Warmly,<br />The Warm-Hello Team</p>
${f.html}`,
    };
  },
});

const formatAuditWhen = (d: Date) => d.toLocaleString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "shortGeneric" }) + " local time";

VARIANTS.push({
  id: "14", category: "🔐 Security", name: "Password Set Audit Confirmation",
  subject: "Your Warm-Hello password has been set",
  replyTo: SALES_EMAIL,
  build: () => {
    const f = buildFooter({ unsubCopy: "To stop account security notification emails,", unsubLink: SAMPLE.unsubscribeLink });
    const name = SAMPLE.caregiverName || "there";
    const whenLabel = formatAuditWhen(SAMPLE.passwordSetWhen);
    return {
      text: `Hi ${name},\n\nYour Warm-Hello account password was set on ${whenLabel}.\n\nYou can now log in with your email address and this new password at:\n${SAMPLE.authLoginPage}\n\nIf you did NOT set or reset your password recently (for example, via "Email me a secure sign-in link"), please:\n1. Change your password right away from the dashboard Settings page:\n   ${SAMPLE.settingsLink}\n2. Or reply to this email to let us know.\n\nActivity details:\n  Account email: ${SAMPLE.caregiverEmail}\n  Approximate IP: ${SAMPLE.ipAddress}\n  When: ${whenLabel}\n\nIf this was you, no action is required. This is just a security confirmation.\n\nWarmly,\nThe Warm-Hello Team${f.text}`,
      html: `<p><img src="${LOGO}" alt="Warm-Hello" width="140" /></p>
<p>Hi ${esc(name)},</p>
<p>Your Warm-Hello account password was <strong>set</strong> on <strong>${esc(whenLabel)}</strong>.</p>
<p>You can now log in with your email address and this new password:</p>
<p style="text-align:center; margin: 22px 0 8px;">
  <a href="${SAMPLE.authLoginPage}" style="display:inline-block; background: linear-gradient(180deg, #0f766e, #065f46); color: #f8fafc; font-weight: 600; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-size: 16px; box-shadow: 0 6px 16px -10px rgba(6, 95, 70, 0.8);">Log in to Warm-Hello</a>
</p>
<p style="border-left:4px solid #fb923c; margin:14px 0; padding:10px 14px; background:rgba(251,146,60,0.08); border-radius:8px;">
  <strong style="color:#7c2d12;">Not you?</strong> If you did NOT set or reset your password recently, <strong>change your password right now</strong> from the dashboard <a href="${SAMPLE.settingsLink}">Settings page</a>, or reply to this email for help.
</p>
<p style="font-size: 13px; color: #59617a;">
  <strong>Activity details:</strong><br />
  Account email: <code style="background: #f1f5f9; padding: 2px 6px; border-radius: 6px;">${esc(SAMPLE.caregiverEmail)}</code><br />Approximate IP: <code style="background:#f1f5f9; padding: 2px 6px; border-radius:6px;">${esc(SAMPLE.ipAddress)}</code><br />
  When: <code style="background:#f1f5f9; padding: 2px 6px; border-radius:6px;">${esc(whenLabel)}</code>
</p>
<p style="color:#59617a;">If this was you, no further action is needed.</p>
<p>Warmly,<br />The Warm-Hello Team</p>
${f.html}`,
    };
  },
});

VARIANTS.push({
  id: "15", category: "🔐 Security", name: "Password Changed Audit Confirmation",
  subject: "Your Warm-Hello password has been changed",
  replyTo: SALES_EMAIL,
  build: () => {
    const f = buildFooter({ unsubCopy: "To stop account security notification emails,", unsubLink: SAMPLE.unsubscribeLink });
    const name = SAMPLE.caregiverName || "there";
    const whenLabel = formatAuditWhen(SAMPLE.passwordChangedWhen);
    return {
      text: `Hi ${name},\n\nYour Warm-Hello account password was changed on ${whenLabel}.\n\nThe next time you log in, use your new password.\n\nIf you did NOT change your password from the dashboard Settings page, your account may be compromised. Please:\n1. Reset your password immediately using the secure link flow from the Log In page.\n2. Visit Settings to confirm everything else:\n   ${SAMPLE.settingsLink}\n3. Reply to this email to alert us if you keep seeing strange activity.\n\nActivity details:\n  Account email: ${SAMPLE.caregiverEmail}\n  Approximate IP: ${SAMPLE.ipAddress}\n  When: ${whenLabel}\n\nIf this was you, no action is required — enjoy the rest of your day.\n\nWarmly,\nThe Warm-Hello Team${f.text}`,
      html: `<p><img src="${LOGO}" alt="Warm-Hello" width="140" /></p>
<p>Hi ${esc(name)},</p>
<p>Your Warm-Hello account password was <strong>changed</strong> on <strong>${esc(whenLabel)}</strong>.</p>
<p>The next time you log in, use your new password.</p>
<p style="border-left:4px solid #fb923c; margin:14px 0; padding:10px 14px; background:rgba(251,146,60,0.08); border-radius:8px;">
  <strong style="color:#7c2d12;">Not you?</strong> If you did NOT change your password from the dashboard Settings page, your account may be compromised. <strong>Reset your password immediately</strong> using the secure sign-in link flow from the Log In page, then review your <a href="${SAMPLE.settingsLink}">Settings</a> and reply to this email if something still looks wrong.
</p>
<p style="font-size: 13px; color: #59617a;">
  <strong>Activity details:</strong><br />
  Account email: <code style="background: #f1f5f9; padding: 2px 6px; border-radius: 6px;">${esc(SAMPLE.caregiverEmail)}</code><br />Approximate IP: <code style="background:#f1f5f9; padding: 2px 6px; border-radius:6px;">${esc(SAMPLE.ipAddress)}</code><br />
  When: <code style="background:#f1f5f9; padding: 2px 6px; border-radius:6px;">${esc(whenLabel)}</code>
</p>
<p style="color:#59617a;">If this was you, no further action is needed.</p>
<p>Warmly,<br />The Warm-Hello Team</p>
${f.html}`,
    };
  },
});

VARIANTS.push({
  id: "16", category: "🏛️ Compliance / Account", name: "Account Deletion Confirmation",
  subject: "Warm-Hello account deletion confirmed",
  replyTo: SALES_EMAIL,
  build: () => {
    const f = buildFooter({ unsubCopy: "(this email confirms account deletion; no further emails will be delivered to this address after this notice; if this was not you contact us at", unsubLink: `mailto:${SALES_EMAIL}` });
    const nameLine = SAMPLE.caregiverName;
    const eff = dateLabel(SAMPLE.deletionEffective) + " 14:22 UTC";
    return {
      text: `Hi ${nameLine}\n\nThis email confirms that the Warm-Hello account associated with ${SAMPLE.caregiverEmail} has been deleted, effective ${eff}.\n\nHousehold data, check-in history, designated trusted escalation contacts, and related operational check-in records have been removed or anonymized per the data retention policy.\n\nImportant notes:\n  • Recurring subscription billing has been cancelled and no future renewal charges will be made.\n  • Certain records may be retained per applicable law for transaction, tax, security, fraud-prevention, and legal record-keeping purposes for the legally required period.\n  • Access to the Warm-Hello dashboard for this account has been permanently closed.\n\nPrivacy requests or concerns can be directed to ${SALES_EMAIL} with a 30-day response window as described in the Privacy Policy.\n\nWarm-Hello is a routine check-in notification service only. It does not provide medical monitoring or emergency dispatch services and does not contact 911 or emergency services.\n\nWarmly,\nThe Warm-Hello Team${f.text}`,
      html: `<p><img src="${LOGO}" alt="Warm-Hello" width="140" /></p>
<p>Hi ${esc(nameLine)},</p>
<p style="margin:18px 0 6px;"><strong style="font-size:15px; color:#111827;">✅ Account deletion confirmed</strong></p>
<p style="margin:0 0 10px;">This email confirms that the Warm-Hello account associated with <strong>${esc(SAMPLE.caregiverEmail)}</strong> has been deleted, effective <strong>${esc(eff)}</strong>.</p>
<p>Household data, check-in history, designated trusted escalation contacts, and related operational check-in records have been removed or anonymized per the data retention policy.</p>
<p><strong>Important notes:</strong></p>
<ul style="margin:0 0 8px 20px; padding:0; line-height:1.7;">
  <li>Recurring billing has been cancelled and no future renewal charges will be made.</li>
  <li>Certain records may be retained as required by transaction, tax, security, fraud-prevention, and legal record-keeping laws for the legally required period.</li>
  <li>Access to the Warm-Hello dashboard for this account has been permanently closed.</li>
</ul>
<p style="color:#59617a;">Privacy requests or concerns can be directed to <a href="mailto:${SALES_EMAIL}">${SALES_EMAIL}</a>; the response window is 30 days as described in the Privacy Policy.</p>
<p style="color:#59617a;">Warm-Hello is a routine check-in and notification service. It does not provide medical monitoring or emergency dispatch services and does not contact 911 or emergency services.</p>
<p>Warmly,<br />The Warm-Hello Team</p>
${f.html}`,
    };
  },
});

VARIANTS.push({
  id: "17", category: "🏛️ Compliance", name: "SMS STOP Opt-Out Recorded",
  subject: `SMS opt-out recorded for ${SAMPLE.seniorFirstName} ${SAMPLE.seniorLastName}`,
  replyTo: SALES_EMAIL,
  build: () => {
    const f = buildFooter({ unsubCopy: "To stop SMS compliance notification emails,", unsubLink: SAMPLE.unsubscribeLink });
    const optedLabel = formatAuditWhen(SAMPLE.optedOutAt);
    return {
      text: `Hi there,\n\nThis is an automated compliance confirmation from Warm-Hello.\n\nA STOP (opt-out) keyword reply was received from the phone number ending in ${SAMPLE.seniorPhoneLast4} associated with ${SAMPLE.seniorFirstName} ${SAMPLE.seniorLastName} at ${optedLabel}.\n\nWhat this means right now:\n  • No further Warm-Hello operational SMS check-in messages or SMS escalation alerts will be sent to this number going forward.\n  • Account emails (including billing and account notifications) are still delivered to the account owner email unless you unsubscribe via the link below.\n  • If this was a mistake or the senior wants to re-enable SMS, anyone may reply START from the opted-out phone to opt back in.\n\nManage household and phone number configuration from your Dashboard Settings:\n  ${SAMPLE.settingsLink}\n\nWarm-Hello is a routine check-in notification service only. It does not contact 911 or emergency services, and it does not offer medical or health monitoring. Trusted escalation contacts you designate receive escalations only according to the configuration you set.\n\nWarmly,\nThe Warm-Hello Team${f.text}`,
      html: `<p><img src="${LOGO}" alt="Warm-Hello" width="140" /></p>
<p>Hi there,</p>
<p style="margin:18px 0 6px;"><strong style="font-size:15px; color:#7c2d12;">📵 SMS opt-out recorded</strong></p>
<p style="margin:0 0 10px;">A <strong>STOP (opt-out)</strong> keyword reply was received from the phone number ending in <strong>${esc(SAMPLE.seniorPhoneLast4)}</strong> associated with <strong>${esc(SAMPLE.seniorFirstName)} ${esc(SAMPLE.seniorLastName)}</strong> at <strong>${esc(optedLabel)}</strong>.</p>
<p><strong>What this means right now:</strong></p>
<ul style="margin:0 0 8px 20px; padding:0; line-height:1.7;">
  <li>No further Warm-Hello operational SMS check-in messages or SMS escalation alerts will be sent to this number going forward.</li>
  <li>Account emails (including billing and account notifications) are still delivered to the account owner email unless you unsubscribe via the link below.</li>
  <li>If this was a mistake or you need to re-enable SMS for this senior, anyone may reply <strong>START</strong> from the phone that opted out to re-enable eligible SMS communications.</li>
</ul>
<p style="color:#59617a;">You can manage household and phone numbers from your <a href="${SAMPLE.settingsLink}">Dashboard Settings</a>.</p>
<p style="color:#59617a;">Warm-Hello is a routine check-in and notification service only. It does not contact 911 or emergency services, and it does not offer medical or health monitoring. Trusted escalation contacts you designate receive escalations only according to the configuration you set.</p>
<p>Warmly,<br />The Warm-Hello Team</p>
${f.html}`,
    };
  },
});

VARIANTS.push({
  id: "18", category: "🏛️ Compliance", name: "SMS START Opt-In Re-enabled",
  subject: `SMS re-enabled for ${SAMPLE.seniorFirstName} ${SAMPLE.seniorLastName}`,
  replyTo: SALES_EMAIL,
  build: () => {
    const f = buildFooter({ unsubCopy: "To stop account compliance notification emails,", unsubLink: SAMPLE.unsubscribeLink });
    const optedLabel = formatAuditWhen(SAMPLE.optedInAt);
    return {
      text: `Hi there,\n\nThis is an automated compliance confirmation from Warm-Hello.\n\nA START (opt-in) keyword was received from the phone number ending in ${SAMPLE.seniorPhoneLast4} associated with ${SAMPLE.seniorFirstName} ${SAMPLE.seniorLastName} at ${optedLabel}.\n\nWhat this means right now:\n  • Warm-Hello operational SMS check-in messages will resume to this number according to your configured schedule.\n  • Standard carrier message and data rates may apply.\n  • Anyone texting from this phone may reply STOP at any time to opt out again, or HELP for assistance info.\n\nManage your household and settings from the Dashboard Settings:\n  ${SAMPLE.settingsLink}\n\nWarm-Hello is a routine check-in and notification service. It does not contact 911 or emergency services and does not perform medical or health monitoring. Paid subscriptions automatically renew unless cancelled before the next renewal date per the Terms of Service.\n\nWarmly,\nThe Warm-Hello Team${f.text}`,
      html: `<p><img src="${LOGO}" alt="Warm-Hello" width="140" /></p>
<p>Hi there,</p>
<p style="margin:18px 0 6px;"><strong style="font-size:15px; color:#065f46;">✅ SMS communications re-enabled</strong></p>
<p style="margin:0 0 10px;">A <strong>START (opt-in)</strong> keyword was received from the phone number ending in <strong>${esc(SAMPLE.seniorPhoneLast4)}</strong> associated with <strong>${esc(SAMPLE.seniorFirstName)} ${esc(SAMPLE.seniorLastName)}</strong> at <strong>${esc(optedLabel)}</strong>.</p>
<p><strong>What this means right now:</strong></p>
<ul style="margin:0 0 8px 20px; padding:0; line-height:1.7;">
  <li>Warm-Hello operational SMS check-in messages will resume to this number according to your configured schedule.</li>
  <li>Standard carrier message and data rates may apply.</li>
  <li>Anyone texting from this phone may reply <strong>STOP</strong> at any time to opt out again, or <strong>HELP</strong> for assistance info.</li>
</ul>
<p style="color:#59617a;">Manage your household and settings from your <a href="${SAMPLE.settingsLink}">Dashboard Settings</a>.</p>
<p style="color:#59617a;">Warm-Hello is a routine check-in and notification service. It does not contact 911 or emergency services and does not perform medical or health monitoring. Paid subscriptions automatically renew unless cancelled before the next renewal date per the Terms of Service.</p>
<p>Warmly,<br />The Warm-Hello Team</p>
${f.html}`,
    };
  },
});

VARIANTS.push({
  id: "19", category: "📩 Internal", name: "Contact Form Submission",
  subject: "Warm-Hello contact form: John Smith",
  replyTo: "john.smith@bell.ca",
  build: () => {
    const name = "John Smith";
    const email = "john.smith@bell.ca";
    const msg =
      "Hello Warm-Hello team,\n\n" +
      "I am looking into a check-in solution for my 82 year old mother who lives alone in " +
      "Barrie. She has a mobile phone but finds apps very intimidating. I had a few questions before\n" +
      "signing up for the free trial:\n\n" +
      "1. Can I change the check-in time on weekends? She likes to sleep in on Saturdays and\n" +
      "   Sundays until 10am, but on weekdays 8am works best.\n" +
      "2. What happens if my brother also wants to receive escalation SMS notifications?\n\n" +
      "Thanks for building something so simple — the big green button looks perfect for her.\n\n" +
      "Best,\nJohn";
    return {
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${msg}`,
      html: `<p><img src="${LOGO}" alt="Warm-Hello" width="140" /></p><p><strong>Name:</strong> ${esc(name)}</p><p><strong>Email:</strong> ${esc(email)}</p><p><strong>Message:</strong></p><p>${esc(msg).replace(/\n/g, "<br />")}</p>`,
    };
  },
});

function kpi(label: string, value: string | number, color = "#0f172a") {
  return `<div style="flex:1 1 0; min-width:140px; padding:10px 14px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; margin:4px;"><p style="margin:0 0 4px 0; font-size:12px; color:#64748b; font-weight:600; letter-spacing:0.04em; text-transform:uppercase;">${label}</p><p style="margin:0; font-size:22px; font-weight:800; color:${color}; line-height:1.1;">${String(value)}</p></div>`;
}
function money(amt: number, cur: "USD" | "CAD") { return `${cur === "CAD" ? "C$" : "$"}${amt.toFixed(2)}`; }
function tbl(headers: string[], rows: string[][]) {
  const tr = (cells: string[], head: boolean) =>
    `<tr>${cells.map((c) => head
      ? `<th style="padding:10px 12px; font-size:12px; color:#475569; letter-spacing:0.06em; text-transform:uppercase; font-weight:700; text-align:left; border-bottom:1px solid #e2e8f0;">${c}</th>`
      : `<td style="padding:8px 10px; border-bottom:1px solid #e2e8f0; font-size:13px; color:#0f172a;">${esc(c)}</td>`).join("")}</tr>`;
  return `<div style="overflow-x:auto; margin:14px 0 18px;"><table style="width:100%; border-collapse:separate; border-spacing:0; border:1px solid #e2e8f0; border-radius:12px; overflow:hidden;"><thead style="background:#f1f5f9;">${tr(headers, true)}</thead><tbody>${rows.map((r) => tr(r, false)).join("")}</tbody></table></div>`;
}
function emptyMsg(m: string) { return `<p style="color:#64748b; font-style:italic; padding:12px 14px; background:#f8fafc; border:1px dashed #cbd5e1; border-radius:12px;">${m}</p>`; }

VARIANTS.push({
  id: "20", category: "📊 Operational Reports", name: "Daily Warm-Hello Sales / Ops Report",
  subject: "Warm-Hello Daily Report — October 01, 2026",
  replyTo: SALES_EMAIL,
  build: () => {
    const f = reportFooter();
    const html = `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color:#0f172a; max-width:880px; margin:0 auto;">
<p><img src="${LOGO}" alt="Warm-Hello" width="140" /></p>
<h1 style="margin:8px 0 4px 0; font-size:28px; font-weight:800; color:#0f172a;">Daily Warm-Hello Report</h1>
<p style="margin:0 0 18px 0; font-size:14px; color:#475569;">
Date: <strong>October 01, 2026</strong> (Eastern Time · America/Toronto)<br />
Window: Sep 30, 2026, 12:00 AM → Oct 01, 2026, 12:00 AM
</p>

<div style="display:flex; flex-wrap:wrap; gap:8px; margin:14px 0 18px;">
${kpi("Total Subscribers", 142, "#0f172a")}
${kpi("New Sign-Ups", 4, "#2563eb")}
${kpi("Trial → Expired", 3, "#7c3aed")}
${kpi("Paid Checkouts", 2, "#16a34a")}
${kpi("Check-Ins Scheduled", 89, "#0f172a")}
${kpi("Okay", 78, "#22c55e")}
${kpi("Call Me", 3, "#0ea5e9")}
${kpi("Escalated", 1, "#dc2626")}
${kpi("Expired", 5, "#94a3b8")}
${kpi("STOP Replies", 1, "#991b1b")}
${kpi("HELP Replies", 0, "#a16207")}
</div>

<h2 style="font-size:18px; margin:20px 0 10px; color:#0f172a;">New Sign-Ups Today</h2>
${tbl(
  ["Signed Up (ET)", "Caregiver", "Email", "Currency", "Status", "Senior", "Phone"],
  [
    ["Sep 30, 2026, 7:42 AM", "Sarah Chen", "sarah.chen.84@gmail.com", "CAD", "TRIAL", "Margaret Halliwell", "+1 416-555-0142"],
    ["Sep 30, 2026, 10:18 AM", "David Kowalski", "david.k.personal@outlook.com", "USD", "TRIAL", "Eleanor Kowalski", "+1 202-555-0119"],
    ["Sep 30, 2026, 3:04 PM", "Anita Desai", "anitar.desai@gmail.com", "CAD", "TRIAL", "Rajesh Desai", "+1 604-555-0181"],
    ["Sep 30, 2026, 9:11 PM", "Marcus Reid", "marcus.w.reid@proton.me", "USD", "TRIAL", "Gloria Reid", "+1 505-555-0131"],
  ],
)}

<h2 style="font-size:18px; margin:20px 0 10px; color:#0f172a;">Paid Checkouts / Conversions</h2>
${tbl(
  ["Paid At (ET)", "Caregiver", "Email", "Plan", "USD", "CAD"],
  [
    ["Sep 30, 2026, 11:07 AM", "Jennifer MacLeod", "jen.macleod@icloud.com", "Annual", "$0.00", "C$144.00"],
    ["Sep 30, 2026, 4:40 PM", "Robert Okafor", "robert.okafor@yahoo.com", "Monthly", "$12.00", "C$0.00"],
  ],
)}
<p style="margin:0 0 8px 0; font-size:14px;"><strong>USD Total:</strong> $12.00 &nbsp; · &nbsp; <strong>CAD Total:</strong> C$144.00</p>

<h2 style="font-size:18px; margin:20px 0 10px; color:#0f172a;">Trials Expiring End Of Day Yesterday</h2>
${tbl(
  ["Caregiver", "Email", "Trial Ended At (ET)"],
  [
    ["Lisa Tremblay", "l.tremblay@videotron.ca", "Sep 30, 2026, 11:59 PM"],
    ["Tom Whitfield", "tom.whitfield@hotmail.com", "Sep 30, 2026, 11:59 PM"],
    ["Priya Ramanathan", "priya.r@cogeco.net", "Sep 30, 2026, 11:59 PM"],
  ],
)}

<h2 style="font-size:18px; margin:20px 0 10px; color:#0f172a;">Check-In Response Breakdown</h2>
<table style="width:100%; border-collapse:separate; border-spacing:0; border:1px solid #e2e8f0; border-radius:12px; overflow:hidden;"><tbody>
${[
  ["Scheduled", "89", "#475569"],
  ["Okay (confirmed)", "78", "#16a34a"],
  ["Call Me requested", "3", "#2563eb"],
  ["Escalated to contact", "1", "#dc2626"],
  ["Expired (no response)", "5", "#94a3b8"],
  ["Pending / Open", "2", "#0ea5e9"],
].map((r) =>
  `<tr><td style="padding:8px 12px; border-bottom:1px solid #e2e8f0; font-size:13px; color:#475569;">${r[0]}</td><td style="padding:8px 12px; border-bottom:1px solid #e2e8f0; font-size:15px; font-weight:800; color:${r[2]}; text-align:right;">${r[1]}</td></tr>`
).join("")}
</tbody></table>

<h2 style="font-size:18px; margin:20px 0 10px; color:#0f172a;">Compliance SMS Inbound</h2>
<p style="font-size:14px; color:#334155; margin:0 0 4px;">
<strong>STOP replies (opt out):</strong> 1 &nbsp; · &nbsp;
<strong>HELP replies:</strong> 0
</p>
${f.html}
</div>`;

    const text =
      `Warm-Hello Daily Report — October 01, 2026 (Eastern)\n` +
      `Window: 2026-09-30T04:00:00.000Z → 2026-10-01T04:00:00.000Z\n\n` +
      `KPIs\n  Total Subscribers: 142\n  New Sign-Ups: 4\n  Trials Expired Today: 3\n  Paid Checkouts: 2  (USD 12.00  CAD 144.00)\n  Check-Ins Scheduled: 89\n    Okay: 78   Call Me: 3   Escalated: 1   Expired: 5   Pending: 2\n  STOP replies: 1   HELP replies: 0\n\n` +
      `New Sign-Ups (4)\n` +
      `· Sarah Chen <sarah.chen.84@gmail.com> · Currency CAD · Senior Margaret Halliwell +1 416-555-0142\n` +
      `· David Kowalski <david.k.personal@outlook.com> · Currency USD · Senior Eleanor Kowalski +1 202-555-0119\n` +
      `· Anita Desai <anitar.desai@gmail.com> · Currency CAD · Senior Rajesh Desai +1 604-555-0181\n` +
      `· Marcus Reid <marcus.w.reid@proton.me> · Currency USD · Senior Gloria Reid +1 505-555-0131\n\n` +
      `Paid Checkouts (2)\n` +
      `· Jennifer MacLeod <jen.macleod@icloud.com> · Annual · USD 0.00 CAD 144.00\n` +
      `· Robert Okafor <robert.okafor@yahoo.com> · Monthly · USD 12.00 CAD 0.00\n\n` +
      `Trials Expiring End Of Day (3)\n` +
      `· Lisa Tremblay <l.tremblay@videotron.ca>\n` +
      `· Tom Whitfield <tom.whitfield@hotmail.com>\n` +
      `· Priya Ramanathan <priya.r@cogeco.net>${f.text}`;

    return { html, text };
  },
});

VARIANTS.push({
  id: "21", category: "📊 Operational Reports", name: "Monthly Warm-Hello Sales / Ops Report",
  subject: "Warm-Hello Monthly Report — September 2026",
  replyTo: SALES_EMAIL,
  build: () => {
    const f = reportFooter();
    const html = `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color:#0f172a; max-width:880px; margin:0 auto;">
<p><img src="${LOGO}" alt="Warm-Hello" width="140" /></p>
<h1 style="margin:8px 0 4px 0; font-size:30px; font-weight:800; color:#0f172a;">Monthly Warm-Hello Report</h1>
<p style="margin:0 0 18px 0; font-size:14px; color:#475569;">
<strong>September 2026</strong> &nbsp; 2026-09-01 → 2026-09-30 (Eastern Time)
</p>

<div style="display:flex; flex-wrap:wrap; gap:8px; margin:14px 0 18px;">
${kpi("Revenue USD", "$348.00", "#16a34a")}
${kpi("Revenue CAD", "C$1,152.00", "#16a34a")}
${kpi("Paid Transactions", 11, "#22c55e")}
${kpi("Trials Created", 34, "#2563eb")}
${kpi("Trial → Paid", "7 · 21%", "#7c3aed")}
${kpi("Trials Expired (no purchase)", 19, "#0ea5e9")}
${kpi("Churned Subscribers", 2, "#dc2626")}
${kpi("Check-Ins Scheduled", 2318, "#0f172a")}
${kpi("Escalations Fired", 8, "#dc2626")}
${kpi("SMS Sent", 5124, "#475569")}
${kpi("STOP Replies", 6, "#991b1b")}
${kpi("HELP Replies", 2, "#a16207")}
${kpi("Active Seniors (today)", 118, "#16a34a")}
</div>

<h2 style="font-size:18px; margin:20px 0 10px; color:#0f172a;">Revenue · September 2026</h2>
${tbl(
  ["Date", "Caregiver", "Email", "Plan", "USD", "CAD"],
  [
    ["Sep 03, 2026", "Jennifer MacLeod", "jen.macleod@icloud.com", "Annual", "$0.00", "C$144.00"],
    ["Sep 05, 2026", "Hassan El-Sayed", "hassan.elsayed@gmail.com", "Annual", "$108.00", "C$0.00"],
    ["Sep 08, 2026", "Yuki Tanaka", "yuki.tanaka@rogers.com", "Monthly", "$0.00", "C$14.99"],
    ["Sep 09, 2026", "Diane Bergeron", "diane.bergeron@sympatico.ca", "Annual", "$0.00", "C$144.00"],
    ["Sep 11, 2026", "Michael Zhao", "michael.zhao88@hotmail.com", "Monthly", "$12.00", "C$0.00"],
    ["Sep 14, 2026", "Amelia Rossi", "amelia.rossi@yahoo.com", "Annual", "$108.00", "C$0.00"],
    ["Sep 16, 2026", "Rachel Greenberg", "r.greenberg@shaw.ca", "Annual", "$0.00", "C$144.00"],
    ["Sep 18, 2026", "Nathan Okonkwo", "nate.o@protonmail.com", "Monthly", "$12.00", "C$0.00"],
    ["Sep 22, 2026", "Priya Ramanathan", "priya.r@cogeco.net", "Annual", "$0.00", "C$144.00"],
    ["Sep 26, 2026", "Sofia Mendes", "sofia.mendes@aol.com", "Annual", "$108.00", "C$0.00"],
    ["Sep 30, 2026", "Robert Okafor", "robert.okafor@yahoo.com", "Monthly", "$12.00", "C$0.00"],
  ],
)}
<p style="font-size:14px; margin:0 0 6px 0;">
  <strong>Total USD:</strong> $348.00 ·
  <strong>Total CAD:</strong> C$1,152.00
</p>

<h2 style="font-size:18px; margin:20px 0 10px; color:#0f172a;">Trials & Conversion</h2>
${tbl(
  ["Signed Up", "Caregiver", "Email", "Currency"],
  [
    ["Sep 01, 2026", "Lisa Tremblay", "l.tremblay@videotron.ca", "CAD"],
    ["Sep 04, 2026", "Tom Whitfield", "tom.whitfield@hotmail.com", "USD"],
    ["Sep 09, 2026", "Priya Ramanathan", "priya.r@cogeco.net", "CAD"],
    ["Sep 14, 2026", "Sarah Chen", "sarah.chen.84@gmail.com", "CAD"],
    ["Sep 20, 2026", "David Kowalski", "david.k.personal@outlook.com", "USD"],
    ["Sep 27, 2026", "Anita Desai", "anitar.desai@gmail.com", "CAD"],
    ["Sep 30, 2026", "Marcus Reid", "marcus.w.reid@proton.me", "USD"],
  ],
)}
<p style="font-size:14px; color:#334155;">
Trials created: <strong>34</strong> ·
Converted to paid: <strong>7</strong> (21%) ·
Expired without purchase: <strong>19</strong>
</p>

<h2 style="font-size:18px; margin:20px 0 10px; color:#0f172a;">Churned / Canceled</h2>
${tbl(
  ["Caregiver", "Email", "Requested", "Canceled At"],
  [
    ["Leo Van Der Zee", "leo.vanderzee@gmail.com", "Aug 28, 2026", "Sep 14, 2026"],
    ["Harper Nichols", "harper.nichols@icloud.com", "Sep 01, 2026", "Sep 20, 2026"],
  ],
)}

<h2 style="font-size:18px; margin:20px 0 10px; color:#0f172a;">Check-Ins · Month</h2>
<table style="width:100%; border-collapse:separate; border-spacing:0; border:1px solid #e2e8f0; border-radius:12px; overflow:hidden;"><tbody>
${[
  ["Scheduled", "2,318", "#475569"],
  ["Okay", "2,045", "#16a34a"],
  ["Call Me", "64", "#2563eb"],
  ["Escalated", "58", "#dc2626"],
  ["Expired", "142", "#94a3b8"],
].map((r) =>
  `<tr><td style="padding:8px 12px; border-bottom:1px solid #e2e8f0; font-size:13px; color:#475569;">${r[0]}</td><td style="padding:8px 12px; border-bottom:1px solid #e2e8f0; text-align:right; font-size:15px; font-weight:800; color:${r[2]};">${r[1]}</td></tr>`
).join("")}
</tbody></table>

<h2 style="font-size:18px; margin:20px 0 10px; color:#0f172a;">Escalations · Month</h2>
<p style="font-size:14px; color:#334155;">
Total alert jobs: <strong>8</strong> ·
Succeeded: <strong>8</strong> ·
Failed: <strong>0</strong>
</p>

<h2 style="font-size:18px; margin:20px 0 10px; color:#0f172a;">End-Of-Month Subscriber Snapshot</h2>
<table style="width:100%; border-collapse:separate; border-spacing:0; border:1px solid #e2e8f0; border-radius:12px; overflow:hidden;"><tbody>
${[
  ["Total Subscribers", 142, "#0f172a"],
  ["Active Paid", 108, "#16a34a"],
  ["Trial", 21, "#2563eb"],
  ["Past Due", 3, "#d97706"],
  ["Canceled", 10, "#94a3b8"],
].map((r) =>
  `<tr><td style="padding:8px 12px; border-bottom:1px solid #e2e8f0; font-size:13px; color:#475569;">${r[0]}</td><td style="padding:8px 12px; border-bottom:1px solid #e2e8f0; text-align:right; font-size:15px; font-weight:800; color:${r[2]};">${r[1]}</td></tr>`
).join("")}
</tbody></table>

${f.html}
</div>`;

    const text =
      `Warm-Hello Monthly Report — September 2026\n` +
      `Window: 2026-09-01 → 2026-09-30 (Eastern)\n\n` +
      `KPIs\n  Revenue USD: 348.00\n  Revenue CAD: 1152.00\n  Paid transactions: 11\n  Trials created: 34\n  Trial → Paid: 7 (21%)\n  Trials expired no purchase: 19\n  Churned: 2\n  Check-ins scheduled: 2318\n    Okay: 2045  Call Me: 64  Escalated: 58  Expired: 142\n  Escalations total: 8 ok=8 failed=0\n  SMS sent: 5124  STOP=6  HELP=2\n  Active seniors today: 118\n\n` +
      `Revenue (11)\n` +
      `· Sep 03, 2026  Jennifer MacLeod  Annual  USD 0.00  CAD 144.00\n` +
      `· Sep 05, 2026  Hassan El-Sayed  Annual  USD 108.00  CAD 0.00\n` +
      `· Sep 08, 2026  Yuki Tanaka  Monthly  USD 0.00  CAD 14.99\n` +
      `· Sep 09, 2026  Diane Bergeron  Annual  USD 0.00  CAD 144.00\n` +
      `· Sep 11, 2026  Michael Zhao  Monthly  USD 12.00  CAD 0.00\n` +
      `· Sep 14, 2026  Amelia Rossi  Annual  USD 108.00  CAD 0.00\n` +
      `· Sep 16, 2026  Rachel Greenberg  Annual  USD 0.00  CAD 144.00\n` +
      `· Sep 18, 2026  Nathan Okonkwo  Monthly  USD 12.00  CAD 0.00\n` +
      `· Sep 22, 2026  Priya Ramanathan  Annual  USD 0.00  CAD 144.00\n` +
      `· Sep 26, 2026  Sofia Mendes  Annual  USD 108.00  CAD 0.00\n` +
      `· Sep 30, 2026  Robert Okafor  Monthly  USD 12.00  CAD 0.00\n\n` +
      `Trials created (34)\n` +
      `· Lisa Tremblay <l.tremblay@videotron.ca> · CAD\n` +
      `· Tom Whitfield <tom.whitfield@hotmail.com> · USD\n` +
      `· Priya Ramanathan <priya.r@cogeco.net> · CAD\n` +
      `· Sarah Chen <sarah.chen.84@gmail.com> · CAD\n` +
      `· David Kowalski <david.k.personal@outlook.com> · USD\n` +
      `· Anita Desai <anitar.desai@gmail.com> · CAD\n` +
      `· Marcus Reid <marcus.w.reid@proton.me> · USD\n\n` +
      `Churned / Canceled (2)\n` +
      `· Leo Van Der Zee <leo.vanderzee@gmail.com>\n` +
      `· Harper Nichols <harper.nichols@icloud.com>\n\n` +
      `End-of-month snapshot\n  Total: 142\n  Active Paid: 108\n  Trial: 21\n  Past Due: 3\n  Canceled: 10${f.text}`;

    return { html, text };
  },
});

// ─────────────── Write files ───────────────
const written: { id: string; category: string; name: string; subject: string; replyTo: string; htmlFile: string; txtFile: string; charCount: number }[] = [];

for (const v of VARIANTS) {
  const slug = `${v.id}-${v.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
  const { html, text } = v.build();

  // Wrap HTML in a iframe-friendly outer page (Gmail-ish envelope view):
  const wrapper =
    `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Preview ${v.id} — ${v.name}</title>
<style>
  html, body { margin:0; padding:0; background:#f6f8fb; color:#111827; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
  .shell { max-width: 920px; margin: 0 auto; padding: 28px 20px 60px; }
  .meta { background:#fff; border:1px solid #e5e7eb; border-radius:14px; padding:14px 18px; margin-bottom: 14px; box-shadow:0 1px 2px rgba(15,23,42,0.04); }
  .meta-row { display:flex; gap:10px; margin:6px 0; font-size:13px; line-height:1.5; }
  .meta-label { width:90px; color:#64748b; font-weight:600; text-transform:uppercase; letter-spacing:0.04em; }
  .meta-val { color:#0f172a; word-break: break-word; }
  .back { display:inline-block; margin-bottom: 14px; color:#2563eb; text-decoration:none; font-weight:600; font-size:13px; }
  .back:hover { text-decoration: underline; }
  .canvas { background:#fff; border:1px solid #e5e7eb; border-radius:14px; padding:28px; box-shadow:0 2px 12px rgba(15,23,42,0.05); }
</style>
</head>
<body>
  <div class="shell">
    <a class="back" href="./index.html">&larr; Back to all previews</a>
    <div class="meta">
      <div class="meta-row"><div class="meta-label">#</div><div class="meta-val">${v.id} / 21 · Category: ${v.category}</div></div>
      <div class="meta-row"><div class="meta-label">Name</div><div class="meta-val">${esc(v.name)}</div></div>
      <div class="meta-row"><div class="meta-label">From</div><div class="meta-val">Warm-Hello &lt;sales@warm-hello.com&gt;</div></div>
      <div class="meta-row"><div class="meta-label">To</div><div class="meta-val">sales@warm-hello.com</div></div>
      <div class="meta-row"><div class="meta-label">Reply-To</div><div class="meta-val">${esc(v.replyTo || "(not set)")}</div></div>
      <div class="meta-row"><div class="meta-label">Subject</div><div class="meta-val"><strong>${esc(v.subject)}</strong></div></div>
    </div>
    <div class="canvas">
${html}
    </div>
  </div>
</body>
</html>`;

  const htmlPath = path.join(OUT_DIR, `${slug}.html`);
  const txtPath = path.join(OUT_DIR, `${slug}.txt`);
  fs.writeFileSync(htmlPath, wrapper, "utf8");
  fs.writeFileSync(txtPath, text, "utf8");
  written.push({ id: v.id, category: v.category, name: v.name, subject: v.subject, replyTo: v.replyTo ?? "N/A", htmlFile: `${slug}.html`, txtFile: `${slug}.txt`, charCount: html.length + text.length });
}

// ─────────────── Index launcher ───────────────
const categories = Array.from(new Set(written.map((w) => w.category)));
const catRows = categories.map((cat) => {
  const rows = written.filter((w) => w.category === cat);
  return `<section class="cat">
<h2>${cat}</h2>
<table class="grid">
  <thead><tr><th style="width:64px;">#</th><th>Email Name</th><th style="width:42%;">Subject Line</th><th style="width:140px;">Reply-To</th><th style="width:150px;">Open</th></tr></thead>
  <tbody>
${rows.map((w) => `
  <tr>
    <td><strong>${w.id}</strong></td>
    <td>${esc(w.name)}</td>
    <td class="subject">${esc(w.subject)}</td>
    <td>${esc(w.replyTo)}</td>
    <td><a class="btn btn-html" href="${w.htmlFile}">HTML preview</a> <a class="btn btn-txt" href="${w.txtFile}">TXT</a></td>
  </tr>`).join("")}
  </tbody>
</table>
</section>`;
}).join("\n\n");

const index =
  `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Warm-Hello — All 21 Email Previews</title>
<style>
  :root {
    --bg: #f1f5f9;
    --card: #ffffff;
    --border: #e2e8f0;
    --ink: #0f172a;
    --muted: #64748b;
    --blue: #2563eb;
    --teal: #0f766e;
  }
  html, body { margin:0; padding:0; background:var(--bg); color:var(--ink); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
  .wrap { max-width: 1080px; margin: 0 auto; padding: 32px 20px 80px; }
  header { margin-bottom: 22px; }
  h1 { margin: 0 0 4px; font-size: 30px; font-weight: 800; letter-spacing: -0.01em; }
  .sub { margin: 0; color: var(--muted); font-size: 14px; }
  .legend { display:flex; gap:10px; flex-wrap:wrap; margin:16px 0 4px; }
  .chip { background: var(--card); border:1px solid var(--border); border-radius: 999px; padding:6px 12px; font-size:12px; font-weight:600; color: var(--ink); }
  .cat { margin: 26px 0 10px; }
  h2 { margin: 0 0 10px; font-size: 15px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; }
  .grid { width:100%; border-collapse: separate; border-spacing: 0; background: var(--card); border:1px solid var(--border); border-radius: 14px; overflow:hidden; box-shadow:0 1px 3px rgba(15,23,42,0.04); }
  .grid th { background:#f8fafc; color:var(--muted); text-transform: uppercase; font-size:11px; letter-spacing:0.06em; padding:12px 14px; border-bottom:1px solid var(--border); text-align:left; font-weight:700; }
  .grid td { padding:12px 14px; border-bottom:1px solid var(--border); font-size:14px; vertical-align: middle; }
  .grid tr:last-child td { border-bottom: 0; }
  .grid tr:hover td { background: #f8fbff; }
  .subject { color:#334155; }
  .btn { display:inline-block; padding:6px 10px; border-radius:8px; text-decoration:none; font-weight:600; font-size:12px; margin-right:6px; }
  .btn-html { background: var(--teal); color:#fff; }
  .btn-html:hover { background: #0b5c55; }
  .btn-txt { background: #f1f5f9; color: var(--ink); border:1px solid var(--border); }
  .btn-txt:hover { background: #e2e8f0; }
</style>
</head>
<body>
  <div class="wrap">
    <header>
      <h1>📬 Warm-Hello — 21 Email Template Previews</h1>
      <p class="sub">Every outbound email in the Warm-Hello app, rendered as HTML with sample data. Click <strong>HTML preview</strong> on any row to see the rendered email body.</p>
      <div class="legend">
        <span class="chip">🧪 Trial: 4</span>
        <span class="chip">💰 Billing: 7</span>
        <span class="chip">🚨 Escalation: 1</span>
        <span class="chip">🔐 Security: 3</span>
        <span class="chip">🏛️ Compliance: 3</span>
        <span class="chip">📩 Internal: 1</span>
        <span class="chip">📊 Reports: 2</span>
      </div>
    </header>

${catRows}

  </div>
</body>
</html>`;

const indexPath = path.join(OUT_DIR, "index.html");
fs.writeFileSync(indexPath, index, "utf8");

console.log(`\n✅ Wrote ${written.length} email previews to:\n   scripts/email-previews/`);
console.log(`\nOpen index to browse all at once:\n   file:///${OUT_DIR.replace(/\\/g, "/")}/index.html\n`);
for (const w of written) {
  console.log(`   [${w.id}] ${w.category.split(" ")[0]} ${w.name.padEnd(58, " ")} → ${w.htmlFile}`);
}
console.log(`\nTotal files: ${written.length * 2 + 1} (${written.length} HTML, ${written.length} TXT, 1 index)`);
