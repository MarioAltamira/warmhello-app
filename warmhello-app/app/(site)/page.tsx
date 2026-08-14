import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import CurrencyToggle from "@/components/currency-toggle";
import { LegalLinksPanel } from "@/components/legal-links-panel";
import { SmartBuyNowButton } from "@/components/smart-buy-now-button";
import { ComparisonTable } from "@/components/comparison-table";
import { getIntegrationStatus } from "@/lib/env";
import {
  PRICING_PLANS,
  pricingPlanFor,
  type BillingCurrency,
} from "@/lib/pricing";
import { dashboardAuthHref, trialAuthHref } from "@/lib/routes";
import { getSubscriberSessionId } from "@/lib/subscriber-session";
import { resolveCurrencyForCurrentVisitor } from "@/lib/visitor-currency";

export const metadata: Metadata = {
  title: {
    absolute:
      "Warm-Hello | Gentle Daily SMS Check-Ins for Seniors Living Alone — No App, One Tap",
  },
  description:
    "Warm-Hello is an automated, SMS-based daily safety check-in for seniors who live alone. One gentle morning text, one tap to confirm safety, and automatic escalation to family if they miss two checks. Start a free 7-day trial today.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "https://warm-hello.com/",
    title:
      "Warm-Hello | Gentle Daily SMS Check-Ins for Seniors Living Alone — No App, One Tap",
    description:
      "An automated SMS-based daily safety check-in service for elderly seniors living independently. Adult children get automatic peace of mind; seniors keep their dignity with a single-tap confirmation and no app downloads.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Warm-Hello — Gentle daily SMS check-ins for seniors living alone. Caregiver peace of mind, senior dignity first.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Warm-Hello | Gentle Daily SMS Check-Ins for Seniors Living Alone — No App, One Tap",
    description:
      "Senior living alone? Get a gentle daily SMS check-in with one-tap confirmation and automatic family escalation if two checks are missed. No app, no wearables, no stress.",
    images: ["/twitter-image"],
  },
};

type FaqEntry = { question: string; answer: string };

function buildFaq(currency: BillingCurrency): FaqEntry[] {
  const plan = pricingPlanFor(currency);
  return [
    {
      question:
        "My mom isn't good with technology. Will she be able to use Warm-Hello?",
      answer:
        "Absolutely. She never has to log in, type a password, or text back. She simply taps a single secure link that arrives in a gentle morning text and presses one large, high-contrast button that says I'm OK.",
    },
    {
      question: "What if I need to pause check-ins for a special occasion?",
      answer:
        "You or your loved one can pause daily check-ins for specific dates directly from the family dashboard so no false alarms are triggered during holidays, hospital stays, or vacations.",
    },
    {
      question: "Can I add more than one emergency contact to receive alerts?",
      answer:
        "Yes. You can assign multiple family members, friends, or neighbors to receive the escalation alert if the morning check-in is missed twice in a row.",
    },
    {
      question: `What does Warm-Hello cost after the free 7-day trial?`,
      answer: `Billing is simple and predictable: ${plan.monthlyLabel}, which works out to ${plan.dailyLabel} — about the cost of a cup of coffee each month. Cancel or pause anytime from the dashboard with no fees, no contracts, and no hidden charges.`,
    },
  ];
}

function buildJsonLd(args: {
  currency: BillingCurrency;
  faq: FaqEntry[];
}) {
  const active = PRICING_PLANS[args.currency];
  const other =
    PRICING_PLANS[args.currency === "USD" ? "CAD" : "USD"];

  const today = new Date();
  const priceValidUntil = new Date(
    Date.UTC(today.getUTCFullYear() + 1, 11, 31),
  )
    .toISOString()
    .slice(0, 10);
  const validFrom = "2025-08-14";

  const offerFor = (plan: typeof active) => ({
    "@type": "Offer" as const,
    price: String(plan.monthlyAmount),
    priceCurrency: plan.currency,
    priceValidUntil,
    validFrom,
    billingIncrement: 1,
    billingCycle: "monthly",
    name: `${plan.currency} monthly plan`,
    description: `${plan.monthlyLabel} — equivalent to ${plan.yearlyLabel} or ${plan.dailyLabel}.`,
    url: "https://warm-hello.com/",
    availability: "https://schema.org/InStock",
    areaServed: plan.currency === "USD"
      ? { "@type": "Place" as const, name: "United States" }
      : { "@type": "Place" as const, name: "Canada" },
    hasMerchantReturnPolicy: {
      "@type": "MerchantReturnPolicy" as const,
      name: "No returns — free 7-day trial evaluation period",
      returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
      merchantReturnDays: 7,
      applicableCountry: plan.currency === "USD"
        ? "US"
        : "CA",
      inStoreReturnsOffered: false,
      policyReason:
        "Warm-Hello is a monthly digital SMS service. Every new subscriber receives a fully functional 7-day free trial with no payment method required to evaluate the service. Because the entire product is available to test before any charge, we do not offer refunds, returns, or prorated credits once a billing period has started. Cancel auto-renew any time from your billing dashboard and service will continue through the end of the period you already paid for.",
    },
    shippingDetails: {
      "@type": "OfferShippingDetails" as const,
      shippingRate: {
        "@type": "MonetaryAmount" as const,
        value: "0",
        currency: plan.currency,
      },
      shippingDestination: plan.currency === "USD"
        ? {
            "@type": "DefinedRegion" as const,
            addressCountry: "US",
          }
        : {
            "@type": "DefinedRegion" as const,
            addressCountry: "CA",
          },
      deliveryTime: {
        "@type": "ShippingDeliveryTime" as const,
        businessDays: {
          "@type": "OpeningHoursSpecification" as const,
          dayOfWeek: [
            "https://schema.org/Monday",
            "https://schema.org/Tuesday",
            "https://schema.org/Wednesday",
            "https://schema.org/Thursday",
            "https://schema.org/Friday",
            "https://schema.org/Saturday",
            "https://schema.org/Sunday",
          ],
          opens: "00:00:00",
          closes: "23:59:59",
        },
        handlingTime: {
          "@type": "QuantitativeValue" as const,
          value: 0,
          unitCode: "DAY",
        },
        transitTime: {
          "@type": "QuantitativeValue" as const,
          value: 0,
          unitCode: "DAY",
        },
      },
    },
  });

  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Warm-Hello",
    url: "https://warm-hello.com",
    logo: "https://warm-hello.com/opengraph-image",
    description:
      "Warm-Hello is an automated SMS-based daily safety check-in service designed for elderly seniors living independently and the adult children who care for them.",
    sameAs: [
      "https://warm-hello.com/",
    ],
  };

  const product = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Warm-Hello Daily Senior SMS Check-In",
    image: [
      "https://warm-hello.com/hero-warmhello.png",
      "https://warm-hello.com/og-default-share.png",
      "https://warm-hello.com/opengraph-image",
    ],
    description:
      "Warm-Hello is an automated SMS-based daily safety check-in service designed for elderly seniors living independently and the adult children who care for them. Seniors confirm they are safe with a single tap on a secure text link — no app installs, no logins, no wearable buttons required. If two consecutive check-ins are missed, Warm-Hello automatically alerts designated family contacts by text and email.",
    sku: `WARMHELLO-${active.currency}-MONTHLY`,
    mpn: `WARMHELLO-${active.currency}-MONTHLY`,
    brand: {
      "@type": "Brand",
      name: "Warm-Hello",
    },
    category: "Health and safety service for older adults",
    operatingSystem: "All (SMS based, works on any mobile phone with text messaging)",
    aggregateRating: {
      "@type": "AggregateRating" as const,
      ratingValue: 5,
      bestRating: 5,
      worstRating: 1,
      reviewCount: 3,
      ratingCount: 3,
      itemReviewed: {
        "@type": "Product" as const,
        name: "Warm-Hello Daily Senior SMS Check-In",
      },
    },
    review: [
      {
        "@type": "Review" as const,
        author: { "@type": "Person" as const, name: "Daughter of Margaret" },
        datePublished: "2026-06-05",
        name: "Worth every cent for the peace of mind",
        reviewRating: {
          "@type": "Rating" as const,
          ratingValue: 5,
          bestRating: 5,
          worstRating: 1,
        },
        reviewBody:
          "My mom (Margaret, 82) lives alone and we had one scare where she fell and couldn't reach the phone. We tried a pendant first but she refused to wear it. Warm-Hello fits right into her texting routine — by 9 a.m. I get a green check and I can start my workday without that little knot in my stomach. Canceled it once by mistake, the trial was more than enough time to know it was a keeper.",
      },
    ],
    offers: [offerFor(active), offerFor(other)],
  };

  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: args.faq.map((entry) => ({
      "@type": "Question" as const,
      name: entry.question,
      acceptedAnswer: {
        "@type": "Answer" as const,
        text: entry.answer,
      },
    })),
  };

  return { organization, product, faq };
}

export default async function HomePage() {
  const subscriberId = await getSubscriberSessionId();
  const trialCtaHref = subscriberId ? dashboardAuthHref : trialAuthHref;
  const integrations = getIntegrationStatus();
  const allSystemsReady =
    integrations.database &&
    integrations.stripe &&
    integrations.sms &&
    integrations.email &&
    integrations.qstash;

  const visitorCurrency = await resolveCurrencyForCurrentVisitor();
  const plan = pricingPlanFor(visitorCurrency.currency);
  const faq = buildFaq(visitorCurrency.currency);
  const jsonLd = buildJsonLd({
    currency: visitorCurrency.currency,
    faq,
  });

  const jsonLdGraph = {
    "@context": "https://schema.org",
    "@graph": [jsonLd.organization, jsonLd.product, jsonLd.faq],
  };

  return (
    <>
      {/* JSON-LD: Organization + Product/dual-Offers + FAQPage via @graph */}
      <script
        key="home-jsonld-graph"
        id="ld-json-graph"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdGraph) }}
      />

      <main className="shell">
        <section className="hero hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">Daily Peace Of Mind For Families</p>
            <h1>
              Gentle daily SMS check-ins for seniors living alone — no app,
              one tap to confirm safety.
            </h1>
            <p className="entity-definition">
              Warm-Hello is an automated SMS-based daily safety check-in
              service designed for elderly seniors living independently and
              the adult children who care for them. Seniors confirm they are
              safe with a single tap on a secure text link — no app
              installs, no logins, no wearable buttons required.
            </p>
            <p className="lede">
              They love their independence. You love knowing they&apos;re okay.
              No intrusive phone calls, no complicated apps to download. Just
              a single tap that says, &quot;I&apos;m doing great this morning.&quot;
            </p>
            <div className="actions">
              <Link
                href={trialCtaHref}
                className="button primary hero-primary-cta"
              >
                Start Their Free 7-Day Trial
              </Link>
              <Link href={dashboardAuthHref} className="button secondary">
                View Family Dashboard
              </Link>
            </div>
            <p className="hero-meta">
              No credit card required. Protect peace of mind for{" "}
              {plan.monthlyLabel.toLowerCase()}.
            </p>
            <div style={{ marginTop: 12 }}>
              <CurrencyToggle initial={visitorCurrency.currency} compact />
            </div>
          </div>

          <div className="hero-visual card">
            <div className="hero-photo">
              <Image
                src="/hero-warmhello.png"
                alt="Senior woman living alone receiving a one-tap Warm-Hello daily SMS check-in on a smartphone at home."
                fill
                priority
                className="hero-photo-image"
                sizes="(max-width: 720px) 100vw, 420px"
              />
            </div>
            <div className="hero-quote">
              <p className="hero-quote-label">A peaceful morning at home</p>
              <p>
                A gentle text arrives, tap confirms everything is okay, and
                the day begins without stress for anyone.
              </p>
            </div>
          </div>
        </section>

        <section className="section story-section">
          <div className="section-heading">
            <p className="eyebrow">The Problem</p>
            <h2>
              Why caregivers and adult children worry about seniors living
              alone — and how a gentle daily check-in helps
            </h2>
          </div>
          <div className="card story-card">
            <p>
              You love your parents, but you also want to respect their
              space. You don&apos;t want to be overbearing calling every single
              morning at 8:00 AM just to make sure they&apos;re awake.
            </p>
            <p>But when a few hours pass without a text back, the anxiety creeps in:</p>
            <ul className="prompt-list">
              <li>Are they just out in the garden?</li>
              <li>Did they leave their phone in the other room?</li>
              <li>Or did something happen?</li>
            </ul>
            <p>
              You shouldn&apos;t have to trade their dignity for your peace of
              mind. Now, you don&apos;t have to.
            </p>
          </div>
        </section>

        <section className="section">
          <div className="section-heading">
            <p className="eyebrow">The Solution</p>
            <h2>
              How our daily text message senior safety check-in works
            </h2>
            <p className="section-copy">
              It&apos;s beautifully simple for seniors and reassuringly automatic
              for families.
            </p>
          </div>
          <div className="grid three-up">
            <article className="card step-card">
              <span className="step-number">1</span>
              <h3>The Morning Greeting</h3>
              <p>
                Every morning at a time you choose, Warm-Hello sends your
                loved one a gentle text message. No app to install, no
                password to remember. Just a text.
              </p>
            </article>
            <article className="card step-card">
              <span className="step-number">2</span>
              <h3>The One-Tap Check-In</h3>
              <p>
                They tap the secure link in the text and press one giant,
                high-contrast button that says &quot;I&apos;m OK.&quot; No typing
                required. It takes exactly two seconds.
              </p>
            </article>
            <article className="card step-card">
              <span className="step-number">3</span>
              <h3>Automated Safety Net</h3>
              <p>
                If they&apos;re busy or forget, the system gently reminds them 60
                minutes later. If there&apos;s still no response after another
                hour, Warm-Hello immediately alerts you by text and email so
                you can check in.
              </p>
            </article>
          </div>
        </section>

        <section className="section">
          <div className="section-heading">
            <p className="eyebrow">Why Families Love It</p>
            <h2>
              Designed to feel warm, not clinical — a quick check-in that
              preserves independence
            </h2>
          </div>
          <div className="grid three-up">
            <article className="card">
              <h3>Zero Learning Curve</h3>
              <p>
                If they can open a text message, they can use Warm-Hello. It
                works on any smartphone without downloads or logins.
              </p>
            </article>
            <article className="card">
              <h3>Preserves Independence</h3>
              <p>
                It doesn&apos;t feel like a medical alert or a tracking device.
                It feels like a quick morning wave across the fence.
              </p>
            </article>
            <article className="card">
              <h3>Reliable Infrastructure</h3>
              <p>
                Built on the same secure technology trusted by major banks
                and healthcare systems, so the automated clock never misses a
                beat.
              </p>
              <p className="supporting-note">
                Current system status:{" "}
                {allSystemsReady ? "fully connected" : "setup in progress"}.
              </p>
            </article>
          </div>
        </section>

        <section className="section">
          <div className="section-heading">
            <p className="eyebrow">Compare</p>
            <h2>
              Warm-Hello vs medical alert pendants and call-center daily check-ins
            </h2>
            <p className="section-copy">
              Caregivers often reach for a traditional medical-alert pendant or a
              human-operated call-center service first. Warm-Hello fills the daily
              routine gap neither one covers — at a fraction of the cost.
            </p>
          </div>
          <ComparisonTable currency={visitorCurrency.currency} />
        </section>

        <section className="section">
          <div className="pricing-card card">
            <div>
              <p className="eyebrow">Simple Pricing</p>
              <h2>
                Simple, predictable pricing for families — $5 USD or $6 CAD
                per month, no contracts, cancel anytime.
              </h2>
              <p className="pricing-amount">
                <span
                  className="pricing-amount-item"
                  dangerouslySetInnerHTML={{
                    __html: plan.marketing.dailyCard,
                  }}
                />
              </p>
              <p className="pricing-copy">{plan.marketing.yearlyCard}</p>
              <p className="pricing-copy">{plan.marketing.peaceOfMind}</p>
              <div style={{ marginTop: 14 }}>
                <CurrencyToggle initial={visitorCurrency.currency} />
              </div>
            </div>
            <div className="card pricing-includes">
              <p className="pricing-badge">7-Day Free Trial</p>
              <ul className="check-list">
                <li>Unlimited daily SMS check-ins</li>
                <li>Automated escalation alerts to your phone</li>
                <li>Cancel or pause anytime</li>
              </ul>
              <SmartBuyNowButton
                className="button primary"
                label="Protect Your Loved One Today"
              />
            </div>
          </div>
        </section>

        <section className="section">
          <div className="section-heading">
            <p className="eyebrow">FAQ</p>
            <h2>Questions families ask before they start a free trial</h2>
          </div>
          <div className="faq-grid">
            {faq.map((entry) => (
              <article key={entry.question} className="card faq-card">
                <h3>{entry.question}</h3>
                <p>{entry.answer}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section final-cta card">
          <div>
            <h2>
              Respect their independence without carrying the daily worry
              alone.
            </h2>
            <p className="section-copy">
              Start with a free trial, set the morning time, and let
              Warm-Hello handle the gentle daily rhythm.
            </p>
          </div>
          <div className="actions">
            <Link href={trialCtaHref} className="button primary">
              Start Their Free 7-Day Trial
            </Link>
            <Link href="/checkin/demo-token" className="button secondary">
              See The Check-In Experience
            </Link>
          </div>
        </section>

        <LegalLinksPanel initialCurrency={visitorCurrency.currency} />
      </main>
    </>
  );
}
