import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { BillingCurrency, isBillingCurrency } from "@/lib/pricing";

function mapStripeSubscriptionStatus(status: string) {
  if (status === "active" || status === "trialing") {
    return "ACTIVE" as const;
  }

  if (status === "past_due" || status === "unpaid") {
    return "PAST_DUE" as const;
  }

  return "CANCELED" as const;
}

function currencyFromSessionOrSubscription(input: {
  currencyField?: string | null;
  subscriptionCurrency?: string | null;
  metadataCurrency?: string | null | unknown;
}): BillingCurrency {
  const candidates = [
    typeof input.metadataCurrency === "string" ? input.metadataCurrency : null,
    typeof input.subscriptionCurrency === "string" ? input.subscriptionCurrency : null,
    typeof input.currencyField === "string" ? input.currencyField : null,
  ]
    .filter((v): v is string => Boolean(v))
    .map((v) => v.toUpperCase());
  for (const candidate of candidates) {
    if (isBillingCurrency(candidate)) return candidate;
  }
  return "USD";
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
      let billingCurrencyFromStripe: BillingCurrency | undefined;
      if (subscriptionId) {
        try {
          const { getStripeClient } = await import("@/lib/stripe");
          const stripe = getStripeClient();
          if (stripe) {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            const endsAt = stripeCurrentPeriodEnd(subscription);
            if (endsAt) currentPeriodEndsAt = endsAt;
            billingCurrencyFromStripe = currencyFromSessionOrSubscription({
              currencyField: session.currency,
              subscriptionCurrency: subscription.currency,
              metadataCurrency: (session.metadata as { billingCurrency?: unknown } | null)?.billingCurrency,
            });
          }
        } catch {
          // ignore
        }
      }

      const sessionCurrency = billingCurrencyFromStripe ??
        currencyFromSessionOrSubscription({
          currencyField: session.currency,
          metadataCurrency: (session.metadata as { billingCurrency?: unknown } | null)?.billingCurrency,
        });

      await prisma.subscriber.updateMany({
        where: subscriberId
          ? { id: subscriberId }
          : { email: session.customer_email ?? undefined },
        data: {
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          subscriptionStatus: "ACTIVE",
          billingCurrency: sessionCurrency,
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
      const billingCurrencyFromStripe = currencyFromSessionOrSubscription({
        subscriptionCurrency: subscription.currency,
      });

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
          billingCurrency: billingCurrencyFromStripe,
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
