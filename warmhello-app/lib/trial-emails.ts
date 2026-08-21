import { prisma } from "@/lib/prisma";
import type Stripe from "stripe";
import { sendEmail } from "@/lib/email";
import { env } from "@/lib/env";
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
  return {
    html: `<p>Questions or need help? Email <a href="mailto:${SALES_EMAIL}">${SALES_EMAIL}</a>.</p><p style="font-size: 12px; opacity: 0.8;">${options.unsubscribeCopy} <a href="${options.unsubscribeLink}">unsubscribe</a>.</p>`,
    text: `\nQuestions or need help? Email ${SALES_EMAIL}.\n\n${options.unsubscribeCopy}: ${options.unsubscribeLink}`,
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

  return sendEmail({
    to: subscriber.email,
    subject: "Welcome to Warm-Hello - Peace of mind starts today",
    replyTo: SALES_EMAIL,
    text: `Hi there,

Thank you for choosing Warm-Hello to help stay connected with your loved one. We know that balancing their independence with your need for peace of mind can be difficult, and we're here to make that rhythm effortless.

Getting started is simple:
If you haven't already, please finish setting up your account and schedule your preferred morning check-in time via your Dashboard:
${dashboardLink}

Remember, there's nothing for your loved one to download or learn. They'll receive a gentle, friendly text each morning with a secure link. A single tap on the big "I'm OK" button is all it takes to keep you in the loop.

We're here to help you get settled. If you have any questions, just hit reply to this email.

Warmly,
The Warm-Hello Team${footer.text}`,
    html: `<p><img src="${env.APP_URL}/warmhello-logo-b.png" alt="Warm-Hello" width="140" /></p>
<p>Hi there,</p>
<p>Thank you for choosing Warm-Hello to help stay connected with your loved one. We know that balancing their independence with your need for peace of mind can be difficult, and we're here to make that rhythm effortless.</p>
<p><strong>Getting started is simple:</strong><br />If you haven't already, please finish setting up your account and schedule your preferred morning check-in time via your <a href="${dashboardLink}">Dashboard</a>.</p>
<p>Remember, there's nothing for your loved one to download or learn. They'll receive a gentle, friendly text each morning with a secure link. A single tap on the big "I'm OK" button is all it takes to keep you in the loop.</p>
<p>We're here to help you get settled. If you have any questions, just hit reply to this email.</p>
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

  return sendEmail({
    to: subscriber.email,
    subject: "How is your first week going?",
    replyTo: SALES_EMAIL,
    text: `Hi there,

We hope the first few days of using Warm-Hello have brought a little more calm to your mornings.

We designed Warm-Hello to be completely frictionless-a quick "check-in" that feels more like a morning wave than a medical alert. How is it working for you and your loved one so far?

If you're ready to secure this peace of mind for the long term, you can upgrade your account at any time to ensure there's no interruption to your check-ins after your trial ends.

Secure your account for $6/month:
${buyNowLink}

We are always looking to improve. If you have any feedback on your experience so far, we'd love to hear it!

Best,
The Warm-Hello Team${footer.text}`,
    html: `<p><img src="${env.APP_URL}/warmhello-logo-b.png" alt="Warm-Hello" width="140" /></p>
<p>Hi there,</p>
<p>We hope the first few days of using Warm-Hello have brought a little more calm to your mornings.</p>
<p>We designed Warm-Hello to be completely frictionless-a quick "check-in" that feels more like a morning wave than a medical alert. How is it working for you and your loved one so far?</p>
<p>If you're ready to secure this peace of mind for the long term, you can upgrade your account at any time to ensure there's no interruption to your check-ins after your trial ends.</p>
<p><a href="${buyNowLink}">Secure your account for $6/month</a></p>
<p>We are always looking to improve. If you have any feedback on your experience so far, we'd love to hear it!</p>
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
  const unsubscribeLink = getUnsubscribeLink(subscriber.id);
  const footer = buildEmailFooter({
    unsubscribeCopy: "To stop trial emails,",
    unsubscribeLink,
  });

  return sendEmail({
    to: subscriber.email,
    subject: "Your trial has ended - stay connected with Warm-Hello",
    replyTo: SALES_EMAIL,
    text: `Hi there,

Your 7-day free trial of Warm-Hello has concluded. We hope that over the past week, you've experienced how much easier it is to stay connected without having to be "the person who checks in" every single morning.

We would love to continue helping you protect that sense of peace for your family. If you'd like to keep the automated check-ins running, you can officially activate your subscription today for just $6 a month.

Activate your Warm-Hello subscription here:
${buyNowLink}

Thank you for trusting us to help you bridge the gap between respect for their independence and your own peace of mind.

Warmly,
The Warm-Hello Team${footer.text}`,
    html: `<p><img src="${env.APP_URL}/warmhello-logo-b.png" alt="Warm-Hello" width="140" /></p>
<p>Hi there,</p>
<p>Your 7-day free trial of Warm-Hello has concluded. We hope that over the past week, you've experienced how much easier it is to stay connected without having to be "the person who checks in" every single morning.</p>
<p>We would love to continue helping you protect that sense of peace for your family. If you'd like to keep the automated check-ins running, you can officially activate your subscription today for just $6 a month.</p>
<p><a href="${buyNowLink}">Activate your Warm-Hello subscription here</a></p>
<p>Thank you for trusting us to help you bridge the gap between respect for their independence and your own peace of mind.</p>
<p>Warmly,<br />The Warm-Hello Team</p>
${footer.html}`,
  });
}

export async function sendThankYouForSubscriptionEmail(subscriberId: string) {
  const subscriber = await getSubscriberForEmail(subscriberId);
  if (!subscriber) {
    return {
      ok: false as const,
      message: "Thank-you email skipped: subscriber not found or already unsubscribed.",
      id: null,
    };
  }

  const dashboardLink = getDashboardLink();
  const unsubscribeLink = getUnsubscribeLink(subscriber.id);
  const footer = buildEmailFooter({
    unsubscribeCopy: "To stop future emails,",
    unsubscribeLink,
  });

  return sendEmail({
    to: subscriber.email,
    subject: "Thank you for trying Warm-Hello",
    replyTo: SALES_EMAIL,
    text: `Hi there,

Thank you for giving Warm-Hello a try.

We've canceled your auto-renewal and your subscription will stay active through the end of your current billing cycle. If you'd like to continue protecting your family's peace of mind with Warm-Hello, you can reactivate anytime from your Dashboard:
${dashboardLink}

If there's anything we could have done better or if you have any questions, simply reply to this email and we'll be happy to help.

Warmly,
The Warm-Hello Team${footer.text}`,
    html: `<p><img src="${env.APP_URL}/warmhello-logo-b.png" alt="Warm-Hello" width="140" /></p>
<p>Hi there,</p>
<p>Thank you for giving Warm-Hello a try.</p>
<p>We've canceled your auto-renewal and your subscription will stay active through the end of your current billing cycle. If you'd like to continue protecting your family's peace of mind with Warm-Hello, you can reactivate anytime from your <a href="${dashboardLink}">Dashboard</a>.</p>
<p>If there's anything we could have done better or if you have any questions, simply reply to this email and we'll be happy to help.</p>
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
  const unsubscribeLink = getUnsubscribeLink(subscriber.id);
  const footer = buildEmailFooter({
    unsubscribeCopy: "To stop billing-related notices,",
    unsubscribeLink,
  });

  const currency: BillingCurrency = subscriber.billingCurrency ?? "USD";
  const plan = pricingPlanFor(currency);

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

  const nextBilling = formatDateYYYYMMDD(subscriber.currentPeriodEndsAt);

  const statusPaid = opts.statusPaid ?? true;

  const fallbackDashboardReceiptLink = settingsLink;

  let invoiceHtml: string;
  let invoiceText: string;
  if (opts.receiptUrl && statusPaid) {
    const thankHtml = `<p style="margin:0 0 8px 0; font-weight:600; color:#2b2f44;">Thank you for your payment.</p>`;
    const receiptLinkHtml = `<a href="${opts.receiptUrl}" target="_blank" rel="noopener" style="font-weight:600;">✅ View payment receipt (Stripe, opens in browser)</a>`;
    const note = `This is your official payment receipt from Stripe. It is ALWAYS shown as PAID and never includes a "Pay online" link. It displays your full HST / tax breakdown and Amount paid.`;

    invoiceHtml =
      thankHtml +
      `${receiptLinkHtml}` +
      `<p style="font-size: 12px; opacity: 0.75; margin: 8px 0 0 0;">${note}</p>`;

    invoiceText =
      `Thank you for your payment.\n` +
      `View payment receipt (always PAID — no Pay online link): ${opts.receiptUrl}\n` +
      `Note: This is your official payment receipt from Stripe. Displays full HST/tax breakdown and Amount paid.\n`;
  } else if (opts.hostedInvoiceUrl) {
    const thankHtml = `<p style="margin:0 0 8px 0; font-weight:600; color:#2b2f44;">Thank you for your payment.</p>`;
    const browserLinkHtml = `<a href="${opts.hostedInvoiceUrl}" target="_blank" rel="noopener" style="font-weight:600;">🧾 View receipt (Stripe, opens in browser)</a>`;
    const note = statusPaid
      ? `This Stripe-hosted receipt page shows your PAID status, full HST / tax breakdown.`
      : `We are still confirming your payment with Stripe. This receipt page updates LIVE — in a few seconds it will refresh with the PAID watermark and full amount paid. No need to refresh manually.`;

    invoiceHtml =
      thankHtml +
      `${browserLinkHtml}` +
      `<p style="font-size: 12px; opacity: 0.75; margin: 8px 0 0 0;">${note}</p>`;

    const thankTextLine = `Thank you for your payment.\n`;
    const browserTextLine = `View receipt (opens in browser): ${opts.hostedInvoiceUrl}\n`;
    const noteText = statusPaid
      ? `Note: This Stripe-hosted receipt page shows your PAID status, full HST/tax breakdown.`
      : `Note: We are still confirming your payment with Stripe. The receipt link above updates LIVE — in a few seconds it will refresh with the PAID watermark and full amount paid. No need to refresh manually.`;
    invoiceText = `${thankTextLine}${browserTextLine}${noteText}`;
  } else {
    const thankHtml = `<p style="margin:0 0 8px 0; font-weight:600; color:#2b2f44;">Thank you for your payment.</p>`;
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
    subject: "Your Warm-Hello subscription is active — check-ins are protected",
    replyTo: SALES_EMAIL,
    text: `Hi there,

Your Warm-Hello subscription has been successfully activated. Thank you for keeping your family protected with us.

Here is a quick summary of your plan:

  • Seniors covered:     ${seniorsCoveredText}
  • Billing frequency:   Annual (billed once per year)
  • Plan:                ${planSummaryLine}
  • Emergency contacts:  ${contactsText}
  • Daily check-in time: ${checkInTimesText}
  • Next billing date:   ${nextBilling}
  • Receipt:              ${invoiceText}

A few important notes:

  1. Check-ins will continue exactly as they were during your trial. No action needed from either you or the senior.
  2. You can change the senior name, phone numbers, additional emergency contacts, check-in window time, or billing details at any time from your Dashboard:
     ${dashboardLink}
  3. You can cancel the auto-renewal at any time from ${settingsLink} — your coverage stays active through the end of the billing period you already paid for.

If anything looks wrong on the summary above, just reply to this email and we'll fix it before the next billing cycle.

Warmly,
The Warm-Hello Team${footer.text}`,
    html: `<p><img src="${env.APP_URL}/warmhello-logo-b.png" alt="Warm-Hello" width="140" /></p>
<p>Hi there,</p>
<p>Your Warm-Hello subscription has been <strong>successfully activated</strong>. Thank you for keeping your family protected with us.</p>
<p><strong>Here's a quick summary of your plan:</strong></p>
<table width="100%" cellpadding="8" cellspacing="0" border="0" style="border-collapse:collapse; border:1px solid #e5e7eb; border-radius:12px;">
  <tr>
    <td width="32%" valign="top" style="background:#f4f7ff; border-bottom:1px solid #e5e7eb; color:#59617a; font-weight:600;">Seniors covered</td>
    <td valign="top" style="border-bottom:1px solid #e5e7eb;">${seniorsCoveredText}</td>
  </tr>
  <tr>
    <td width="32%" valign="top" style="background:#f4f7ff; border-bottom:1px solid #e5e7eb; color:#59617a; font-weight:600;">Billing frequency</td>
    <td valign="top" style="border-bottom:1px solid #e5e7eb;">Annual (billed once per year)</td>
  </tr>
  <tr>
    <td width="32%" valign="top" style="background:#f4f7ff; border-bottom:1px solid #e5e7eb; color:#59617a; font-weight:600;">Plan</td>
    <td valign="top" style="border-bottom:1px solid #e5e7eb;">${planSummaryLine}</td>
  </tr>
  <tr>
    <td width="32%" valign="top" style="background:#f4f7ff; border-bottom:1px solid #e5e7eb; color:#59617a; font-weight:600;">Emergency contacts</td>
    <td valign="top" style="border-bottom:1px solid #e5e7eb;">${contactsText}</td>
  </tr>
  <tr>
    <td width="32%" valign="top" style="background:#f4f7ff; border-bottom:1px solid #e5e7eb; color:#59617a; font-weight:600;">Daily check-in time</td>
    <td valign="top" style="border-bottom:1px solid #e5e7eb;">${checkInTimesText}</td>
  </tr>
  <tr>
    <td width="32%" valign="top" style="background:#f4f7ff; border-bottom:1px solid #e5e7eb; color:#59617a; font-weight:600;">Next billing date</td>
    <td valign="top" style="border-bottom:1px solid #e5e7eb;">${nextBilling}</td>
  </tr>
  <tr>
    <td width="32%" valign="top" style="background:#f4f7ff; color:#59617a; font-weight:600;">Receipt</td>
    <td valign="top;">${invoiceHtml}</td>
  </tr>
</table>
<p style="margin-top:24px;"><strong>A few important notes:</strong></p>
<p>
  1. Check-ins will continue exactly as they were during your trial. No action needed from either you or the senior.<br />
  2. You can change the senior name, phone numbers, additional emergency contacts, check-in window time, or billing details at any time from your <a href="${dashboardLink}">Dashboard</a>.<br />
  3. You can cancel the auto-renewal at any time from <a href="${settingsLink}">Dashboard → Settings</a>. Your coverage stays active through the end of the billing period you already paid for.
</p>
<p>If anything looks wrong on the summary above, just reply to this email and we'll fix it before the next billing cycle.</p>
<p>Warmly,<br />The Warm-Hello Team</p>
${footer.html}`,
  });
}
