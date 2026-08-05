import Stripe from "stripe";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

let stripeClient: Stripe | null = null;

export function getStripeClient() {
  if (!env.STRIPE_SECRET_KEY) {
    return null;
  }

  stripeClient ??= new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-08-27.basil",
  });

  return stripeClient;
}

export async function createCheckoutSession(input: {
  customerEmail: string;
  subscriberId: string;
}) {
  const stripe = getStripeClient();
  if (!stripe || !env.STRIPE_PRICE_ID) {
    return { ok: false as const, message: "Stripe is not configured." };
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    success_url: `${env.APP_URL}/dashboard?checkout=success`,
    cancel_url: `${env.APP_URL}/dashboard?checkout=canceled`,
    customer_email: input.customerEmail,
    client_reference_id: input.subscriberId,
    subscription_data: {
      metadata: {
        subscriberId: input.subscriberId,
      },
    },
    metadata: {
      subscriberId: input.subscriberId,
    },
    line_items: [
      {
        price: env.STRIPE_PRICE_ID,
        quantity: 1,
      },
    ],
  });

  return { ok: true as const, url: session.url };
}

export function verifyStripeWebhookSignature(payload: string, signature: string | null) {
  const stripe = getStripeClient();
  if (!stripe || !env.STRIPE_WEBHOOK_SECRET || !signature) {
    return null;
  }

  return stripe.webhooks.constructEvent(payload, signature, env.STRIPE_WEBHOOK_SECRET);
}

export async function cancelSubscriptionAtPeriodEnd(input: { subscriberId: string }) {
  const stripe = getStripeClient();
  if (!stripe) {
    return { ok: false as const, message: "Stripe is not configured." };
  }

  if (!prisma) {
    return { ok: false as const, message: "Database is not configured yet." };
  }

  try {
    const subscriber = await prisma.subscriber.findUnique({
      where: { id: input.subscriberId },
      select: {
        id: true,
        stripeSubscriptionId: true,
        stripeCustomerId: true,
        subscriptionStatus: true,
      },
    });

    if (!subscriber) {
      return { ok: false as const, message: "Subscriber was not found." };
    }

    if (!subscriber.stripeSubscriptionId) {
      await prisma.subscriber.update({
        where: { id: subscriber.id },
        data: { subscriptionStatus: "CANCELED" },
      });
      return {
        ok: true as const,
        message: "Subscription marked as canceled. No active Stripe subscription was found.",
      };
    }

    await stripe.subscriptions.update(subscriber.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    await prisma.subscriber.update({
      where: { id: subscriber.id },
      data: { subscriptionStatus: "CANCELED" },
    });

    return {
      ok: true as const,
      message: "Auto-renew canceled. Your service will remain active until the end of the billing cycle.",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to cancel subscription.";
    return { ok: false as const, message };
  }
}
