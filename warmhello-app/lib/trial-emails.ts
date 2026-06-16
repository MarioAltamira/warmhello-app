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

export async function sendTrialNudgeEmail(subscriberId: string) {
  const subscriber = await getTrialSubscriber(subscriberId);
  if (!subscriber) {
    return { ok: false as const, message: "Subscriber is no longer in trial." };
  }

  return sendEmail({
    to: subscriber.email,
    subject: "Still enjoying WarmHello?",
    text: `Hi ${subscriber.fullName}, your WarmHello trial is underway. If you would like to keep the daily check-ins active, visit ${env.APP_URL}/dashboard to purchase and continue your household coverage.`,
    html: `<p>Hi ${subscriber.fullName},</p><p>Your WarmHello trial is underway. If you would like to keep the daily check-ins active, visit <a href="${env.APP_URL}/dashboard">${env.APP_URL}/dashboard</a> to purchase and continue your household coverage.</p><p>Warmly,<br />${env.EMAIL_FROM_ADDRESS}</p>`,
  });
}

export async function sendTrialFinalEmail(subscriberId: string) {
  const subscriber = await getTrialSubscriber(subscriberId);
  if (!subscriber) {
    return { ok: false as const, message: "Subscriber is no longer in trial." };
  }

  return sendEmail({
    to: subscriber.email,
    subject: "Thanks for trying WarmHello",
    text: `Hi ${subscriber.fullName}, thanks for trying WarmHello. If you would like one more chance to continue daily check-ins, visit ${env.APP_URL}/dashboard and complete your purchase today.`,
    html: `<p>Hi ${subscriber.fullName},</p><p>Thanks for trying WarmHello. If you would like one more chance to continue daily check-ins, visit <a href="${env.APP_URL}/dashboard">${env.APP_URL}/dashboard</a> and complete your purchase today.</p><p>Warmly,<br />${env.EMAIL_FROM_ADDRESS}</p>`,
  });
}
