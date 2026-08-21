import Stripe from "stripe";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { BillingCurrency, isBillingCurrency } from "@/lib/pricing";
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
    select: { id: true, email: true, billingCurrency: true, stripeCustomerId: true },
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
      const updatedCustomer = await stripe.customers.update(
        customerId,
        customerUpdateParams,
      );
      const updatedInvoiceSettings = (updatedCustomer as unknown as { invoice_settings?: Record<string, unknown> | null }).invoice_settings ?? {};
      const updatedCustomerRootPaymentSettings = (updatedCustomer as unknown as { payment_settings?: Record<string, unknown> | null }).payment_settings ?? null;
      const updatedNested = (updatedInvoiceSettings as Record<string, unknown>).payment_settings ?? null;
      const nestedPmt = updatedNested && typeof updatedNested === "object" && "payment_method_types" in (updatedNested as Record<string, unknown>) ? JSON.stringify((updatedNested as Record<string, unknown>).payment_method_types) : "null";
      const rootPmt = updatedCustomerRootPaymentSettings && typeof updatedCustomerRootPaymentSettings === "object" && "payment_method_types" in updatedCustomerRootPaymentSettings ? JSON.stringify(updatedCustomerRootPaymentSettings.payment_method_types) : "null";
      console.log(
        `[createCheckoutSession] PER-CUSTOMER applied update on cus=${customerId}. RESPONSE invoice_settings.payment_settings.payment_method_types=${nestedPmt} | ROOT payment_settings.payment_method_types=${rootPmt}. (Empty array means Stripe accepted and hid Pay online for this customer's future invoices.)`,
      );
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
      const updatedSub = await stripe.subscriptions.update(subscriptionId, subUpdateParams);
      const subSettings = (updatedSub as unknown as { payment_settings?: Record<string, unknown> | null }).payment_settings ?? null;
      const subPmt = subSettings && typeof subSettings === "object" && "payment_method_types" in subSettings ? JSON.stringify(subSettings.payment_method_types) : "null";
      console.log(
        `[createCheckoutSession] PER-SUBSCRIPTION applied update on sub=${subscriptionId}. RESPONSE payment_settings.payment_method_types=${subPmt}. (Empty array hides Pay online from this subscription's auto-renewal invoices.)`,
      );
    }
  } catch (postErr) {
    // Never let these secondary post-apply calls prevent the user from opening the checkout URL.
    // They are best-effort cosmetic fixes only. If they fail, checkout still works fine.
    if (typeof (console as ConsoleWithWarn).warn === "function") {
      (console as ConsoleWithWarn).warn(
        "[createCheckoutSession] best-effort post-checkout-apply (customer.invoice_settings / subscription.payment_settings empty payment_method_types) failed. Checkout URL is still valid. Original error:",
        postErr instanceof Error ? postErr.message : String(postErr),
      );
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
