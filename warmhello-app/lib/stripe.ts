import Stripe from "stripe";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import {
  BillingCurrency,
  BillingInterval,
  DEFAULT_INTERVAL,
  isBillingCurrency,
  isBillingInterval,
  pricingPlanFor,
} from "@/lib/pricing";
import { getStripePriceIdFor } from "@/lib/visitor-currency";

type ConsoleWithWarn = Console & {
  warn?: (...args: unknown[]) => void;
};

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

export async function createCheckoutSession(input: {
  subscriberId: string;
  billingInterval?: BillingInterval | null;
  metadata?: Record<string, string>;
}) {
  const stripe = getStripeClient();
  if (!prisma) {
    return {
      ok: false as const,
      message: "Database is not configured yet.",
    };
  }

  const subscriber = await prisma.subscriber.findUnique({
    where: { id: input.subscriberId },
    select: {
      id: true,
      email: true,
      billingCurrency: true,
      stripeCustomerId: true,
      subscriptionStatus: true,
      stripeSubscriptionId: true,
      currentPeriodEndsAt: true,
    },
  });
  if (!subscriber) {
    return {
      ok: false as const,
      message: "Subscriber was not found.",
    };
  }

  if (subscriber.subscriptionStatus === "ACTIVE") {
    return {
      ok: false as const,
      alreadySubscribed: true as const,
      message:
        "You are already subscribed and billing is active. To change your plan, reach out to sales@warm-hello.com or visit Settings → Subscription.",
    };
  }
  if (
    subscriber.subscriptionStatus === "CANCELED" &&
    subscriber.currentPeriodEndsAt &&
    subscriber.currentPeriodEndsAt.getTime() > Date.now() &&
    subscriber.stripeSubscriptionId
  ) {
    return {
      ok: false as const,
      alreadySubscribed: true as const,
      message:
        "Your subscription is still active through the end of the current paid period. No new payment is needed right now. You can reactivate in Settings → Subscription once your paid period ends.",
    };
  }
  if (subscriber.subscriptionStatus === "PAST_DUE") {
    return {
      ok: false as const,
      alreadySubscribed: true as const,
      message:
        "Your account currently shows an unpaid invoice. Please reach out to sales@warm-hello.com to resolve this before starting a new subscription so you are not double-billed.",
    };
  }

  const currency: BillingCurrency = isBillingCurrency(subscriber.billingCurrency)
    ? subscriber.billingCurrency
    : "USD";
  const rawInterval = input.billingInterval;
  const interval: BillingInterval = isBillingInterval(rawInterval)
    ? rawInterval
    : DEFAULT_INTERVAL;
  const priceId = getStripePriceIdFor(currency, interval);
  if (!stripe || !priceId) {
    return {
      ok: false as const,
      message:
        "Stripe is not configured for the selected currency and plan. Please contact sales@warm-hello.com.",
    };
  }

  const plan = pricingPlanFor(currency);
  const monthlyAmount = plan.monthly.amount.toFixed(2);
  const annualTotal = plan.annual.totalPerYear.toFixed(2);
  const annualEquivMonthly = plan.annual.equivalentMonthly.toFixed(2);
  const dailyAmount = plan.annual.dailyAmount.toFixed(2);
  const currencyLong =
    currency === "USD" ? "US Dollar (USD)" : "Canadian Dollar (CAD)";

  const planSummaryLabel =
    interval === "annual"
      ? `${currencyLong} — Annual at $${annualTotal}/year (about $${annualEquivMonthly}/month, $${dailyAmount}/day)`
      : `${currencyLong} — Monthly at $${monthlyAmount}/month`;
  const currencyDropdownLabel =
    interval === "annual"
      ? `${currencyLong} — $${annualEquivMonthly}/month equiv, billed $${annualTotal}/year, $${dailyAmount}/day`
      : `${currencyLong} — $${monthlyAmount}/month, billed monthly`;

  const hasExistingStripeCustomer = Boolean(subscriber.stripeCustomerId);

  const baseParams = {
    mode: "subscription" as const,
    success_url: `${env.APP_URL}/dashboard?checkout=success`,
    cancel_url: `${env.APP_URL}/dashboard?checkout=canceled`,
    ...(hasExistingStripeCustomer
      ? { customer: subscriber.stripeCustomerId! }
      : { customer_email: subscriber.email }),
    client_reference_id: subscriber.id,
    adaptive_pricing: {
      enabled: false,
    },
    automatic_tax: {
      enabled: true,
    },
    ...(hasExistingStripeCustomer
      ? {
          customer_update: {
            address: "auto" as const,
          },
        }
      : {}),
    tax_id_collection: {
      enabled: true,
    },
    custom_fields: [
      {
        key: "billing_currency",
        label: {
          type: "custom" as const,
          custom: "Billing currency",
        },
        type: "dropdown" as const,
        dropdown: {
          options: [
            {
              label: currencyDropdownLabel,
              value: currency.toLowerCase(),
            },
          ],
          default_value: currency.toLowerCase(),
        },
        optional: false as const,
      },
      {
        key: "plan_details",
        label: {
          type: "custom" as const,
          custom: "Plan details",
        },
        type: "text" as const,
        optional: true as const,
        text: {
          default_value: planSummaryLabel,
        },
      },
    ],
    subscription_data: {
      metadata: {
        subscriberId: subscriber.id,
        billingInterval: interval,
        billingCurrency: currency,
        ...(input.metadata ?? {}),
      },
      payment_settings: {
        payment_method_types: [],
      },
    },
    metadata: {
      subscriberId: subscriber.id,
      billingCurrency: currency,
      billingInterval: interval,
      ...(input.metadata ?? {}),
    },
    invoice_settings: {
      payment_settings: {
        payment_method_types: [],
      },
    },
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
  };

  const baseParamsAsStripe = baseParams as unknown as Stripe.Checkout.SessionCreateParams;

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.create(baseParamsAsStripe);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    const baseParamsAny = baseParams as Record<string, unknown>;
    const {
      automatic_tax: _omitTax,
      tax_id_collection: _omitTaxId,
      customer_update: _omitCustomerUpdate,
      invoice_settings: _omitInvoiceSettings,
      ...fallbackParamsAny
    } = baseParamsAny;
    void _omitTax;
    void _omitTaxId;
    void _omitCustomerUpdate;
    void _omitInvoiceSettings;
    const fallbackParams = fallbackParamsAny as Stripe.Checkout.SessionCreateParams;
    fallbackParams.metadata = {
      ...(fallbackParams.metadata ?? {}),
      __taxFallBackSkipped: "1",
      __fallbackOriginalError: msg.slice(0, 480),
    };
    if (typeof (console as ConsoleWithWarn).warn === "function") {
      (console as ConsoleWithWarn).warn(
        "[createCheckoutSession] first attempt failed; retrying without automatic_tax / tax_id_collection / customer_update. original error:",
        msg,
      );
    }
    session = await stripe.checkout.sessions.create(fallbackParams);
  }

  try {
    const customerId = typeof session.customer === "string" ? session.customer : (session.customer as unknown as { id?: string } | null)?.id;
    if (customerId) {
      const customerUpdateParams = {
        invoice_settings: {
          payment_settings: {
            payment_method_types: [],
          },
        } as unknown as Record<string, unknown>,
        payment_settings: {
          payment_method_types: [],
        } as unknown as Record<string, unknown>,
      } as unknown as Record<string, unknown>;
      await stripe.customers.update(customerId, customerUpdateParams);
      console.log(`[createCheckoutSession] customer payment_settings hidden (future invoices, cus=${customerId})`);
    }
    const subscriptionId =
      typeof session.subscription === "string"
        ? session.subscription
        : (session.subscription as unknown as { id?: string } | null)?.id;
    if (subscriptionId) {
      const subUpdateParams = {
        payment_settings: {
          payment_method_types: [],
        },
      } as unknown as Record<string, unknown>;
      await stripe.subscriptions.update(subscriptionId, subUpdateParams);
      console.log(`[createCheckoutSession] subscription payment_settings hidden (renewals, sub=${subscriptionId})`);
    }
  } catch (postErr) {
    if (typeof (console as ConsoleWithWarn).warn === "function") {
      (console as ConsoleWithWarn).warn(
        "[createCheckoutSession] best-effort post-checkout customer/subscription payment_settings write failed (non-fatal, checkout URL still valid). error:",
        postErr instanceof Error ? postErr.message : String(postErr),
      );
    }
  }

  return { ok: true as const, url: session.url, checkoutUrl: session.url };
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
    console.warn(
      `[stripe-webhook:verify-signature] ABORT: stripeClient? ${Boolean(stripe)} ENV_STRIPE_WEBHOOK_SECRET_LEN=${env.STRIPE_WEBHOOK_SECRET?.length ?? 0} signature_header=${signature ? `present(len=${signature.length})` : "MISSING"}. Returning null -> 400 to Stripe.`,
    );
    return null;
  }

  try {
    return stripe.webhooks.constructEvent(payload, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn(
      `[stripe-webhook:verify-signature] constructEvent FAILED. message=${msg}. signature_header_len=${signature.length}. ENV_STRIPE_WEBHOOK_SECRET_first10=${env.STRIPE_WEBHOOK_SECRET.slice(0, 10)}…`.slice(
        0,
        420,
      ),
    );
    if (error instanceof Error && typeof error.stack === "string") {
      console.warn(`[stripe-webhook:verify-signature] stack=${error.stack.slice(0, 700)}`);
    }
    return null;
  }
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
