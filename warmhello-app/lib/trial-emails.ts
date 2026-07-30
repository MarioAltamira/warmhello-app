import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { env } from "@/lib/env";

async function getTrialSubscriber(subscriberId: string) {
  if (!prisma) {
    return null;
  }

  const subscriber = await prisma.subscriber.findUnique({
    where: { id: subscriberId },
  });

  if (!subscriber || subscriber.subscriptionStatus !== "TRIAL") {
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

export async function sendTrialWelcomeEmail(subscriberId: string) {
  const subscriber = await getTrialSubscriber(subscriberId);
  if (!subscriber) {
    return { ok: true as const, id: null };
  }

  const dashboardLink = getDashboardLink();

  return sendEmail({
    to: subscriber.email,
    subject: "Welcome to WarmHello - Peace of mind starts today",
    text: `Hi there,

Thank you for choosing WarmHello to help stay connected with your loved one. We know that balancing their independence with your need for peace of mind can be difficult, and we're here to make that rhythm effortless.

Getting started is simple:
If you haven't already, please finish setting up your account and schedule your preferred morning check-in time via your Dashboard:
${dashboardLink}

Remember, there's nothing for your loved one to download or learn. They'll receive a gentle, friendly text each morning with a secure link. A single tap on the big "I'm OK" button is all it takes to keep you in the loop.

We're here to help you get settled. If you have any questions, just hit reply to this email.

Warmly,
The WarmHello Team`,
    html: `<p>Hi there,</p>
<p>Thank you for choosing WarmHello to help stay connected with your loved one. We know that balancing their independence with your need for peace of mind can be difficult, and we're here to make that rhythm effortless.</p>
<p><strong>Getting started is simple:</strong><br />If you haven't already, please finish setting up your account and schedule your preferred morning check-in time via your <a href="${dashboardLink}">Dashboard</a>.</p>
<p>Remember, there's nothing for your loved one to download or learn. They'll receive a gentle, friendly text each morning with a secure link. A single tap on the big "I'm OK" button is all it takes to keep you in the loop.</p>
<p>We're here to help you get settled. If you have any questions, just hit reply to this email.</p>
<p>Warmly,<br />The WarmHello Team</p>`,
  });
}

export async function sendTrialNudgeEmail(subscriberId: string) {
  const subscriber = await getTrialSubscriber(subscriberId);
  if (!subscriber) {
    return { ok: true as const, id: null };
  }

  const buyNowLink = getBuyNowLink(subscriber.id);

  return sendEmail({
    to: subscriber.email,
    subject: "How is your first week going?",
    text: `Hi there,

We hope the first few days of using WarmHello have brought a little more calm to your mornings.

We designed WarmHello to be completely frictionless-a quick "check-in" that feels more like a morning wave than a medical alert. How is it working for you and your loved one so far?

If you're ready to secure this peace of mind for the long term, you can upgrade your account at any time to ensure there's no interruption to your check-ins after your trial ends.

Secure your account for $3/month:
${buyNowLink}

We are always looking to improve. If you have any feedback on your experience so far, we'd love to hear it!

Best,
The WarmHello Team`,
    html: `<p>Hi there,</p>
<p>We hope the first few days of using WarmHello have brought a little more calm to your mornings.</p>
<p>We designed WarmHello to be completely frictionless-a quick "check-in" that feels more like a morning wave than a medical alert. How is it working for you and your loved one so far?</p>
<p>If you're ready to secure this peace of mind for the long term, you can upgrade your account at any time to ensure there's no interruption to your check-ins after your trial ends.</p>
<p><a href="${buyNowLink}">Secure your account for $3/month</a></p>
<p>We are always looking to improve. If you have any feedback on your experience so far, we'd love to hear it!</p>
<p>Best,<br />The WarmHello Team</p>`,
  });
}

export async function sendTrialFinalEmail(subscriberId: string) {
  const subscriber = await getTrialSubscriber(subscriberId);
  if (!subscriber) {
    return { ok: true as const, id: null };
  }

  const buyNowLink = getBuyNowLink(subscriber.id);

  return sendEmail({
    to: subscriber.email,
    subject: "Your trial has ended - stay connected with WarmHello",
    text: `Hi there,

Your 7-day free trial of WarmHello has concluded. We hope that over the past week, you've experienced how much easier it is to stay connected without having to be "the person who checks in" every single morning.

We would love to continue helping you protect that sense of peace for your family. If you'd like to keep the automated check-ins running, you can officially activate your subscription today for just $3 a month.

Activate your WarmHello subscription here:
${buyNowLink}

Thank you for trusting us to help you bridge the gap between respect for their independence and your own peace of mind.

Warmly,
The WarmHello Team`,
    html: `<p>Hi there,</p>
<p>Your 7-day free trial of WarmHello has concluded. We hope that over the past week, you've experienced how much easier it is to stay connected without having to be "the person who checks in" every single morning.</p>
<p>We would love to continue helping you protect that sense of peace for your family. If you'd like to keep the automated check-ins running, you can officially activate your subscription today for just $3 a month.</p>
<p><a href="${buyNowLink}">Activate your WarmHello subscription here</a></p>
<p>Thank you for trusting us to help you bridge the gap between respect for their independence and your own peace of mind.</p>
<p>Warmly,<br />The WarmHello Team</p>`,
  });
}
