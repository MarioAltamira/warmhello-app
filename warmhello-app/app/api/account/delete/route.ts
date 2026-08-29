import { NextResponse } from "next/server";
import {
  getSubscriberSession,
  subscriberSessionBootCookieName,
  subscriberSessionCookieName,
  subscriberSessionCookieOptions,
  subscriberSessionPresenceCookieName,
  subscriberSessionPresenceCookieOptions,
} from "@/lib/subscriber-session";
import { prisma } from "@/lib/prisma";
import { getStripeClient } from "@/lib/stripe";
import { sendAccountDeletionConfirmationEmail } from "@/lib/trial-emails";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const { subscriberId, sessionExpired } = await getSubscriberSession();
  if (!subscriberId || sessionExpired) {
    return NextResponse.json(
      { ok: false, message: "Not signed in." },
      { status: 401 },
    );
  }

  if (!prisma) {
    return NextResponse.json(
      { ok: false, message: "Database is not configured yet." },
      { status: 500 },
    );
  }
  const db = prisma;

  let body: { confirmEmail?: string } = {};
  try {
    body = (await request.json()) as { confirmEmail?: string };
  } catch {
    body = {};
  }

  try {
    const subscriber = await prisma.subscriber.findUnique({
      where: { id: subscriberId },
      select: {
        email: true,
        fullName: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        unsubscribedAt: true,
      },
    });
    if (!subscriber) {
      return NextResponse.json(
        { ok: false, message: "Subscriber account was not found." },
        { status: 404 },
      );
    }

    if (
      body.confirmEmail &&
      body.confirmEmail.trim().toLowerCase() !== subscriber.email.trim().toLowerCase()
    ) {
      return NextResponse.json(
        { ok: false, message: "Email confirmation does not match this account." },
        { status: 400 },
      );
    }

    try {
      const stripe = getStripeClient();
      if (stripe && subscriber.stripeSubscriptionId) {
        await stripe.subscriptions
          .cancel(subscriber.stripeSubscriptionId, {
            cancellation_details: {
              comment: "Account deleted by subscriber via Dashboard Settings.",
            },
          })
          .catch(() => null);
      }
    } catch {
      // Best-effort: we continue deletion regardless of Stripe result
    }

    const now = new Date();
    const deletionEffectiveLabel = now.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const originalEmail = subscriber.email;
    const originalFullName = subscriber.fullName;

    try {
      await sendAccountDeletionConfirmationEmail({
        subscriberEmail: originalEmail,
        subscriberFullName: originalFullName,
        effectiveDateLabel: deletionEffectiveLabel,
      }).catch(() => null);
    } catch {
      // best-effort only
    }

    await prisma.$transaction(async (tx) => {
      const seniors = await tx.senior.findMany({
        where: { subscriberId },
        select: { id: true, phoneNumber: true },
      });
      const seniorIds = seniors.map((s) => s.id);

      await tx.checkIn.deleteMany({ where: { subscriberId } });
      await tx.contact.deleteMany({ where: { seniorId: { in: seniorIds } } });
      await tx.smsLog.deleteMany({
        where: { OR: [{ subscriberId }, { seniorId: { in: seniorIds } }] },
      });
      await tx.senior.deleteMany({ where: { subscriberId } });
      await tx.alertJob.deleteMany({});
      await tx.checkIn.deleteMany({ where: { subscriberId } });

      const orphanShortLinks = await db.shortLink
        .findMany({
          where: {
            checkIn: null,
          },
          select: { id: true },
        })
        .catch(() => [] as Array<{ id: string }>);
      if (orphanShortLinks.length > 0) {
        await tx.shortLink
          .deleteMany({
            where: { id: { in: orphanShortLinks.map((s) => s.id) } },
          })
          .catch(() => null);
      }

      const phoneTokens = seniors
        .map((s) => s.phoneNumber.replace(/\D/g, "").slice(-4))
        .filter((s) => s.length === 4);
      const suffixTombstone = phoneTokens[0] ?? `${now.getTime()}`.slice(-4);

      await tx.subscriber.update({
        where: { id: subscriberId },
        data: {
          email: `deleted-${subscriberId}-${suffixTombstone}@invalid.warm-hello.local`,
          fullName: `Deleted Subscriber ${suffixTombstone}`,
          phoneNumber: `+00000000000${suffixTombstone}`,
          stripeCustomerId: null,
          stripeSubscriptionId: null,
          subscriptionStatus: "CANCELED",
          tosAcceptedAt: null,
          tosVersion: null,
          caregiverSeniorConsentAckAt: null,
          dashboardDisclaimerDismissedAt: null,
          currentPeriodEndsAt: null,
          unsubscribedAt: now,
        },
      });
    });

    const response = NextResponse.json({
      ok: true,
      redirect:
        "/auth?mode=login&source=account-deleted&message=Your%20account%20has%20been%20deleted.",
    });
    response.cookies.set(subscriberSessionCookieName, "", {
      ...subscriberSessionCookieOptions,
      maxAge: 0,
    });
    response.cookies.set(subscriberSessionBootCookieName, "", {
      ...subscriberSessionCookieOptions,
      maxAge: 0,
    });
    response.cookies.set(subscriberSessionPresenceCookieName, "", {
      ...subscriberSessionPresenceCookieOptions,
      maxAge: 0,
    });

    return response;
  } catch {
    return NextResponse.json(
      { ok: false, message: "Could not delete your account right now." },
      { status: 500 },
    );
  }
}
