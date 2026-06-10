import Stripe from "stripe";
import { env } from "@/lib/env";

let stripeClient: Stripe | null = null;

export function getStripeClient() {
  if (!env.STRIPE_SECRET_KEY) {
    return null;
  }

  stripeClient ??= new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-05-28.basil",
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
