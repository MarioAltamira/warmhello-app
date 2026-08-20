import Stripe from "stripe";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { BillingCurrency, isBillingCurrency } from "@/lib/pricing";
import { getStripePriceIdFor } from "@/lib/visitor-currency";

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

export async function resolveCheckoutCurrency(input: {
  subscriberId: string;
}): Promise<BillingCurrency> {
  if (prisma) {
    try {
      const row = await prisma.subscriber.findUnique({
        where: { id: input.subscriberId },
        select: { billingCurrency: true },
      });
      if (row?.billingCurrency && isBillingCurrency(row.billingCurrency)) {
        return row.billingCurrency;
      }
    } catch {
      // ignore and fall through to default
    }
  }
  return "USD";
}

export async function createCheckoutSession(input: { subscriberId: string }) {
  const stripe = getStripeClient();
  if (!prisma) {
    return {
      ok: false as const,
      message: "Database is not configured yet.",
    };
  }

  const subscriber = await prisma.subscriber.findUnique({
    where: { id: input.subscriberId },
    select: { id: true, email: true, billingCurrency: true },
  });
  if (!subscriber) {
    return {
      ok: false as const,
      message: "Subscriber was not found.",
    };
  }

  const currency: BillingCurrency = isBillingCurrency(subscriber.billingCurrency)
    ? subscriber.billingCurrency
    : "USD";
  const priceId = getStripePriceIdFor(currency);
  if (!stripe || !priceId) {
    return {
      ok: false as const,
      message:
        "Stripe is not configured for the selected currency. Please contact sales@warm-hello.com.",
    };
  }

  const monthlyAmount = currency === "USD" ? "5.00" : "6.00";
  const yearlyAmount = currency === "USD" ? "60.00" : "72.00";
  const dailyAmount = currency === "USD" ? "0.16" : "0.20";
  const currencyLong =
    currency === "USD" ? "US Dollar (USD)" : "Canadian Dollar (CAD)";
  const currencyDropdownLabel =
    currency === "USD"
      ? `US Dollar (USD) - $${monthlyAmount}/month, $${yearlyAmount}/year`
      : `Canadian Dollar (CAD) - $${monthlyAmount}/month, $${yearlyAmount}/year`;

  const baseParams: Stripe.Checkout.SessionCreateParams = {
    mode: "subscription",
    success_url: `${env.APP_URL}/dashboard?checkout=success`,
    cancel_url: `${env.APP_URL}/dashboard?checkout=canceled`,
    customer_email: subscriber.email,
    client_reference_id: subscriber.id,
    adaptive_pricing: {
      enabled: false,
    },
    automatic_tax: {
      enabled: true,
    },
    customer_update: {
      address: "auto",
    },
    tax_id_collection: {
      enabled: true,
    },
    custom_fields: [
      {
        key: "billing_currency",
        label: {
          type: "custom",
          custom: "Billing currency",
        },
        type: "dropdown",
        dropdown: {
          options: [
            {
              label: currencyDropdownLabel,
              value: currency.toLowerCase(),
            },
          ],
          default_value: currency.toLowerCase(),
        },
        optional: false,
      },
      {
        key: "plan_details",
        label: {
          type: "custom",
          custom: "Plan details",
        },
        type: "text",
        optional: true,
        text: {
          default_value: `${currencyLong} — $${monthlyAmount}/month, $${yearlyAmount}/year billed annually, about $${dailyAmount}/day`,
        },
      },
    ],
    subscription_data: {
      metadata: {
        subscriberId: subscriber.id,
      },
    },
    metadata: {
      subscriberId: subscriber.id,
      billingCurrency: currency,
    },
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
  };

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.create(baseParams);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    const stripeTaxDisabled =
      /stripe tax/i.test(msg) ||
      /automatic_tax/i.test(msg) ||
      /tax_id_collection/i.test(msg) ||
      /tax.{0,20}not.{0,20}enabled/i.test(msg);
    if (stripeTaxDisabled) {
      const {
        automatic_tax: _omitTax,
        tax_id_collection: _omitTaxId,
        customer_update: _omitCustomerUpdate,
        ...fallbackParams
      } = baseParams;
      void _omitTax;
      void _omitTaxId;
      void _omitCustomerUpdate;
      session = await stripe.checkout.sessions.create(fallbackParams);
    } else {
      throw error;
    }
  }

  return { ok: true as const, url: session.url };
}

export async function getPriceInfo(priceId?: string) {
  const stripe = getStripeClient();
  if (!stripe || !priceId) {
    return { ok: false as const, price: null, displayLabel: null };
  }

  try {
    const price = await stripe.prices.retrieve(priceId);
    const currency = (price.currency ?? "usd").toUpperCase();
    const amount = price.unit_amount_decimal
      ? Number(price.unit_amount_decimal) / 100
      : Number(price.unit_amount ?? 0) / 100;
    const interval = price.recurring?.interval ?? null;

    const period =
      interval === "month"
        ? "month"
        : interval === "year"
          ? "year"
          : interval === "week"
            ? "week"
            : interval === "day"
              ? "day"
              : "one-time";

    return {
      ok: true as const,
      price: {
        id: price.id,
        currency,
        amount,
        interval,
        period,
      },
      displayLabel:
        period === "one-time"
          ? `${currency} $${amount.toFixed(2)}`
          : `${currency} $${amount.toFixed(2)} per ${period}`,
    };
  } catch {
    return { ok: false as const, price: null, displayLabel: null };
  }
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

    const updated = await stripe.subscriptions.update(subscriber.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    const subscriptionTimestamps = updated as unknown as {
      cancel_at?: number | null;
      ended_at?: number | null;
      current_period_end?: number | null;
    };
    const candidates = [
      subscriptionTimestamps.cancel_at,
      subscriptionTimestamps.ended_at,
      subscriptionTimestamps.current_period_end,
    ]
      .filter((v): v is number => typeof v === "number" && v > 0);
    const currentPeriodEndsAt = candidates.length
      ? new Date(Math.max(...candidates) * 1000)
      : undefined;

    await prisma.subscriber.update({
      where: { id: subscriber.id },
      data: { subscriptionStatus: "CANCELED", currentPeriodEndsAt },
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
