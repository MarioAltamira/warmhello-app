import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { BillingCurrency, isBillingCurrency } from "@/lib/pricing";
import { sendSuccessfulSubscriptionEmail, sendInvoicePaymentFailedEmail } from "@/lib/trial-emails";
import { getStripeClient } from "@/lib/stripe";

type ConsoleWithWarn = Console & {
  warn?: (...args: unknown[]) => void;
};

interface DedupEntry {
  createdAtMs: number;
  source: string;
}
const SUCCESS_EMAIL_DEDUP_WINDOW_MS = 1000 * 60 * 15;
const successEmailDedupCache = new Map<string, DedupEntry>();

function markSuccessEmailSent(subscriberId: string, source: string) {
  successEmailDedupCache.set(subscriberId, { createdAtMs: Date.now(), source });
  const cutoff = Date.now() - SUCCESS_EMAIL_DEDUP_WINDOW_MS;
  for (const [id, entry] of successEmailDedupCache.entries()) {
    if (entry.createdAtMs < cutoff) {
      successEmailDedupCache.delete(id);
    }
  }
}
function hasSuccessEmailBeenSentRecently(subscriberId: string): boolean {
  const entry = successEmailDedupCache.get(subscriberId);
  if (!entry) return false;
  if (Date.now() - entry.createdAtMs > SUCCESS_EMAIL_DEDUP_WINDOW_MS) {
    successEmailDedupCache.delete(subscriberId);
    return false;
  }
  return true;
}

function mapStripeSubscriptionStatus(
  subscription: Pick<Stripe.Subscription, "status" | "cancel_at_period_end">,
) {
  if (subscription.cancel_at_period_end && (subscription.status === "active" || subscription.status === "trialing")) {
    return "CANCELED" as const;
  }

  if (subscription.status === "active" || subscription.status === "trialing") {
    return "ACTIVE" as const;
  }

  if (subscription.status === "past_due" || subscription.status === "unpaid") {
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

  console.log(
    `[stripe-webhook] event.type=${event.type} event.id=${event.id}`,
  );

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const subscriberId = session.client_reference_id;
      const customerId = typeof session.customer === "string" ? session.customer : null;
      const subscriptionId =
        typeof session.subscription === "string" ? session.subscription : null;

      console.log(
        `[stripe-webhook:checkout.session.completed] id=${event.id} subscriberId=${subscriberId ?? "null"} customerId=${customerId ?? "null"} subscriptionId=${subscriptionId ?? "null"}`,
      );

      if (!subscriberId && !session.customer_email) {
        console.warn(
          `[stripe-webhook:checkout.session.completed] missing subscriber reference, returning 400`,
        );
        return { ok: false as const, message: "Missing subscriber reference." };
      }

      let currentPeriodEndsAt: Date | undefined;
      let billingCurrencyFromStripe: BillingCurrency | undefined;
      let billingIntervalFromStripe: "MONTHLY" | "ANNUAL" | undefined;
      let subscriptionPriceAmount: number | undefined;
      if (subscriptionId) {
        try {
          const { getStripeClient } = await import("@/lib/stripe");
          const stripe = getStripeClient();
          if (stripe) {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
              expand: ["items.data.price"],
            });
            const endsAt = stripeCurrentPeriodEnd(subscription);
            if (endsAt) currentPeriodEndsAt = endsAt;
            billingCurrencyFromStripe = currencyFromSessionOrSubscription({
              currencyField: session.currency,
              subscriptionCurrency: subscription.currency,
              metadataCurrency: (session.metadata as { billingCurrency?: unknown } | null)?.billingCurrency,
            });
            const firstItem = subscription.items?.data?.[0];
            const price = firstItem?.price;
            if (price) {
              const recurring = (price as Stripe.Price).recurring;
              const interval = recurring?.interval;
              billingIntervalFromStripe = interval === "year" ? "ANNUAL" : "MONTHLY";
              if (typeof price.unit_amount === "number") {
                subscriptionPriceAmount = price.unit_amount / 100;
              }
            }
          }
        } catch (error) {
          console.warn(
            `[stripe-webhook:checkout.session.completed] failed to retrieve subscription ${subscriptionId}:`,
            error instanceof Error ? error.message : String(error),
          );
        }
      }

      const sessionCurrency = billingCurrencyFromStripe ??
        currencyFromSessionOrSubscription({
          currencyField: session.currency,
          metadataCurrency: (session.metadata as { billingCurrency?: unknown } | null)?.billingCurrency,
        });

      const now = new Date();
      const sessionMetadata = (session.metadata ?? {}) as Record<string, string | undefined>;
      const tosVersion = sessionMetadata.tos_version ?? "v2026-08-29";
      const privacyVersion = sessionMetadata.privacy_version ?? "v2026-08-29";
      const caregiverAck = sessionMetadata.caregiver_ack === "1";
      const subscriptionTermsDisclosureVer =
        `CPA_DISCLOSURE_v1 | TOS_${tosVersion} | PRIVACY_${privacyVersion}`;

      const updateResult = await prisma.subscriber.updateMany({
        where: subscriberId
          ? { id: subscriberId }
          : { email: session.customer_email ?? undefined },
        data: {
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          subscriptionStatus: "ACTIVE",
          billingCurrency: sessionCurrency,
          currentPeriodEndsAt,
          nextRenewalDate: currentPeriodEndsAt,
          subscriptionStartedAt: now,
          billingInterval: billingIntervalFromStripe ?? "MONTHLY",
          subscriptionPriceAmount: typeof subscriptionPriceAmount === "number"
            ? subscriptionPriceAmount
            : undefined,
          subscriptionTermsDisclosureVer,
          tosAcceptedAt: now,
          privacyAcknowledgedAt: now,
          tosVersion,
          privacyPolicyVersion: privacyVersion,
          caregiverSeniorConsentAckAt: caregiverAck ? now : undefined,
        },
      });

      console.log(
        `[stripe-webhook:checkout.session.completed] applied. rows_updated=${updateResult.count} customerId=${customerId ?? "null"} subscriptionId=${subscriptionId ?? "null"} currency=${sessionCurrency}`,
      );

      const finalSubscriberIdForEmail =
        subscriberId ??
        (session.customer_email
          ? (
              await prisma.subscriber.findFirst({
                where: { email: session.customer_email },
                orderBy: { updatedAt: "desc" },
                select: { id: true },
              })
            )?.id
          : undefined);

      if (finalSubscriberIdForEmail) {
        void (async () => {
          try {
            await new Promise((resolve) => setTimeout(resolve, 2000));
            if (hasSuccessEmailBeenSentRecently(finalSubscriberIdForEmail)) {
              console.log(
                `[stripe-webhook:checkout.session.completed:fallback-email] SKIP — dedup cache shows email already sent within 15 min (invoice.paid beat us to it). subscriber=${finalSubscriberIdForEmail}`,
              );
              return;
            }

            let invoicePdfUrl: string | null = null;
            let hostedInvoiceUrl: string | null = null;
            let fallbackStatusPaid = false;
            let fallbackReceiptUrl: string | null = null;
            const extractReceiptFromInvoiceFallback = (inv: Stripe.Invoice): string | null => {
              const charge = (inv as unknown as { charge?: Stripe.Charge | string | null }).charge;
              if (charge && typeof charge === "object" && typeof (charge as Stripe.Charge).receipt_url === "string") {
                return (charge as Stripe.Charge).receipt_url;
              }
              return null;
            };
            if (subscriptionId) {
              try {
                const { getStripeClient } = await import("@/lib/stripe");
                const stripe = getStripeClient();
                if (stripe) {
                  let invoiceIdToPoll: string | null = null;
                  try {
                    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
                      expand: ["latest_invoice", "latest_invoice.charge"],
                    });
                    const maybeInvoice = subscription.latest_invoice as
                      | string
                      | Stripe.Invoice
                      | null
                      | undefined;
                    if (typeof maybeInvoice === "string") {
                      invoiceIdToPoll = maybeInvoice;
                    } else if (maybeInvoice && typeof maybeInvoice === "object" && typeof (maybeInvoice as Stripe.Invoice).id === "string") {
                      invoiceIdToPoll = (maybeInvoice as Stripe.Invoice).id ?? null;
                      if ((maybeInvoice as Stripe.Invoice).status === "paid") {
                        invoicePdfUrl = (maybeInvoice as Stripe.Invoice).invoice_pdf ?? null;
                        hostedInvoiceUrl = (maybeInvoice as Stripe.Invoice).hosted_invoice_url ?? null;
                        fallbackReceiptUrl = extractReceiptFromInvoiceFallback(maybeInvoice as Stripe.Invoice);
                      }
                    }
                  } catch (subRetrieveErr) {
                    console.warn(
                      `[stripe-webhook:checkout.session.completed:fallback-email] subscriptions.retrieve expand=latest_invoice failed (fallback to list): ${subRetrieveErr instanceof Error ? subRetrieveErr.message : String(subRetrieveErr)}`,
                    );
                    const invoices = await stripe.invoices.list({
                      subscription: subscriptionId,
                      limit: 1,
                      expand: ["data.charge"],
                    });
                    const inv = invoices.data[0];
                    if (inv) {
                      invoiceIdToPoll = inv.id ?? null;
                      if (inv.status === "paid") {
                        invoicePdfUrl = inv.invoice_pdf ?? null;
                        hostedInvoiceUrl = inv.hosted_invoice_url ?? null;
                        fallbackReceiptUrl = extractReceiptFromInvoiceFallback(inv);
                      }
                    }
                  }

                  fallbackStatusPaid = !!invoicePdfUrl || !!hostedInvoiceUrl || !!fallbackReceiptUrl;
                  if (invoiceIdToPoll) {
                    try {
                      await stripe.invoices.update(invoiceIdToPoll, {
                        payment_settings: {
                          payment_method_types: [],
                        },
                      });
                      console.log(
                        `[stripe-webhook:checkout.session.completed:fallback-email] per-invoice payment_settings hidden (inv=${invoiceIdToPoll})`,
                      );
                    } catch (fallbackInvoiceUpdateErr) {
                      // best-effort only — if it fails, continue polling / emailing
                      console.warn(
                        `[stripe-webhook:checkout.session.completed:fallback-email] per-invoice write failed (non-fatal): ${fallbackInvoiceUpdateErr instanceof Error ? fallbackInvoiceUpdateErr.message : String(fallbackInvoiceUpdateErr)}`,
                      );
                    }
                  }

                  if (invoiceIdToPoll && !fallbackReceiptUrl) {
                    try {
                      const invWithCharge = await stripe.invoices.retrieve(invoiceIdToPoll, {
                        expand: ["charge"],
                      });
                      fallbackReceiptUrl = extractReceiptFromInvoiceFallback(invWithCharge);
                      if (!invoicePdfUrl) invoicePdfUrl = invWithCharge.invoice_pdf ?? null;
                      if (!hostedInvoiceUrl) hostedInvoiceUrl = invWithCharge.hosted_invoice_url ?? null;
                      if (invWithCharge.status === "paid") fallbackStatusPaid = true;
                    } catch (_chargeRetrieveErr) {
                      // non-fatal, poll loop will also attempt
                    }
                  }

                  if (invoiceIdToPoll && (!invoicePdfUrl && !hostedInvoiceUrl && !fallbackReceiptUrl)) {
                    console.log(
                      `[stripe-webhook:checkout.session.completed:fallback-email] POLL START: invoice ${invoiceIdToPoll} not yet paid. polling up to 8x x 2s.`,
                    );
                    const { pollStripeInvoiceUntilPaid } = await import("@/lib/trial-emails");
                    const poll = await pollStripeInvoiceUntilPaid(invoiceIdToPoll);
                    console.log(
                      `[stripe-webhook:checkout.session.completed:fallback-email] POLL DONE: invoice ${invoiceIdToPoll} status='${poll.status}' attempts=${poll.attempts}/8 gaveUp=${poll.gaveUp} receiptUrl=${poll.receiptUrl ? "FOUND" : "null"}`,
                    );
                    if (poll.status === "paid" || poll.invoicePdf || poll.hostedInvoiceUrl || poll.receiptUrl) {
                      invoicePdfUrl = poll.invoicePdf ?? invoicePdfUrl;
                      hostedInvoiceUrl = poll.hostedInvoiceUrl ?? hostedInvoiceUrl;
                      fallbackReceiptUrl = poll.receiptUrl ?? fallbackReceiptUrl;
                    }
                    if (poll.status === "paid") fallbackStatusPaid = true;
                  }
                }
              } catch (error) {
                console.warn(
                  `[stripe-webhook:checkout.session.completed:fallback-email] invoice fetch / poll failed (ok, will send without invoice URLs): ${error instanceof Error ? error.message : String(error)}`,
                );
              }
            }

            await sendSuccessfulSubscriptionEmail(finalSubscriberIdForEmail, {
              invoicePdfUrl,
              hostedInvoiceUrl,
              receiptUrl: fallbackReceiptUrl,
              statusPaid: fallbackStatusPaid,
            });
            markSuccessEmailSent(finalSubscriberIdForEmail, "checkout.session.completed.fallback");

            console.log(
              `[stripe-webhook:checkout.session.completed:fallback-email] SUCCESS_EMAIL_SENT subscriber=${finalSubscriberIdForEmail} source=fallback (invoice.paid missed or webhook order race)`,
            );
          } catch (error) {
            console.warn(
              `[stripe-webhook:checkout.session.completed:fallback-email] SUCCESS_EMAIL_FAILED subscriber=${finalSubscriberIdForEmail} message=${error instanceof Error ? error.message : String(error)}`,
            );
            if (error instanceof Error && typeof error.stack === "string") {
              console.warn(
                `[stripe-webhook:checkout.session.completed:fallback-email] stack=${error.stack.slice(0, 700)}`,
              );
            }
          }
        })();
      } else {
        console.warn(
          `[stripe-webhook:checkout.session.completed:fallback-email] no finalSubscriberIdForEmail resolved — cannot queue fallback success email`,
        );
      }

      return { ok: true as const, message: "Checkout applied." };
    }

    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice & {
        subscription?: string | Stripe.Subscription | null;
        billing_reason?: string | null;
        invoice_pdf?: string | null;
      };
      const subscriptionId =
        typeof invoice.subscription === "string" ? invoice.subscription : null;
      const customerId = typeof invoice.customer === "string" ? invoice.customer : null;

      console.log(
        `[stripe-webhook:invoice.paid] event.id=${event.id} billing_reason=${invoice.billing_reason ?? "null"} customerId=${customerId ?? "null"} subscriptionId=${subscriptionId ?? "null"} invoiceId=${invoice.id}`,
      );

      if (invoice.billing_reason !== "subscription_create" && subscriptionId && prisma) {
        try {
          const { getStripeClient } = await import("@/lib/stripe");
          const stripe = getStripeClient();
          let renewalPeriodEnd: Date | null = null;
          let renewalInterval: "MONTHLY" | "ANNUAL" | undefined;
          let renewalPrice: number | undefined;
          let renewalCurrency: BillingCurrency | undefined;
          if (stripe) {
            try {
              const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
              expand: ["items.data.price"],
              });
            renewalPeriodEnd = stripeCurrentPeriodEnd(subscription);
            renewalCurrency = currencyFromSessionOrSubscription({
              subscriptionCurrency: subscription.currency,
            });
            const firstItem = subscription.items?.data?.[0];
            const price = firstItem?.price;
            if (price) {
              const recurring = (price as Stripe.Price).recurring;
              renewalInterval = recurring?.interval === "year" ? "ANNUAL" : "MONTHLY";
              if (typeof price.unit_amount === "number") {
                renewalPrice = price.unit_amount / 100;
              }
            }
            } catch (subErr) {
              console.warn(
                `[stripe-webhook:invoice.paid] renewal subscription retrieve failed: ${subErr instanceof Error ? subErr.message : String(subErr)}`,
              );
            }
          }
          await prisma.subscriber.updateMany({
            where: {
              OR: [
              ...(subscriptionId ? [{ stripeSubscriptionId: subscriptionId }] : []),
              ...(customerId ? [{ stripeCustomerId: customerId }] : []),
              ],
            },
            data: {
              currentPeriodEndsAt: renewalPeriodEnd ?? undefined,
              nextRenewalDate: renewalPeriodEnd ?? undefined,
              billingInterval: renewalInterval ?? undefined,
              subscriptionPriceAmount: typeof renewalPrice === "number" ? renewalPrice : undefined,
              billingCurrency: renewalCurrency ?? undefined,
            },
          });
          console.log(
            `[stripe-webhook:invoice.paid] renewal evidence synced for subscription=${subscriptionId ?? "null"}`,
          );
        } catch (renewalErr) {
          console.warn(
            `[stripe-webhook:invoice.paid] renewal sync failed (non-fatal): ${renewalErr instanceof Error ? renewalErr.message : String(renewalErr)}`,
          );
        }
      }

      if (invoice.billing_reason !== "subscription_create") {
        console.log(
          `[stripe-webhook:invoice.paid] SKIP success-email: billing_reason="${invoice.billing_reason ?? "null"}" !== "subscription_create" (this is a renewal or adjustment)`,
        );
        return { ok: true as const, message: "Invoice paid processed." };
      }

      if (!prisma) {
        console.warn(`[stripe-webhook:invoice.paid] SKIP success-email: prisma not configured`);
        return { ok: true as const, message: "Invoice paid processed." };
      }

      try {
        const matchedSubscriber = await prisma.subscriber.findFirst({
          where: {
            OR: [
              ...(subscriptionId ? [{ stripeSubscriptionId: subscriptionId }] : []),
              ...(customerId ? [{ stripeCustomerId: customerId }] : []),
            ],
          },
          orderBy: { updatedAt: "desc" },
        });

        if (!matchedSubscriber) {
          console.warn(
            `[stripe-webhook:invoice.paid] SUCCESS EMAIL NOT SENT: could not match subscriber by subscriptionId=${subscriptionId ?? "null"} OR customerId=${customerId ?? "null"}. If checkout.session.completed hasn't run yet, it will set these columns shortly but email is already skipped. Consider sending from checkout.session.completed as a fallback, OR re-send this webhook after the subscriber row is populated.`,
          );
          return { ok: true as const, message: "Invoice paid processed." };
        }

        console.log(
          `[stripe-webhook:invoice.paid] matched subscriber id=${matchedSubscriber.id} email=${matchedSubscriber.email}. Queuing success email fire-and-forget.`,
        );

        void (async () => {
          try {
            if (hasSuccessEmailBeenSentRecently(matchedSubscriber.id)) {
              console.log(
                `[stripe-webhook:invoice.paid] SKIP success email: dedup cache shows already sent within 15 min (fallback or previous run). subscriber=${matchedSubscriber.id}`,
              );
              return;
            }

            const invoiceIdForUpdate = typeof invoice.id === "string" ? invoice.id : "";
            if (invoiceIdForUpdate) {
              try {
                const stripe = getStripeClient();
                if (stripe) {
                  await stripe.invoices.update(invoiceIdForUpdate, {
                    payment_settings: {
                      payment_method_types: [],
                    },
                  });
                  console.log(
                    `[stripe-webhook:invoice.paid] per-invoice payment_settings hidden (inv=${invoiceIdForUpdate})`,
                  );
                }
              } catch (invoiceUpdateErr) {
                // best-effort only
                console.warn(
                  `[stripe-webhook:invoice.paid] per-invoice write failed (non-fatal): ${invoiceUpdateErr instanceof Error ? invoiceUpdateErr.message : String(invoiceUpdateErr)}`,
                );
              }
            }

            let polledPdf: string | null = invoice.invoice_pdf ?? null;
            let polledHosted: string | null =
              typeof (invoice as unknown as { hosted_invoice_url?: string | null }).hosted_invoice_url === "string"
                ? (invoice as unknown as { hosted_invoice_url: string | null }).hosted_invoice_url
                : null;
            let polledReceiptUrl: string | null = null;
            let finalStatusPaid = (invoice.status ?? "unknown") === "paid";
            const expectedStatus = invoice.status ?? "unknown";
            const invoiceIdForPoll = typeof invoice.id === "string" ? invoice.id : "";
            const extractReceiptFromInvoice = (inv: Stripe.Invoice): string | null => {
              const charge = (inv as unknown as { charge?: Stripe.Charge | string | null }).charge;
              if (charge && typeof charge === "object" && typeof (charge as Stripe.Charge).receipt_url === "string") {
                return (charge as Stripe.Charge).receipt_url;
              }
              return null;
            };

            if (finalStatusPaid && invoiceIdForPoll) {
              try {
                const { getStripeClient } = await import("@/lib/stripe");
                const stripe = getStripeClient();
                if (stripe) {
                  const invWithCharge = await stripe.invoices.retrieve(invoiceIdForPoll, {
                    expand: ["charge"],
                  });
                  polledReceiptUrl = extractReceiptFromInvoice(invWithCharge);
                  polledPdf = invWithCharge.invoice_pdf ?? polledPdf;
                  polledHosted = invWithCharge.hosted_invoice_url ?? polledHosted;
                  console.log(
                    `[stripe-webhook:invoice.paid] pre-poll retrieve-with-charge: invoiceId=${invoiceIdForPoll} receiptUrl=${polledReceiptUrl ? "FOUND" : "null"} invStatus=${invWithCharge.status ?? "unknown"}`,
                  );
                }
              } catch (prePollRetrieveErr) {
                console.warn(
                  `[stripe-webhook:invoice.paid] pre-poll retrieve with expand=charge failed (non-fatal, poll also expands): ${prePollRetrieveErr instanceof Error ? prePollRetrieveErr.message : String(prePollRetrieveErr)}`,
                );
              }
            }

            if (expectedStatus !== "paid" && invoiceIdForPoll) {
              console.log(
                `[stripe-webhook:invoice.paid] POLL START: invoice ${invoiceIdForPoll} status='${expectedStatus}' !== 'paid' -> polling up to 8x x 2s before pulling final URLs.`,
              );
              const { pollStripeInvoiceUntilPaid } = await import("@/lib/trial-emails");
              const res = await pollStripeInvoiceUntilPaid(invoiceIdForPoll);
              console.log(
                `[stripe-webhook:invoice.paid] POLL DONE: invoice ${invoiceIdForPoll} final status='${res.status}' attempts=${res.attempts}/${8} gaveUp=${res.gaveUp} receiptUrl=${res.receiptUrl ? "FOUND" : "null"}`,
              );
              if (res.status === "paid" || res.invoicePdf || res.hostedInvoiceUrl || res.receiptUrl) {
                polledPdf = res.invoicePdf ?? polledPdf;
                polledHosted = res.hostedInvoiceUrl ?? polledHosted;
                polledReceiptUrl = res.receiptUrl ?? polledReceiptUrl;
              }
              if (res.status === "paid") finalStatusPaid = true;
            }

            await sendSuccessfulSubscriptionEmail(matchedSubscriber.id, {
              invoicePdfUrl: polledPdf ?? invoice.invoice_pdf ?? null,
              hostedInvoiceUrl: polledHosted,
              receiptUrl: polledReceiptUrl,
              statusPaid: finalStatusPaid,
            });
            markSuccessEmailSent(matchedSubscriber.id, "invoice.paid");
            console.log(
              `[stripe-webhook:invoice.paid] SUCCESS_EMAIL_SENT subscriber=${matchedSubscriber.id} invoice_pdf=${invoice.invoice_pdf ? "set" : "null"} hosted_invoice_url=${polledHosted ? "set" : "null"} receiptUrl=${polledReceiptUrl ? "SET (no Pay online link guaranteed)" : "null"}`,
            );
          } catch (error) {
            console.warn(
              `[stripe-webhook:invoice.paid] SUCCESS_EMAIL_FAILED subscriber=${matchedSubscriber.id} message=${error instanceof Error ? error.message : String(error)}`,
            );
            if (error instanceof Error && typeof error.stack === "string") {
              console.warn(`[stripe-webhook:invoice.paid] stack=${error.stack}`);
            }
          }
        })();
      } catch (error) {
        console.warn(
          `[stripe-webhook:invoice.paid] outer findFirst/send try/catch swallow: message=${error instanceof Error ? error.message : String(error)}`,
        );
      }

      return { ok: true as const, message: "Invoice paid processed." };
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

      let syncInterval: "MONTHLY" | "ANNUAL" | undefined;
      let syncPriceAmount: number | undefined;
      const firstItem = subscription.items?.data?.[0];
      const price = firstItem?.price;
      if (price) {
        const recurring = (price as Stripe.Price).recurring;
        const interval = recurring?.interval;
        syncInterval = interval === "year" ? "ANNUAL" : "MONTHLY";
        if (typeof price.unit_amount === "number") {
          syncPriceAmount = price.unit_amount / 100;
        }
      }

      const mappedStatus = mapStripeSubscriptionStatus(subscription);
      const now = new Date();
      let cancellationRequestedAt: Date | undefined;
      let cancellationDate: Date | undefined;
      let cancellationStatus: "NONE" | "PENDING_AT_PERIOD_END" | "CANCELED" = "NONE";
      if (subscription.cancel_at_period_end && (mappedStatus === "ACTIVE" || mappedStatus === "CANCELED")) {
        cancellationStatus = "PENDING_AT_PERIOD_END";
        cancellationRequestedAt = now;
        cancellationDate = currentPeriodEndsAt ?? undefined;
      } else if (mappedStatus === "CANCELED") {
        cancellationStatus = "CANCELED";
        if (subscription.ended_at) {
          cancellationDate = new Date(subscription.ended_at * 1000);
        }
      }

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
          subscriptionStatus: mappedStatus,
          billingCurrency: billingCurrencyFromStripe,
          currentPeriodEndsAt: currentPeriodEndsAt ?? undefined,
          nextRenewalDate: currentPeriodEndsAt ?? undefined,
          billingInterval: syncInterval ?? undefined,
          subscriptionPriceAmount: typeof syncPriceAmount === "number"
            ? syncPriceAmount
            : undefined,
          cancellationStatus,
          cancellationRequestedAt,
          cancellationDate,
        },
      });

      return { ok: true as const, message: "Subscription status synced." };
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = typeof invoice.customer === "string" ? invoice.customer : null;
      const amountDue = typeof invoice.amount_due === "number" ? invoice.amount_due / 100 : 0;
      const currency = (invoice.currency ?? "usd").toUpperCase();
      const attemptCount =
        typeof invoice.attempt_count === "number" ? invoice.attempt_count : 1;
      const dueDateLabel = invoice.due_date
        ? new Date(invoice.due_date * 1000).toLocaleDateString(undefined, {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : undefined;

      await prisma.subscriber.updateMany({
        where: customerId ? { stripeCustomerId: customerId } : { id: "__missing__" },
        data: {
          subscriptionStatus: "PAST_DUE",
        },
      });

      if (prisma && customerId) {
        try {
          const subscriber = await prisma.subscriber.findFirst({
            where: { stripeCustomerId: customerId },
            select: { id: true, email: true, unsubscribedAt: true },
          });
          if (subscriber && subscriber.email && !subscriber.unsubscribedAt) {
            await sendInvoicePaymentFailedEmail({
              subscriberId: subscriber.id,
              subscriberEmail: subscriber.email,
              amountDue,
              currency,
              dueDateLabel,
              attemptCount,
            }).catch(() => null);
          }
        } catch {
          // best-effort only
        }
      }

      return { ok: true as const, message: "Invoice failure synced." };
    }

    default:
      return { ok: true as const, message: `Ignored event ${event.type}.` };
  }
}
