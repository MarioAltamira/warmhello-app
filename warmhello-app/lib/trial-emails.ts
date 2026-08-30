import { prisma } from "@/lib/prisma";
import type Stripe from "stripe";
import { sendEmail } from "@/lib/email";
import { env } from "@/lib/env";
import { LEGAL_ENTITY_PLACEHOLDERS } from "@/lib/legal-placeholders";
import { createUnsubscribeToken } from "@/lib/unsubscribe";
import { pricingPlanFor, type BillingCurrency } from "@/lib/pricing";

const SALES_EMAIL = "sales@warm-hello.com";

async function getTrialSubscriber(subscriberId: string) {
  if (!prisma) {
    return null;
  }

  const subscriber = await prisma.subscriber.findUnique({
    where: { id: subscriberId },
  });

  if (
    !subscriber ||
    subscriber.subscriptionStatus !== "TRIAL" ||
    subscriber.unsubscribedAt !== null
  ) {
    return null;
  }

  return subscriber;
}

async function getSubscriberForEmail(subscriberId: string) {
  if (!prisma) {
    return null;
  }

  const subscriber = await prisma.subscriber.findUnique({
    where: { id: subscriberId },
  });

  if (!subscriber || subscriber.unsubscribedAt !== null) {
    return null;
  }

  return subscriber;
}

async function getSubscriberWithHousehold(subscriberId: string) {
  if (!prisma) {
    return null;
  }

  const subscriber = await prisma.subscriber.findUnique({
    where: { id: subscriberId },
    include: {
      seniors: { include: { contacts: true } },
    },
  });

  if (!subscriber || subscriber.unsubscribedAt !== null) {
    return null;
  }

  return subscriber;
}

function getDashboardLink() {
  return `${env.APP_URL}/dashboard`;
}

function getBuyNowLink(subscriberId: string) {
  return `${env.APP_URL}/subscribe/${subscriberId}`;
}

function getSettingsLink() {
  return `${env.APP_URL}/dashboard/settings`;
}

function getUnsubscribeLink(subscriberId: string) {
  const token = createUnsubscribeToken({ subscriberId });
  return `${env.APP_URL}/unsubscribe/${token}`;
}

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

function formatDateYYYYMMDD(date: Date | null | undefined) {
  if (!date) return "See Dashboard";
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`;
}

function buildEmailFooter(options: {
  unsubscribeCopy: string;
  unsubscribeLink: string;
}) {
  const entity = LEGAL_ENTITY_PLACEHOLDERS.LEGAL_ENTITY_NAME;
  const mailing = LEGAL_ENTITY_PLACEHOLDERS.CA_MAILING_ADDRESS;
  const support = SALES_EMAIL;
  const identityHtml =
    `<p style="margin: 0 0 8px 0; font-size: 12px; line-height: 1.55; color: #3a3f54;">` +
    `${entity} · ${mailing}. Questions? Email <a href="mailto:${support}" style="color: #59617a; text-decoration: underline;">${support}</a>.` +
    `</p>`;
  const identityText = `\n\n${entity}\n${mailing}\nQuestions? Email ${support}.`;

  return {
    html:
      identityHtml +
      `<p style="margin: 0; font-size: 12px; line-height: 1.55; color: #59617a;">` +
      `${options.unsubscribeCopy} <a href="${options.unsubscribeLink}" style="color: #59617a; text-decoration: underline;">unsubscribe</a>.` +
      `</p>`,
    text:
      identityText +
      `\n\n${options.unsubscribeCopy}: ${options.unsubscribeLink}`,
  };
}

export async function sendTrialWelcomeEmail(subscriberId: string) {
  const subscriber = await getTrialSubscriber(subscriberId);
  if (!subscriber) {
    return {
      ok: false as const,
      message:
        "Trial welcome email skipped: subscriber not found, not in TRIAL status, or already unsubscribed.",
      id: null,
    };
  }

  const dashboardLink = getDashboardLink();
  const unsubscribeLink = getUnsubscribeLink(subscriber.id);
  const footer = buildEmailFooter({
    unsubscribeCopy: "To stop trial emails,",
    unsubscribeLink,
  });

  const currency: BillingCurrency = (subscriber.billingCurrency as BillingCurrency) ?? "USD";
  const plan = pricingPlanFor(currency);

  return sendEmail({
    to: subscriber.email,
    subject: "Welcome to Warm-Hello - A simple morning check-in routine",
    replyTo: SALES_EMAIL,
    text: `Hi there,

Thank you for choosing Warm-Hello to help stay connected with your loved one. We know that balancing their independence with your need to check in can be difficult, and we're here to make that rhythm effortless.

Remember: Warm-Hello is a routine check-in service, NOT an emergency service. In an emergency, call 911.

Getting started is simple:
If you haven't already, please finish setting up your account and schedule your preferred morning check-in time via your Dashboard:
${dashboardLink}

Remember, there's nothing for your loved one to download or learn. They'll receive a gentle, friendly text each morning with a secure link. A single tap on the big "I'm OK" button is all it takes to keep you in the loop.

Your 7-day free trial does not automatically convert to a paid subscription. No charge will be made when your trial ends. After the trial, choose between:
- Monthly: ${plan.monthlyLabel}
- Annual: ${plan.yearlyLabel}

We're here to help you get settled. If you have any questions, just hit reply to this email.

Warmly,
The Warm-Hello Team${footer.text}`,
    html: `<p><img src="${env.APP_URL}/warmhello-logo-b.png" alt="Warm-Hello" width="140" /></p>
<p>Hi there,</p>
<p>Thank you for choosing Warm-Hello to help stay connected with your loved one. We know that balancing their independence with your need to check in can be difficult, and we&rsquo;re here to make that rhythm effortless.</p>
<p style="border-left:4px solid #ffd666; margin:14px 0; padding:10px 14px; background:rgba(255,214,102,0.08); border-radius:8px;">
  <strong style="color:#991b1b;">Reminder:</strong> Warm-Hello is a routine check-in service, <strong>NOT an emergency service</strong>. In an emergency, call 911.
</p>
<p><strong>Getting started is simple:</strong><br />If you haven't already, please finish setting up your account and schedule your preferred morning check-in time via your <a href="${dashboardLink}">Dashboard</a>.</p>
<p>Remember, there&rsquo;s nothing for your loved one to download or learn. They&rsquo;ll receive a gentle, friendly text each morning with a secure link. A single tap on the big &ldquo;I&rsquo;m OK&rdquo; button is all it takes to keep you in the loop.</p>
<blockquote style="border-left:4px solid #7be3a9; margin:14px 0; padding:10px 14px; background:rgba(123,227,169,0.08); border-radius:8px;">
  <p style="margin:0;">Your 7-day free trial does <strong>not</strong> automatically convert to a paid subscription. No charge will be made when your trial ends. After the trial, choose between:</p>
  <ul style="margin:8px 0 0 20px; padding:0;">
    <li><strong>Monthly:</strong> ${plan.monthlyLabel}</li>
    <li><strong>Annual:</strong> ${plan.yearlyLabel}</li>
  </ul>
</blockquote>
<p>We&rsquo;re here to help you get settled. If you have any questions, just hit reply to this email.</p>
<p>Warmly,<br />The Warm-Hello Team</p>
${footer.html}`,
  });
}

export async function sendTrialNudgeEmail(subscriberId: string) {
  const subscriber = await getTrialSubscriber(subscriberId);
  if (!subscriber) {
    return {
      ok: false as const,
      message:
        "Trial nudge email skipped: subscriber not found, not in TRIAL status, or already unsubscribed.",
      id: null,
    };
  }

  const buyNowLink = getBuyNowLink(subscriber.id);
  const unsubscribeLink = getUnsubscribeLink(subscriber.id);
  const footer = buildEmailFooter({
    unsubscribeCopy: "To stop trial emails,",
    unsubscribeLink,
  });

  const currency: BillingCurrency = (subscriber.billingCurrency as BillingCurrency) ?? "USD";
  const plan = pricingPlanFor(currency);

  return sendEmail({
    to: subscriber.email,
    subject: "How is your first week going with Warm-Hello?",
    replyTo: SALES_EMAIL,
    text: `Hi there,

We hope the first few days of using Warm-Hello have brought a little more calm to your mornings.

We designed Warm-Hello to be completely frictionless-a quick "check-in" that feels more like a morning wave than a medical alert. How is it working for you and your loved one so far?

Your 7-day free trial does not automatically convert to a paid subscription. At the end of your trial, you must actively choose a plan to continue using Warm-Hello. You can pick:
- Monthly: ${plan.monthlyLabel}
- Annual: ${plan.yearlyLabel}

Choose a plan to continue after the trial:
${buyNowLink}

We are always looking to improve. If you have any feedback on your experience so far, we'd love to hear it!

Best,
The Warm-Hello Team${footer.text}`,
    html: `<p><img src="${env.APP_URL}/warmhello-logo-b.png" alt="Warm-Hello" width="140" /></p>
<p>Hi there,</p>
<p>We hope the first few days of using Warm-Hello have brought a little more calm to your mornings.</p>
<p>We designed Warm-Hello to be completely frictionless-a quick &ldquo;check-in&rdquo; that feels more like a morning wave than a medical alert. How is it working for you and your loved one so far?</p>
<blockquote style="border-left:4px solid #7be3a9; margin:16px 0; padding:10px 14px; background:rgba(123,227,169,0.08); border-radius:8px;">
  <p style="margin:0;">Your 7-day free trial does <strong>not</strong> automatically convert to a paid subscription. At the end of your trial, you must actively choose a plan to continue using Warm-Hello. You can pick:</p>
  <ul style="margin:8px 0 0 20px; padding:0;">
    <li><strong>Monthly:</strong> ${plan.monthlyLabel}</li>
    <li><strong>Annual:</strong> ${plan.yearlyLabel}</li>
  </ul>
</blockquote>
<p><a href="${buyNowLink}" style="font-weight:600;">Choose a plan to continue after the trial &rarr;</a></p>
<p>We are always looking to improve. If you have any feedback on your experience so far, we&rsquo;d love to hear it!</p>
<p>Best,<br />The Warm-Hello Team</p>
${footer.html}`,
  });
}

export async function sendTrialFinalEmail(subscriberId: string) {
  const subscriber = await getTrialSubscriber(subscriberId);
  if (!subscriber) {
    return {
      ok: false as const,
      message:
        "Trial final email skipped: subscriber not found, not in TRIAL status, or already unsubscribed.",
      id: null,
    };
  }

  const buyNowLink = getBuyNowLink(subscriber.id);
  const dashboardLink = getDashboardLink();
  const unsubscribeLink = getUnsubscribeLink(subscriber.id);
  const footer = buildEmailFooter({
    unsubscribeCopy: "To stop trial emails,",
    unsubscribeLink,
  });

  const currency: BillingCurrency = (subscriber.billingCurrency as BillingCurrency) ?? "USD";
  const plan = pricingPlanFor(currency);

  return sendEmail({
    to: subscriber.email,
    subject: "Your trial has ended - stay connected with Warm-Hello",
    replyTo: SALES_EMAIL,
    text: `Hi there,

Your 7-day free trial of Warm-Hello has concluded. We hope that over the past week, you've experienced how much easier it is to stay connected without having to be "the person who checks in" every single morning.

Your free trial does not automatically convert to a paid subscription. No charge has been made. If you'd like to keep the automated check-ins running, you can officially activate your subscription today by choosing:
- Monthly: ${plan.monthlyLabel}
- Annual: ${plan.yearlyLabel}

Activate your Warm-Hello subscription here:
${buyNowLink}

If you don't choose a plan, check-ins will stop until you subscribe. No charge will be made.

Thank you for trying Warm-Hello and for trusting us to help bridge the gap between respect for their independence and your own desire to stay in touch.

Questions? Reply to this email or write to ${SALES_EMAIL}.

Warmly,
The Warm-Hello Team${footer.text}`,
    html: `<p><img src="${env.APP_URL}/warmhello-logo-b.png" alt="Warm-Hello" width="140" /></p>
<p>Hi there,</p>
<p>Your 7-day free trial of Warm-Hello has concluded. We hope that over the past week, you&rsquo;ve experienced how much easier it is to stay connected without having to be &ldquo;the person who checks in&rdquo; every single morning.</p>
<blockquote style="border-left:4px solid #7be3a9; margin:16px 0; padding:10px 14px; background:rgba(123,227,169,0.08); border-radius:8px;">
  <p style="margin:0;">Your free trial does <strong>not</strong> automatically convert to a paid subscription. No charge has been made. If you&rsquo;d like to keep the automated check-ins running, activate your subscription today by choosing:</p>
  <ul style="margin:8px 0 0 20px; padding:0;">
    <li><strong>Monthly:</strong> ${plan.monthlyLabel}</li>
    <li><strong>Annual:</strong> ${plan.yearlyLabel}</li>
  </ul>
</blockquote>
<p><a href="${buyNowLink}" style="font-weight:600;">Activate your Warm-Hello subscription here &rarr;</a></p>
<p>If you don&rsquo;t choose a plan, check-ins will stop until you subscribe. No charge will be made.</p>
<p>Thank you for trying Warm-Hello and for trusting us to help bridge the gap between respect for their independence and your own desire to stay in touch.</p>
<p>Questions? Reply to this email or write to <a href="mailto:${SALES_EMAIL}">${SALES_EMAIL}</a>.</p>
<p>Warmly,<br />The Warm-Hello Team</p>
${footer.html}`,
  });
}

export type SuccessfulSubscriptionEmailOptions = {
  invoicePdfUrl?: string | null;
  hostedInvoiceUrl?: string | null;
  receiptUrl?: string | null;
  statusPaid?: boolean;
};

export async function pollStripeInvoiceUntilPaid(
  invoiceId: string,
  opts: {
    maxAttempts?: number;
    sleepMs?: number;
  } = {},
): Promise<{ status: string; invoicePdf: string | null; hostedInvoiceUrl: string | null; receiptUrl: string | null; gaveUp: boolean; attempts: number }> {
  const maxAttempts = opts.maxAttempts ?? 8;
  const sleepMs = opts.sleepMs ?? 2000;
  let attempts = 0;
  let lastStatus: string = "unknown";
  let lastPdf: string | null = null;
  let lastHosted: string | null = null;
  let lastReceipt: string | null = null;

  const extractReceiptUrlFromInvoice = (inv: Stripe.Invoice): string | null => {
    const charge = (inv as unknown as { charge?: Stripe.Charge | string | null }).charge;
    if (charge && typeof charge === "object" && typeof (charge as Stripe.Charge).receipt_url === "string") {
      return (charge as Stripe.Charge).receipt_url;
    }
    return null;
  };

  for (attempts = 1; attempts <= maxAttempts; attempts++) {
    try {
      const { getStripeClient } = await import("@/lib/stripe");
      const stripe = getStripeClient();
      if (!stripe) break;
      const invoice = await stripe.invoices.retrieve(invoiceId, {
        expand: ["charge"],
      });
      lastStatus = invoice.status ?? "unknown";
      lastPdf = invoice.invoice_pdf ?? null;
      lastHosted = invoice.hosted_invoice_url ?? null;
      lastReceipt = extractReceiptUrlFromInvoice(invoice);
      if (lastStatus === "paid") {
        return { status: lastStatus, invoicePdf: lastPdf, hostedInvoiceUrl: lastHosted, receiptUrl: lastReceipt, gaveUp: false, attempts };
      }
    } catch (err) {
      console.warn(
        `[pollStripeInvoiceUntilPaid] retrieve failed attempt=${attempts}/${maxAttempts} id=${invoiceId}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
    if (attempts < maxAttempts) {
      await new Promise((r) => setTimeout(r, sleepMs));
    }
  }
  return { status: lastStatus, invoicePdf: lastPdf, hostedInvoiceUrl: lastHosted, receiptUrl: lastReceipt, gaveUp: true, attempts };
}

export async function sendSuccessfulSubscriptionEmail(
  subscriberId: string,
  opts: SuccessfulSubscriptionEmailOptions = {},
) {
  const subscriber = await getSubscriberWithHousehold(subscriberId);
  if (!subscriber) {
    return {
      ok: false as const,
      message:
        "Subscription success email skipped: subscriber not found or already unsubscribed.",
      id: null,
    };
  }

  const dashboardLink = getDashboardLink();
  const settingsLink = getSettingsLink();
  const termsLink = `${env.APP_URL}/terms`;
  const privacyLink = `${env.APP_URL}/privacy`;
  const unsubscribeLink = getUnsubscribeLink(subscriber.id);
  const footer = buildEmailFooter({
    unsubscribeCopy: "To stop billing-related notices,",
    unsubscribeLink,
  });

  const currency: BillingCurrency = (subscriber.billingCurrency as BillingCurrency) ?? "USD";
  const plan = pricingPlanFor(currency);
  const rawInterval = (subscriber as any).billingInterval as "MONTHLY" | "ANNUAL" | null | undefined;
  const billingInterval: "monthly" | "annual" =
    rawInterval === "ANNUAL" ? "annual" : "monthly";
  const planLabel = billingInterval === "annual" ? plan.yearlyLabel : plan.monthlyLabel;
  const frequencyLabel = billingInterval === "annual" ? "Annual (billed once per year)" : "Monthly (billed once per month)";
  const nextRenewal = subscriber.currentPeriodEndsAt;
  const nextRenewalLabel = formatDateYYYYMMDD(nextRenewal);
  const priceAmount =
    billingInterval === "annual" ? plan.yearlyAmount : plan.monthlyAmount;
  const priceLine = `${plan.currencySymbol}${priceAmount.toFixed(2)} ${currency}/${billingInterval === "annual" ? "year" : "month"}`;

  const seniorNames = subscriber.seniors
    .map((s) => `${s.firstName} ${s.lastName}`.trim())
    .filter(Boolean);
  const seniorsCoveredText = seniorNames.length
    ? seniorNames.join(" · ")
    : "See Dashboard";

  const checkInLines = subscriber.seniors.map((s) => {
    return `${pad2(s.checkInHour)}:${pad2(s.checkInMinute)} in ${s.timezone} for ${s.firstName} ${s.lastName}`;
  });
  const checkInTimesText = checkInLines.length
    ? checkInLines.join(" / ")
    : "See Dashboard";

  const uniqueContacts = new Map<string, { fullName: string; relationship: string; phoneNumber: string }>();
  for (const senior of subscriber.seniors) {
    for (const contact of senior.contacts) {
      const key = `${contact.fullName.toLowerCase()}|${contact.phoneNumber}`;
      if (!uniqueContacts.has(key)) {
        uniqueContacts.set(key, {
          fullName: contact.fullName,
          relationship: contact.relationship,
          phoneNumber: contact.phoneNumber,
        });
      }
    }
  }
  const contactRows = Array.from(uniqueContacts.values());
  const contactsText = contactRows.length
    ? contactRows
        .map(
          (c) =>
            `${c.fullName} (${c.relationship}) · ${c.phoneNumber}`,
        )
        .join(" / ")
    : "See Dashboard";

  const statusPaid = opts.statusPaid ?? true;

  const fallbackDashboardReceiptLink = settingsLink;

  let invoiceHtml: string;
  let invoiceText: string;
  if (opts.receiptUrl && statusPaid) {
    const thankHtml = `<p style="margin:0 0 8px 0; font-weight:600; color:#2b2f44;"><strong>Thank you for your payment.</strong></p>`;
    const receiptLinkHtml = `<a href="${opts.receiptUrl}" target="_blank" rel="noopener" style="font-weight:600;">✅ View payment receipt (Stripe, opens in browser)</a>`;
    const note = `This is your official payment receipt from Stripe. It displays your full tax breakdown and Amount paid.`;

    invoiceHtml =
      thankHtml +
      `${receiptLinkHtml}` +
      `<p style="font-size: 12px; opacity: 0.75; margin: 8px 0 0 0;">${note}</p>`;

    invoiceText =
      `Thank you for your payment.\n` +
      `View payment receipt (Stripe, opens in browser): ${opts.receiptUrl}\n` +
      `Note: This is your official payment receipt from Stripe. Displays full tax breakdown and Amount paid.\n`;
  } else if (opts.hostedInvoiceUrl) {
    const thankHtml = `<p style="margin:0 0 8px 0; font-weight:600; color:#2b2f44;"><strong>Thank you for your payment.</strong></p>`;
    const browserLinkHtml = `<a href="${opts.hostedInvoiceUrl}" target="_blank" rel="noopener" style="font-weight:600;">🧾 View receipt (Stripe, opens in browser)</a>`;
    const note = statusPaid
      ? `This Stripe-hosted receipt page shows your PAID status and full tax breakdown.`
      : `We are still confirming your payment with Stripe. This receipt page updates LIVE — in a few seconds it will refresh with the PAID watermark and full amount paid. No need to refresh manually.`;

    invoiceHtml =
      thankHtml +
      `${browserLinkHtml}` +
      `<p style="font-size: 12px; opacity: 0.75; margin: 8px 0 0 0;">${note}</p>`;

    const thankTextLine = `Thank you for your payment.\n`;
    const browserTextLine = `View receipt (opens in browser): ${opts.hostedInvoiceUrl}\n`;
    const noteText = statusPaid
      ? `Note: This Stripe-hosted receipt page shows your PAID status and full tax breakdown.`
      : `Note: We are still confirming your payment with Stripe. The receipt link above updates LIVE — in a few seconds it will refresh with the PAID watermark and full amount paid. No need to refresh manually.`;
    invoiceText = `${thankTextLine}${browserTextLine}${noteText}`;
  } else {
    const thankHtml = `<p style="margin:0 0 8px 0; font-weight:600; color:#2b2f44;"><strong>Thank you for your payment.</strong></p>`;
    const browserLinkHtml = `<a href="${fallbackDashboardReceiptLink}" target="_blank" rel="noopener" style="font-weight:600;">🧾 View receipt & manage subscription in Dashboard</a>`;
    const note =
      `Your payment has been processed successfully. To manage your subscription (upgrade, cancel, change card), visit your Billing settings in WarmHello Dashboard.` +
      (statusPaid ? `` : ` PAID status will update shortly; the Dashboard page always reflects the latest billing state.`);

    invoiceHtml =
      thankHtml +
      `${browserLinkHtml}` +
      `<p style="font-size: 12px; opacity: 0.75; margin: 8px 0 0 0;">${note}</p>`;

    invoiceText =
      `Thank you for your payment.\n` +
      `View receipt & manage subscription in Dashboard: ${fallbackDashboardReceiptLink}\n` +
      `Note: Your payment has been processed successfully. To upgrade / cancel / change your card, visit the Billing settings page above.`;
  }

  const planSummaryLine = `${plan.monthlyLabel} · ${plan.dailyLabel} · billed ${plan.yearlyLabel}`;

  return sendEmail({
    to: subscriber.email,
    subject: "Your Warm-Hello subscription is active",
    replyTo: SALES_EMAIL,
    text: `Hi there,

** Thank you for your payment.** Your Warm-Hello subscription has been successfully activated. Below is a summary of your subscription.

  • Plan:                ${billingInterval === "annual" ? "Annual" : "Monthly"}
  • Price:               ${priceLine} + applicable taxes
  • Currency:            ${currency}
  • Billing frequency:   ${frequencyLabel}
  • Next renewal date:   ${nextRenewalLabel}
  • Seniors covered:     ${seniorsCoveredText}
  • Trusted escalation contacts: ${contactsText}
  • Daily check-in time: ${checkInTimesText}
  • Receipt:             ${invoiceText}

Renews automatically: Yes, unless cancelled before renewal.

Cancellation instructions:
You can cancel auto-renewal at any time from Dashboard → Settings → Subscription. Your subscription remains active until the end of your current paid billing period, and no future renewal charges will be made.

Legal:
  • Terms of Service: ${termsLink}
  • Privacy Policy:   ${privacyLink}

A few important notes:

  1. Check-ins will continue exactly as they were during your trial. No action needed from either you or the senior.
  2. You can change the senior name, phone numbers, trusted escalation contacts, check-in window time, or billing details at any time from your Dashboard:
     ${dashboardLink}
  3. For any questions, reply to this email or write to ${SALES_EMAIL}.

Warmly,
The Warm-Hello Team${footer.text}`,
    html: `<p><img src="${env.APP_URL}/warmhello-logo-b.png" alt="Warm-Hello" width="140" /></p>
<p>Hi there,</p>
<p><strong style="font-size:15px;">Thank you for your payment.</strong> Your Warm-Hello subscription has been <strong>successfully activated</strong>. Below is a summary of your subscription.</p>
<table width="100%" cellpadding="8" cellspacing="0" border="0" style="border-collapse:collapse; border:1px solid #e5e7eb; border-radius:12px;">
  <tr>
    <td width="32%" valign="top" style="background:#f4f7ff; border-bottom:1px solid #e5e7eb; color:#59617a; font-weight:600;">Plan</td>
    <td valign="top" style="border-bottom:1px solid #e5e7eb;">${billingInterval === "annual" ? "Annual" : "Monthly"}</td>
  </tr>
  <tr>
    <td width="32%" valign="top" style="background:#f4f7ff; border-bottom:1px solid #e5e7eb; color:#59617a; font-weight:600;">Price</td>
    <td valign="top" style="border-bottom:1px solid #e5e7eb;">${priceLine} + applicable taxes</td>
  </tr>
  <tr>
    <td width="32%" valign="top" style="background:#f4f7ff; border-bottom:1px solid #e5e7eb; color:#59617a; font-weight:600;">Currency</td>
    <td valign="top" style="border-bottom:1px solid #e5e7eb;">${currency}</td>
  </tr>
  <tr>
    <td width="32%" valign="top" style="background:#f4f7ff; border-bottom:1px solid #e5e7eb; color:#59617a; font-weight:600;">Billing frequency</td>
    <td valign="top" style="border-bottom:1px solid #e5e7eb;">${frequencyLabel}</td>
  </tr>
  <tr>
    <td width="32%" valign="top" style="background:#f4f7ff; border-bottom:1px solid #e5e7eb; color:#59617a; font-weight:600;">Next renewal date</td>
    <td valign="top" style="border-bottom:1px solid #e5e7eb;">${nextRenewalLabel}</td>
  </tr>
  <tr>
    <td width="32%" valign="top" style="background:#f4f7ff; border-bottom:1px solid #e5e7eb; color:#59617a; font-weight:600;">Seniors covered</td>
    <td valign="top" style="border-bottom:1px solid #e5e7eb;">${seniorsCoveredText}</td>
  </tr>
  <tr>
    <td width="32%" valign="top" style="background:#f4f7ff; border-bottom:1px solid #e5e7eb; color:#59617a; font-weight:600;">Trusted escalation contacts</td>
    <td valign="top" style="border-bottom:1px solid #e5e7eb;">${contactsText}</td>
  </tr>
  <tr>
    <td width="32%" valign="top" style="background:#f4f7ff; border-bottom:1px solid #e5e7eb; color:#59617a; font-weight:600;">Daily check-in time</td>
    <td valign="top" style="border-bottom:1px solid #e5e7eb;">${checkInTimesText}</td>
  </tr>
  <tr>
    <td width="32%" valign="top" style="background:#f4f7ff; color:#59617a; font-weight:600;">Receipt</td>
    <td valign="top;">${invoiceHtml}</td>
  </tr>
</table>
<p style="margin-top:16px; font-weight:600; color:#2b2f44;">Renews automatically: Yes, unless cancelled before renewal.</p>
<p style="margin-top:6px;"><strong>Cancellation instructions:</strong><br />You can cancel auto-renewal at any time from <a href="${settingsLink}">Dashboard &rarr; Settings &rarr; Subscription</a>. Your subscription remains active until the end of your current paid billing period, and no future renewal charges will be made.</p>
<p style="margin-top:10px;"><strong>Legal:</strong><br />
  &bull; Terms of Service: <a href="${termsLink}">${termsLink}</a><br />
  &bull; Privacy Policy: <a href="${privacyLink}">${privacyLink}</a>
</p>
<p style="margin-top:24px;"><strong>A few important notes:</strong></p>
<p>
  1. Check-ins will continue exactly as they were during your trial. No action needed from either you or the senior.<br />
  2. You can change the senior name, phone numbers, trusted escalation contacts, check-in window time, or billing details at any time from your <a href="${dashboardLink}">Dashboard</a>.<br />
  3. For any questions, reply to this email or write to <a href="mailto:${SALES_EMAIL}">${SALES_EMAIL}</a>.
</p>
<p>Warmly,<br />The Warm-Hello Team</p>
${footer.html}`,
  });
}

export async function sendAnnualRenewalReminderEmail(subscriberId: string) {
  const subscriber = await getSubscriberForEmail(subscriberId);
  if (!subscriber) {
    return {
      ok: false as const,
      message:
        "Annual renewal reminder skipped: subscriber not found or has unsubscribed from trial/non-essential emails.",
      id: null,
    };
  }

  if (
    subscriber.subscriptionStatus !== "ACTIVE" &&
    subscriber.subscriptionStatus !== "CANCELED" &&
    subscriber.subscriptionStatus !== "PAST_DUE"
  ) {
    return {
      ok: false as const,
      message: `Annual renewal reminder skipped. Subscriber status=${subscriber.subscriptionStatus}.`,
      id: null,
    };
  }

  if (!subscriber.currentPeriodEndsAt) {
    return {
      ok: false as const,
      message: "Annual renewal reminder skipped: no currentPeriodEndsAt set on subscriber.",
      id: null,
    };
  }

  const renewalDate = subscriber.currentPeriodEndsAt;
  const currency = subscriber.billingCurrency as BillingCurrency;
  const plan = pricingPlanFor(currency);
  const settingsLink = getSettingsLink();
  const unsubscribeLink = getUnsubscribeLink(subscriber.id);
  const footer = buildEmailFooter({
    unsubscribeCopy: "To stop receiving these billing reminders,",
    unsubscribeLink,
  });
  const renewalLabel = formatDateYYYYMMDD(renewalDate);

  return sendEmail({
    to: subscriber.email,
    replyTo: SALES_EMAIL,
    subject: `Your Warm-Hello annual subscription renews ${renewalLabel}`,
    text: `Hi there,

This is a friendly reminder that your Warm-Hello annual subscription will renew on ${renewalLabel}. You are receiving this email because auto-renewal is currently enabled on your account.

On the renewal date you will be charged ${plan.yearlyLabel} (taxes may apply), and your check-ins will continue uninterrupted for another 12 months.

If you'd like to review or cancel:
${settingsLink}

Cancelling is a single click from Dashboard → Settings → Subscription. No phone calls, no emails, no cancellation fees — and your coverage continues until the end of the term you've already paid for.

If you have any questions about your renewal, reply to this email or write to ${SALES_EMAIL}.

Warmly,
The Warm-Hello Team${footer.text}`,
    html: `<p><img src="${env.APP_URL}/warmhello-logo-b.png" alt="Warm-Hello" width="140" /></p>
<p>Hi there,</p>
<p>This is a friendly reminder that your Warm-Hello annual subscription will renew on <strong>${renewalLabel}</strong>. You are receiving this email because auto-renewal is currently enabled on your account.</p>
<p>On the renewal date you will be charged <strong>${plan.yearlyLabel}</strong> (taxes may apply), and your check-ins will continue uninterrupted for another 12 months.</p>
<p>If you&rsquo;d like to review or cancel, visit <a href="${settingsLink}">Dashboard &rarr; Settings</a>.</p>
<p>Cancelling is a single click from Dashboard &rarr; Settings &rarr; Subscription. No phone calls, no emails, no cancellation fees &mdash; and your coverage continues until the end of the term you&rsquo;ve already paid for.</p>
<p>If you have any questions about your renewal, reply to this email or write to <a href="mailto:${SALES_EMAIL}">${SALES_EMAIL}</a>.</p>
<p>Warmly,<br />The Warm-Hello Team</p>
${footer.html}`,
  });
}

export async function sendSubscriptionCancelledAtPeriodEndEmail(subscriberId: string) {
  const subscriber = await getSubscriberForEmail(subscriberId);
  if (!subscriber) {
    return {
      ok: false as const,
      message:
        "Subscription cancellation confirmation skipped: subscriber not found or already unsubscribed.",
      id: null,
    };
  }

  const dashboardLink = getDashboardLink();
  const settingsLink = getSettingsLink();
  const unsubscribeLink = getUnsubscribeLink(subscriber.id);
  const footer = buildEmailFooter({
    unsubscribeCopy: "To stop billing-related notices,",
    unsubscribeLink,
  });

  const periodEndsLabel = formatDateYYYYMMDD(subscriber.currentPeriodEndsAt);

  return sendEmail({
    to: subscriber.email,
    replyTo: SALES_EMAIL,
    subject: "Auto-renewal is now OFF on your Warm-Hello subscription",
    text: `Hi there,

This is a confirmation that we've turned OFF auto-renewal on your Warm-Hello subscription.

Your subscription will remain active until the end of your current paid billing period on ${periodEndsLabel}. During this time, check-ins and trusted escalation notifications continue uninterrupted. No future renewal charges will be made.

If you'd like to reactivate auto-renewal at any time before ${periodEndsLabel}, visit:
${settingsLink}

Questions? Reply to this email or write to ${SALES_EMAIL}.

Warmly,
The Warm-Hello Team${footer.text}`,
    html: `<p><img src="${env.APP_URL}/warmhello-logo-b.png" alt="Warm-Hello" width="140" /></p>
<p>Hi there,</p>
<p>This is a confirmation that we&rsquo;ve turned <strong>OFF auto-renewal</strong> on your Warm-Hello subscription.</p>
<p>Your subscription will remain active until the end of your current paid billing period on <strong>${periodEndsLabel}</strong>. During this time, check-ins and trusted escalation notifications continue uninterrupted. No future renewal charges will be made.</p>
<p>If you&rsquo;d like to reactivate auto-renewal at any time before ${periodEndsLabel}, visit <a href="${settingsLink}">Dashboard &rarr; Settings &rarr; Subscription</a>.</p>
<p>Questions? Reply to this email or write to <a href="mailto:${SALES_EMAIL}">${SALES_EMAIL}</a>.</p>
<p>Warmly,<br />The Warm-Hello Team</p>
${footer.html}`,
  });
}

export async function sendTrialEndingSoonEmail(subscriberId: string) {
  const subscriber = await getTrialSubscriber(subscriberId);
  if (!subscriber) {
    return {
      ok: false as const,
      message:
        "Trial-ending-soon email skipped: subscriber not found, not in TRIAL status, or already unsubscribed.",
      id: null,
    };
  }

  const buyNowLink = getBuyNowLink(subscriber.id);
  const dashboardLink = getDashboardLink();
  const unsubscribeLink = getUnsubscribeLink(subscriber.id);
  const footer = buildEmailFooter({
    unsubscribeCopy: "To stop trial emails,",
    unsubscribeLink,
  });

  const currency: BillingCurrency = (subscriber.billingCurrency as BillingCurrency) ?? "USD";
  const plan = pricingPlanFor(currency);
  const trialEndsLabel = formatDateYYYYMMDD(subscriber.currentPeriodEndsAt);

  return sendEmail({
    to: subscriber.email,
    replyTo: SALES_EMAIL,
    subject: "Your Warm-Hello free trial is ending soon",
    text: `Hi there,

Your 7-day free trial of Warm-Hello is ending on ${trialEndsLabel}.

Your 7-day free trial does not automatically convert to a paid subscription. No charge will be made when your trial ends.

If you'd like to continue using Warm-Hello, select a paid subscription:
- Monthly: ${plan.monthlyLabel}
- Annual: ${plan.yearlyLabel}

Choose your plan here:
${buyNowLink}

You can also review your account and check-in settings any time from your Dashboard:
${dashboardLink}

If you don't choose a plan, no charge will be made and check-ins will stop after ${trialEndsLabel} until you subscribe.

Questions? Reply to this email or write to ${SALES_EMAIL}.

Warmly,
The Warm-Hello Team${footer.text}`,
    html: `<p><img src="${env.APP_URL}/warmhello-logo-b.png" alt="Warm-Hello" width="140" /></p>
<p>Hi there,</p>
<p>Your 7-day free trial of Warm-Hello is ending on <strong>${trialEndsLabel}</strong>.</p>
<blockquote style="border-left:4px solid #ffd666; margin:16px 0; padding:10px 14px; background:rgba(255,214,102,0.08); border-radius:8px;">
  <p style="margin:0;"><strong>Important:</strong> Your 7-day free trial does <strong>not</strong> automatically convert to a paid subscription. No charge will be made when your trial ends.</p>
</blockquote>
<p>If you&rsquo;d like to continue using Warm-Hello, select a paid subscription:</p>
<ul style="margin:0 0 12px 20px; padding:0; line-height:1.7;">
  <li><strong>Monthly:</strong> ${plan.monthlyLabel}</li>
  <li><strong>Annual:</strong> ${plan.yearlyLabel}</li>
</ul>
<p><a href="${buyNowLink}" style="font-weight:600;">Choose your plan and continue using Warm-Hello &rarr;</a></p>
<p>You can also review your account and check-in settings any time from your <a href="${dashboardLink}">Dashboard</a>.</p>
<p>If you don&rsquo;t choose a plan, no charge will be made and check-ins will stop after ${trialEndsLabel} until you subscribe.</p>
<p>Questions? Reply to this email or write to <a href="mailto:${SALES_EMAIL}">${SALES_EMAIL}</a>.</p>
<p>Warmly,<br />The Warm-Hello Team</p>
${footer.html}`,
  });
}

export async function sendEscalationAlertEmail(options: {
  subscriberId: string;
  subscriberEmail: string;
  seniorFirstName: string;
  seniorLastName: string;
  scheduledForIso: string;
  checkInToken: string;
}) {
  const dashboardLink = getDashboardLink();
  const checkInLink = `${env.APP_URL}/checkin/${options.checkInToken}`;
  const unsubscribeLink = getUnsubscribeLink(options.subscriberId);
  const footer = buildEmailFooter({
    unsubscribeCopy: "To stop escalation alert emails,",
    unsubscribeLink,
  });

  const scheduled = new Date(options.scheduledForIso);
  const dateLabel = scheduled.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeLabel = scheduled.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  const seniorFullName = `${options.seniorFirstName} ${options.seniorLastName}`.trim();

  return sendEmail({
    to: options.subscriberEmail,
    replyTo: SALES_EMAIL,
    subject: `Escalation: ${seniorFullName} has not responded to today's check-in`,
    text: `Hi there,

This is an automated escalation alert from Warm-Hello.

${seniorFullName} has NOT responded to today's daily check-in, which was scheduled for ${dateLabel} at ${timeLabel}. We sent the initial SMS check-in and one friendly follow-up, and after two unanswered attempts we have now alerted the trusted escalation contacts you configured by SMS.

What you can do right now:

  • Call ${seniorFullName} directly to check in by phone
  • Review the check-in status and take action from your Dashboard:
    ${dashboardLink}
  • Open the check-in directly (useful if you want to mark it resolved):
    ${checkInLink}

If this was a false alarm (the senior was busy, outside, or napping and will reply shortly), no action is needed — everything is logged in your 7-day timeline for your records.

If you are no longer the caregiver for this senior, please update your household contacts or remove this senior from Dashboard → Settings → Edit Household.

Warmly,
The Warm-Hello Team${footer.text}`,
    html: `<p><img src="${env.APP_URL}/warmhello-logo-b.png" alt="Warm-Hello" width="140" /></p>
<p>Hi there,</p>
<p style="margin:18px 0 6px;"><strong style="font-size:15px; color:#991b1b;">⚠ Escalation alert</strong></p>
<p style="margin:0 0 10px;">${seniorFullName} has <strong>not responded</strong> to today's daily check-in, scheduled for <strong>${dateLabel} at ${timeLabel}</strong>. We sent the initial SMS and one friendly follow-up; after two unanswered attempts we have now alerted the trusted escalation contacts you configured by SMS.</p>
<p><strong>What you can do right now:</strong></p>
<ul style="margin:0 0 8px 20px; padding:0; line-height:1.7;">
  <li>Call ${seniorFullName} directly to check in by phone</li>
  <li>Review the check-in status and take action from your <a href="${dashboardLink}">Dashboard</a></li>
  <li>Open the <a href="${checkInLink}">check-in page directly</a> if you need to mark it resolved</li>
</ul>
<p style="color:#59617a;">If this was a false alarm (the senior was busy, outside, or napping and will reply shortly), no action is needed. The full escalation and outcome are saved in your 7-day timeline for your records.</p>
<p style="color:#59617a;">If you are no longer the caregiver for this senior, please update your household contacts or remove this senior from Dashboard &rarr; Settings &rarr; Edit Household.</p>
<p>Warmly,<br />The Warm-Hello Team</p>
${footer.html}`,
  });
}

export async function sendInvoicePaymentFailedEmail(options: {
  subscriberId: string;
  subscriberEmail: string;
  amountDue: number;
  currency: string;
  dueDateLabel?: string;
  attemptCount: number;
}) {
  const settingsLink = getSettingsLink();
  const dashboardLink = getDashboardLink();
  const unsubscribeLink = getUnsubscribeLink(options.subscriberId);
  const footer = buildEmailFooter({
    unsubscribeCopy: "To stop billing notification emails,",
    unsubscribeLink,
  });

  const currencyUp = (options.currency ?? "USD").toUpperCase();
  const symbol = currencyUp === "CAD" ? "CA$" : "$";
  const amountFormatted = `${symbol}${options.amountDue.toFixed(2)} ${currencyUp}`;
  const due = options.dueDateLabel ?? "the scheduled date";
  const attempts = Math.max(1, options.attemptCount);

  return sendEmail({
    to: options.subscriberEmail,
    replyTo: SALES_EMAIL,
    subject: `Action needed: payment did not go through (${amountFormatted})`,
    text: `Hi there,

This is an automated message from Warm-Hello.

We were unable to process the payment of ${amountFormatted} due ${due} for your Warm-Hello subscription. This is attempt ${attempts}.

How to resolve this right now:
  • Visit your Dashboard Billing settings to update your payment method:
    ${settingsLink}
  • Or review the charge with your card issuer / bank to make sure there are no blocks on the card.

Service remains accessible for a short grace period. If payment cannot be collected, access may be restricted and your subscription eventually cancelled. You can review subscription status at any time:
  ${dashboardLink}

Warm-Hello is a routine check-in and notification service only. It does not contact 911 or emergency services. Subscriptions automatically renew unless cancelled before the next renewal date. See the full Terms of Service and Privacy Policy on the website for the cancellation and refund policy that apply.

Warmly,
The Warm-Hello Team${footer.text}`,
    html: `<p><img src="${env.APP_URL}/warmhello-logo-b.png" alt="Warm-Hello" width="140" /></p>
<p>Hi there,</p>
<p style="margin:18px 0 6px;"><strong style="font-size:15px; color:#92400e;">⚠ Payment not processed</strong></p>
<p style="margin:0 0 10px;">We were unable to process the payment of <strong>${amountFormatted}</strong> due ${due} for your Warm-Hello subscription. This is the ${attempts}. billing attempt.</p>
<p><strong>How to resolve this right now:</strong></p>
<ul style="margin:0 0 8px 20px; padding:0; line-height:1.7;">
  <li>Update your payment method in <a href="${settingsLink}">Billing settings</a></li>
  <li>Contact your card issuer or bank and confirm there are no blocks or holds on the card</li>
</ul>
<p style="color:#59617a;">Service remains accessible during a short grace period. If payment cannot be collected, access may be restricted and your subscription may eventually be cancelled. You can review your subscription status at any time from your <a href="${dashboardLink}">Dashboard</a>.</p>
<p style="color:#59617a;">Warm-Hello is a routine check-in and notification service. It does not contact 911 or emergency services. Subscriptions automatically renew unless cancelled before the next renewal date. See the full Terms and Privacy Policy on the website for the cancellation and refund policy that apply.</p>
<p>Warmly,<br />The Warm-Hello Team</p>
${footer.html}`,
  });
}

export async function sendAccountDeletionConfirmationEmail(options: {
  subscriberEmail: string;
  subscriberFullName?: string | null;
  effectiveDateLabel: string;
}) {
  const to = options.subscriberEmail;
  const nameLine = options.subscriberFullName
    ? `${options.subscriberFullName}`
    : "";
  const footer = buildEmailFooter({
    unsubscribeCopy:
      "(this email confirms account deletion; no further emails will be delivered to this address after this notice; if this was not you contact us at",
    unsubscribeLink: `mailto:${SALES_EMAIL}`,
  });

  return sendEmail({
    to,
    replyTo: SALES_EMAIL,
    subject: `Warm-Hello account deletion confirmed`,
    text: `Hi ${nameLine ? `${nameLine}\n\n` : `there,\n\n`}This email confirms that the Warm-Hello account associated with ${to} has been deleted, effective ${options.effectiveDateLabel}.

Household data, check-in history, designated trusted escalation contacts, and related operational check-in records have been removed or anonymized per the data retention policy.

Important notes:
  • Recurring subscription billing has been cancelled and no future renewal charges will be made.
  • Certain records may be retained per applicable law for transaction, tax, security, fraud-prevention, and legal record-keeping purposes for the legally required period.
  • Access to the Warm-Hello dashboard for this account has been permanently closed.

Privacy requests or concerns can be directed to ${SALES_EMAIL} with a 30-day response window as described in the Privacy Policy.

Warm-Hello is a routine check-in notification service only. It does not provide medical monitoring or emergency dispatch services and does not contact 911 or emergency services.

Warmly,
The Warm-Hello Team${footer.text}`,
    html: `<p><img src="${env.APP_URL}/warmhello-logo-b.png" alt="Warm-Hello" width="140" /></p>
<p>Hi ${nameLine ? `${nameLine},` : `there,`}</p>
<p style="margin:18px 0 6px;"><strong style="font-size:15px; color:#111827;">✅ Account deletion confirmed</strong></p>
<p style="margin:0 0 10px;">This email confirms that the Warm-Hello account associated with <strong>${to}</strong> has been deleted, effective <strong>${options.effectiveDateLabel}</strong>.</p>
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
${footer.html}`,
  });
}

export async function sendSmsOptOutConfirmationEmail(options: {
  subscriberId: string;
  subscriberEmail: string;
  seniorFullName: string;
  seniorPhoneLast4: string;
  optedOutAtLabel: string;
}) {
  const settingsLink = getSettingsLink();
  const unsubscribeLink = getUnsubscribeLink(options.subscriberId);
  const footer = buildEmailFooter({
    unsubscribeCopy: "To stop SMS compliance notification emails,",
    unsubscribeLink,
  });

  return sendEmail({
    to: options.subscriberEmail,
    replyTo: SALES_EMAIL,
    subject: `SMS opt-out recorded for ${options.seniorFullName}`,
    text: `Hi there,

This is an automated compliance confirmation from Warm-Hello.

A STOP (opt-out) keyword reply was received from the phone number ending in ${options.seniorPhoneLast4} associated with ${options.seniorFullName} at ${options.optedOutAtLabel}.

What this means right now:
  • No further Warm-Hello operational SMS check-in messages or SMS escalation alerts will be sent to this number going forward.
  • Account emails (including billing and account notifications) are still delivered to the account owner email unless you unsubscribe via the link below.
  • If this was a mistake or the senior wants to re-enable SMS, anyone may reply START from the opted-out phone to opt back in.

Manage household and phone number configuration from your Dashboard Settings:
  ${settingsLink}

Warm-Hello is a routine check-in notification service only. It does not contact 911 or emergency services, and it does not offer medical or health monitoring. Trusted escalation contacts you designate receive escalations only according to the configuration you set.

Warmly,
The Warm-Hello Team${footer.text}`,
    html: `<p><img src="${env.APP_URL}/warmhello-logo-b.png" alt="Warm-Hello" width="140" /></p>
<p>Hi there,</p>
<p style="margin:18px 0 6px;"><strong style="font-size:15px; color:#7c2d12;">📵 SMS opt-out recorded</strong></p>
<p style="margin:0 0 10px;">A <strong>STOP (opt-out)</strong> keyword reply was received from the phone number ending in <strong>${options.seniorPhoneLast4}</strong> associated with <strong>${options.seniorFullName}</strong> at <strong>${options.optedOutAtLabel}</strong>.</p>
<p><strong>What this means right now:</strong></p>
<ul style="margin:0 0 8px 20px; padding:0; line-height:1.7;">
  <li>No further Warm-Hello operational SMS check-in messages or SMS escalation alerts will be sent to this number going forward.</li>
  <li>Account emails (including billing and account notifications) are still delivered to the account owner email unless you unsubscribe via the link below.</li>
  <li>If this was a mistake or you need to re-enable SMS for this senior, anyone may reply <strong>START</strong> from the phone that opted out to re-enable eligible SMS communications.</li>
</ul>
<p style="color:#59617a;">You can manage household and phone numbers from your <a href="${settingsLink}">Dashboard Settings</a>.</p>
<p style="color:#59617a;">Warm-Hello is a routine check-in and notification service only. It does not contact 911 or emergency services, and it does not offer medical or health monitoring. Trusted escalation contacts you designate receive escalations only according to the configuration you set.</p>
<p>Warmly,<br />The Warm-Hello Team</p>
${footer.html}`,
  });
}

export async function sendSmsOptInReenabledEmail(options: {
  subscriberId: string;
  subscriberEmail: string;
  seniorFullName: string;
  seniorPhoneLast4: string;
  optedInAtLabel: string;
}) {
  const settingsLink = getSettingsLink();
  const unsubscribeLink = getUnsubscribeLink(options.subscriberId);
  const footer = buildEmailFooter({
    unsubscribeCopy: "To stop account compliance notification emails,",
    unsubscribeLink,
  });

  return sendEmail({
    to: options.subscriberEmail,
    replyTo: SALES_EMAIL,
    subject: `SMS re-enabled for ${options.seniorFullName}`,
    text: `Hi there,

This is an automated compliance confirmation from Warm-Hello.

A START (opt-in) keyword was received from the phone number ending in ${options.seniorPhoneLast4} associated with ${options.seniorFullName} at ${options.optedInAtLabel}.

What this means right now:
  • Warm-Hello operational SMS check-in messages will resume to this number according to your configured schedule.
  • Standard carrier message and data rates may apply.
  • Anyone texting from this phone may reply STOP at any time to opt out again, or HELP for assistance info.

Manage your household and settings from the Dashboard Settings:
  ${settingsLink}

Warm-Hello is a routine check-in and notification service. It does not contact 911 or emergency services and does not perform medical or health monitoring. Paid subscriptions automatically renew unless cancelled before the next renewal date per the Terms of Service.

Warmly,
The Warm-Hello Team${footer.text}`,
    html: `<p><img src="${env.APP_URL}/warmhello-logo-b.png" alt="Warm-Hello" width="140" /></p>
<p>Hi there,</p>
<p style="margin:18px 0 6px;"><strong style="font-size:15px; color:#065f46;">✅ SMS communications re-enabled</strong></p>
<p style="margin:0 0 10px;">A <strong>START (opt-in)</strong> keyword was received from the phone number ending in <strong>${options.seniorPhoneLast4}</strong> associated with <strong>${options.seniorFullName}</strong> at <strong>${options.optedInAtLabel}</strong>.</p>
<p><strong>What this means right now:</strong></p>
<ul style="margin:0 0 8px 20px; padding:0; line-height:1.7;">
  <li>Warm-Hello operational SMS check-in messages will resume to this number according to your configured schedule.</li>
  <li>Standard carrier message and data rates may apply.</li>
  <li>Anyone texting from this phone may reply <strong>STOP</strong> at any time to opt out again, or <strong>HELP</strong> for assistance info.</li>
</ul>
<p style="color:#59617a;">Manage your household and settings from your <a href="${settingsLink}">Dashboard Settings</a>.</p>
<p style="color:#59617a;">Warm-Hello is a routine check-in and notification service. It does not contact 911 or emergency services and does not perform medical or health monitoring. Paid subscriptions automatically renew unless cancelled before the next renewal date per the Terms of Service.</p>
<p>Warmly,<br />The Warm-Hello Team</p>
${footer.html}`,
  });
}

export async function sendMagicLoginLinkEmail(options: {
  toEmail: string;
  subscriberFullName: string | null;
  subscriberId: string;
  magicLink: string;
  expiresAtLabel: string;
  ipAddress: string | null;
}) {
  const unsubscribeLink = getUnsubscribeLink(options.subscriberId);
  const footer = buildEmailFooter({
    unsubscribeCopy: "To stop account access notification emails,",
    unsubscribeLink,
  });
  const nameGreeting = options.subscriberFullName ? options.subscriberFullName : "there";

  return sendEmail({
    to: options.toEmail,
    replyTo: SALES_EMAIL,
    subject: "Your Warm-Hello log-in link",
    text: `Hi ${nameGreeting},

We received a request to log in to your Warm-Hello account.

If you requested this, click the link below to log in securely. This link expires ${options.expiresAtLabel} and can only be used once.

${options.magicLink}

If you did NOT request this log-in link, you can safely ignore this email. Your account remains secure.

Request details:
  Account email: ${options.toEmail}${options.ipAddress ? `\n  Approximate IP: ${options.ipAddress}` : ""}

Warm-Hello is a routine check-in notification service. It does not contact 911 or emergency services and does not offer medical or health monitoring.

Warmly,
The Warm-Hello Team${footer.text}`,
    html: `<p><img src="${env.APP_URL}/warmhello-logo-b.png" alt="Warm-Hello" width="140" /></p>
<p>Hi ${nameGreeting},</p>
<p>We received a request to log in to your Warm-Hello account.</p>
<p>If you requested this, click the big button below to log in securely. This link expires <strong>${options.expiresAtLabel}</strong> and can only be used once.</p>
<p style="text-align:center; margin: 22px 0 8px;">
  <a href="${options.magicLink}" style="display:inline-block; background: linear-gradient(180deg, #0f766e, #065f46); color: #f8fafc; font-weight: 600; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-size: 16px; box-shadow: 0 6px 16px -10px rgba(6, 95, 70, 0.8);">Log in to Warm-Hello</a>
</p>
<p style="text-align:center; color: #59617a; font-size: 13px; word-break: break-all; margin: 4px 0 18px;">
  <a href="${options.magicLink}" style="color: #59617a; text-decoration: underline;">${options.magicLink}</a>
</p>
<p style="border-left:4px solid #fb923c; margin:14px 0; padding:10px 14px; background:rgba(251,146,60,0.08); border-radius:8px;">
  <strong style="color:#7c2d12;">Not you?</strong> If you did <strong>NOT</strong> request this log-in link, you can safely ignore this email. No action is needed and your account remains secure.
</p>
<p style="font-size: 13px; color: #59617a;">
  <strong>Request details:</strong><br />
  Account email: <code style="background: #f1f5f9; padding: 2px 6px; border-radius: 6px;">${options.toEmail}</code>${options.ipAddress ? `<br />Approximate IP: <code style="background:#f1f5f9; padding: 2px 6px; border-radius:6px;">${options.ipAddress}</code>` : ""}
</p>
<p style="color:#59617a;">Warm-Hello is a routine check-in and notification service only. It does not contact 911 or emergency services, and it does not offer medical or health monitoring.</p>
<p>Warmly,<br />The Warm-Hello Team</p>
${footer.html}`,
  });
}
