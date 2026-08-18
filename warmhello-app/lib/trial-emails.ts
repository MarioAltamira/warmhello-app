import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { env } from "@/lib/env";
import { createUnsubscribeToken } from "@/lib/unsubscribe";

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

function getDashboardLink() {
  return `${env.APP_URL}/dashboard`;
}

function getBuyNowLink(subscriberId: string) {
  return `${env.APP_URL}/subscribe/${subscriberId}`;
}

function getUnsubscribeLink(subscriberId: string) {
  const token = createUnsubscribeToken({ subscriberId });
  return `${env.APP_URL}/unsubscribe/${token}`;
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

  return sendEmail({
    to: subscriber.email,
    subject: "Welcome to Warm-Hello - Peace of mind starts today",
    text: `Hi there,

Thank you for choosing Warm-Hello to help stay connected with your loved one. We know that balancing their independence with your need for peace of mind can be difficult, and we're here to make that rhythm effortless.

Getting started is simple:
If you haven't already, please finish setting up your account and schedule your preferred morning check-in time via your Dashboard:
${dashboardLink}

Remember, there's nothing for your loved one to download or learn. They'll receive a gentle, friendly text each morning with a secure link. A single tap on the big "I'm OK" button is all it takes to keep you in the loop.

We're here to help you get settled. If you have any questions, just hit reply to this email.

Warmly,
The Warm-Hello Team

Unsubscribe: ${unsubscribeLink}`,
    html: `<p><img src="${env.APP_URL}/warmhello-logo-b.png" alt="Warm-Hello" width="140" /></p>
<p>Hi there,</p>
<p>Thank you for choosing Warm-Hello to help stay connected with your loved one. We know that balancing their independence with your need for peace of mind can be difficult, and we're here to make that rhythm effortless.</p>
<p><strong>Getting started is simple:</strong><br />If you haven't already, please finish setting up your account and schedule your preferred morning check-in time via your <a href="${dashboardLink}">Dashboard</a>.</p>
<p>Remember, there's nothing for your loved one to download or learn. They'll receive a gentle, friendly text each morning with a secure link. A single tap on the big "I'm OK" button is all it takes to keep you in the loop.</p>
<p>We're here to help you get settled. If you have any questions, just hit reply to this email.</p>
<p>Warmly,<br />The Warm-Hello Team</p>
<p style="font-size: 12px; opacity: 0.8;">To stop trial emails, <a href="${unsubscribeLink}">unsubscribe</a>.</p>`,
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

  return sendEmail({
    to: subscriber.email,
    subject: "How is your first week going?",
    text: `Hi there,

We hope the first few days of using Warm-Hello have brought a little more calm to your mornings.

We designed Warm-Hello to be completely frictionless-a quick "check-in" that feels more like a morning wave than a medical alert. How is it working for you and your loved one so far?

If you're ready to secure this peace of mind for the long term, you can upgrade your account at any time to ensure there's no interruption to your check-ins after your trial ends.

Secure your account for $6/month:
${buyNowLink}

We are always looking to improve. If you have any feedback on your experience so far, we'd love to hear it!

Best,
The Warm-Hello Team

Unsubscribe: ${unsubscribeLink}`,
    html: `<p><img src="${env.APP_URL}/warmhello-logo-b.png" alt="Warm-Hello" width="140" /></p>
<p>Hi there,</p>
<p>We hope the first few days of using Warm-Hello have brought a little more calm to your mornings.</p>
<p>We designed Warm-Hello to be completely frictionless-a quick "check-in" that feels more like a morning wave than a medical alert. How is it working for you and your loved one so far?</p>
<p>If you're ready to secure this peace of mind for the long term, you can upgrade your account at any time to ensure there's no interruption to your check-ins after your trial ends.</p>
<p><a href="${buyNowLink}">Secure your account for $6/month</a></p>
<p>We are always looking to improve. If you have any feedback on your experience so far, we'd love to hear it!</p>
<p>Best,<br />The Warm-Hello Team</p>
<p style="font-size: 12px; opacity: 0.8;">To stop trial emails, <a href="${unsubscribeLink}">unsubscribe</a>.</p>`,
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

  return sendEmail({
    to: subscriber.email,
    subject: "Your trial has ended - stay connected with Warm-Hello",
    text: `Hi there,

Your 7-day free trial of Warm-Hello has concluded. We hope that over the past week, you've experienced how much easier it is to stay connected without having to be "the person who checks in" every single morning.

We would love to continue helping you protect that sense of peace for your family. If you'd like to keep the automated check-ins running, you can officially activate your subscription today for just $6 a month.

Activate your Warm-Hello subscription here:
${buyNowLink}

Thank you for trusting us to help you bridge the gap between respect for their independence and your own peace of mind.

Warmly,
The Warm-Hello Team

Unsubscribe: ${unsubscribeLink}`,
    html: `<p><img src="${env.APP_URL}/warmhello-logo-b.png" alt="Warm-Hello" width="140" /></p>
<p>Hi there,</p>
<p>Your 7-day free trial of Warm-Hello has concluded. We hope that over the past week, you've experienced how much easier it is to stay connected without having to be "the person who checks in" every single morning.</p>
<p>We would love to continue helping you protect that sense of peace for your family. If you'd like to keep the automated check-ins running, you can officially activate your subscription today for just $6 a month.</p>
<p><a href="${buyNowLink}">Activate your Warm-Hello subscription here</a></p>
<p>Thank you for trusting us to help you bridge the gap between respect for their independence and your own peace of mind.</p>
<p>Warmly,<br />The Warm-Hello Team</p>
<p style="font-size: 12px; opacity: 0.8;">To stop trial emails, <a href="${unsubscribeLink}">unsubscribe</a>.</p>`,
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

  return sendEmail({
    to: subscriber.email,
    subject: "Thank you for trying Warm-Hello",
    text: `Hi there,

Thank you for giving Warm-Hello a try.

We've canceled your auto-renewal and your subscription will stay active through the end of your current billing cycle. If you'd like to continue protecting your family's peace of mind with Warm-Hello, you can reactivate anytime from your Dashboard:
${dashboardLink}

If there's anything we could have done better or if you have any questions, simply reply to this email and we'll be happy to help.

Warmly,
The Warm-Hello Team

Unsubscribe: ${unsubscribeLink}`,
    html: `<p><img src="${env.APP_URL}/warmhello-logo-b.png" alt="Warm-Hello" width="140" /></p>
<p>Hi there,</p>
<p>Thank you for giving Warm-Hello a try.</p>
<p>We've canceled your auto-renewal and your subscription will stay active through the end of your current billing cycle. If you'd like to continue protecting your family's peace of mind with Warm-Hello, you can reactivate anytime from your <a href="${dashboardLink}">Dashboard</a>.</p>
<p>If there's anything we could have done better or if you have any questions, simply reply to this email and we'll be happy to help.</p>
<p>Warmly,<br />The Warm-Hello Team</p>
<p style="font-size: 12px; opacity: 0.8;">To stop future emails, <a href="${unsubscribeLink}">unsubscribe</a>.</p>`,
  });
}
