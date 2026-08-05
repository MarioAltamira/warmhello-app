import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";

function mapStripeSubscriptionStatus(status: string) {
  if (status === "active" || status === "trialing") {
    return "ACTIVE" as const;
  }

  if (status === "past_due" || status === "unpaid") {
    return "PAST_DUE" as const;
  }

  return "CANCELED" as const;
}

function stripeCurrentPeriodEnd(subscription: {
  current_period_end?: number | null;
  cancel_at?: number | null;
  ended_at?: number | null;
}) {
  const candidates = [subscription.cancel_at, subscription.ended_at, subscription.current_period_end]
    .filter((v): v is number => typeof v === "number" && v > 0);
  if (candidates.length === 0) return null;
  return new Date(Math.max(...candidates) * 1000);
}

export async function applyStripeEvent(event: Stripe.Event) {
  if (!prisma) {
    return { ok: false as const, message: "Database is not configured yet." };
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const subscriberId = session.client_reference_id;
      const customerId = typeof session.customer === "string" ? session.customer : null;
      const subscriptionId =
        typeof session.subscription === "string" ? session.subscription : null;

      if (!subscriberId && !session.customer_email) {
        return { ok: false as const, message: "Missing subscriber reference." };
      }

      let currentPeriodEndsAt: Date | undefined;
      if (subscriptionId) {
        try {
          const { getStripeClient } = await import("@/lib/stripe");
          const stripe = getStripeClient();
          if (stripe) {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            const endsAt = stripeCurrentPeriodEnd(subscription);
            if (endsAt) currentPeriodEndsAt = endsAt;
          }
        } catch {
          // ignore
        }
      }

      await prisma.subscriber.updateMany({
        where: subscriberId
          ? { id: subscriberId }
          : { email: session.customer_email ?? undefined },
        data: {
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          subscriptionStatus: "ACTIVE",
          currentPeriodEndsAt,
        },
      });

      return { ok: true as const, message: "Checkout applied." };
    }

    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = typeof subscription.customer === "string" ? subscription.customer : null;
      const currentPeriodEndsAt = stripeCurrentPeriodEnd(subscription);

      await prisma.subscriber.updateMany({
        where: {
          OR: [
            { stripeSubscriptionId: subscription.id },
            ...(customerId ? [{ stripeCustomerId: customerId }] : []),
          ],
        },
        data: {
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscription.id,
          subscriptionStatus: mapStripeSubscriptionStatus(subscription.status),
          currentPeriodEndsAt: currentPeriodEndsAt ?? undefined,
        },
      });

      return { ok: true as const, message: "Subscription status synced." };
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = typeof invoice.customer === "string" ? invoice.customer : null;

      await prisma.subscriber.updateMany({
        where: customerId ? { stripeCustomerId: customerId } : { id: "__missing__" },
        data: {
          subscriptionStatus: "PAST_DUE",
        },
      });

      return { ok: true as const, message: "Invoice failure synced." };
    }

    default:
      return { ok: true as const, message: `Ignored event ${event.type}.` };
  }
}
