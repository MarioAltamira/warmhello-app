import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import CurrencyToggle from "@/components/currency-toggle";
import { SmartBuyNowButton } from "@/components/smart-buy-now-button";
import { LegalLinksPanel } from "@/components/legal-links-panel";
import { ComparisonTable } from "@/components/comparison-table";
import {
  pricingPlanFor,
  PRICING_PLANS,
  type BillingCurrency,
} from "@/lib/pricing";
import { resolveCurrencyForCurrentVisitor } from "@/lib/visitor-currency";
import { dashboardAuthHref, trialAuthHref } from "@/lib/routes";
import { getSubscriberSessionId } from "@/lib/subscriber-session";

export const metadata: Metadata = {
  title: {
    absolute:
      "Warm-Hello — Better Alternatives to Medical Alert Systems for Seniors Living Alone",
  },
  description:
    "Compare Warm-Hello vs Life Alert style medical alert pendants and call-center daily check-ins. Gentle one-tap SMS check-ins for seniors — no wearables, no call centers, no contracts. USD $5/month or CAD $6/month, cancel anytime. Start a free 7-day trial.",
  alternates: {
    canonical: "/alternatives-to-medical-alert-systems",
  },
  keywords: [
    "alternatives to medical alert systems",
    "better than life alert for elderly parents",
    "senior check in service without pendant",
    "daily check in alternative to medical alert",
    "no wearable senior safety check in",
    "alternatives to call center check-ins for seniors",
    "affordable peace of mind service for elderly living alone",
  ],
  openGraph: {
    type: "website",
    url: "https://warm-hello.com/alternatives-to-medical-alert-systems",
    title:
      "Warm-Hello — Better Alternatives to Medical Alert Systems for Seniors Living Alone",
    description:
      "Compare Warm-Hello vs medical-alert pendants and call-center check-ins. Gentle daily SMS check-ins for seniors living alone — no wearables, no operators, no contracts, USD $5 or CAD $6/month.",
    images: [
      {
        url: `/opengraph-image?title=${encodeURIComponent("Better Alternatives to Medical Alert Systems for Seniors Living Alone")}&subtitle=${encodeURIComponent("Gentle daily SMS check-ins: no wearables, no call-center operators, no contracts. USD $5 or CAD $6/month.")}`,
        width: 1200,
        height: 630,
        alt: "Warm-Hello alternatives to medical alert systems — compare Warm-Hello vs Life Alert style pendants and call-center check-ins.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@warmhello",
    creator: "@warmhello",
    title:
      "Warm-Hello — Better Alternatives to Medical Alert Systems (2026 Compare)",
    description:
      "Seniors hate pendant buttons. Adult children hate call centers. Compare Warm-Hello (SMS one-tap daily check-in) against medical-alert pendants and call-center operators, with transparent USD/CAD pricing.",
    images: [
      `/twitter-image?title=${encodeURIComponent("Better Alternatives to Medical Alert Systems for Seniors Living Alone")}`,
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const FAQ: { q: string; a: string }[] = [
  {
    q: "Is Warm-Hello a replacement for a medical alert button like Life Alert?",
    a: "Warm-Hello is designed for daily routine reassurance — the morning check-in that says, 'Everything is fine over here.' It does not dispatch EMTs or replace 911. If a fall or medical emergency happens, seniors should still call 911 or use a medical-alert pendant. Think of Warm-Hello as the automated, warm daily check-in you wish you had time for, not the emergency response button.",
  },
  {
    q: "My dad refuses to wear a medical alert pendant. Will he use Warm-Hello?",
    a: "Yes. The #1 reason caregivers reach out is exactly this: 'Mom won't wear the button.' With Warm-Hello there's nothing to wear, nothing to charge, no passwords to forget. Every morning he taps a link in a text then a large, high-contrast 'I'm OK' button on a secure web page — that's it. No app, no call center, no strangers asking questions.",
  },
  {
    q: "What happens if the morning check-in is missed twice?",
    a: "If there's no response after the first check-in, Warm-Hello sends a gentle reminder text 60 minutes later. If the reminder also goes unanswered, Warm-Hello immediately texts and emails the family emergency contacts you've listed in the dashboard — siblings, neighbors, whoever needs to know. You decide the alert chain and can edit it anytime.",
  },
  {
    q: "How does the cost compare to a traditional medical alert system?",
    a: "Medical alert systems typically cost $30–$50 per month plus equipment fees and lock you into 1–3 year contracts. Warm-Hello is USD $5/month (about $0.16/day) for United States families or CAD $6/month (about $0.20/day) for Canadian families. No equipment, no contracts, cancel or pause anytime with one click.",
  },
];

export default async function AlternativesLandingPage() {
  const subscriberId = await getSubscriberSessionId();
  const trialCtaHref = subscriberId ? dashboardAuthHref : trialAuthHref;
  const visitorCurrency = await resolveCurrencyForCurrentVisitor();
  const plan = pricingPlanFor(visitorCurrency.currency);
  const other =
    visitorCurrency.currency === "USD" ? PRICING_PLANS.CAD : PRICING_PLANS.USD;

  const jsonLdFaq = {
    "@context": "https://schema.org",
    "@type": "FAQPage" as const,
    mainEntity: FAQ.map((entry) => ({
      "@type": "Question" as const,
      name: entry.q,
      acceptedAnswer: {
        "@type": "Answer" as const,
        text: entry.a,
      },
    })),
  };

  const today = new Date();
  const priceValidUntil = new Date(
    Date.UTC(today.getUTCFullYear() + 1, 11, 31),
  )
    .toISOString()
    .slice(0, 10);

  const jsonLdProduct = {
    "@context": "https://schema.org",
    "@type": "Product" as const,
    name: "Warm-Hello — Alternative to Medical Alert Systems",
    image: [
      "https://warm-hello.com/hero-warmhello.png",
      "https://warm-hello.com/opengraph-image",
    ],
    description:
      "Warm-Hello is a no-wearable, no-call-center alternative to medical alert systems for seniors living alone. It sends a daily SMS check-in; the senior taps one secure link then one large 'I'm OK' button. If two checks are missed, the family is alerted automatically by text and email.",
    sku: "WARMHELLO-ALTERNATIVE-PERS",
    mpn: "WARMHELLO-ALTERNATIVE-PERS",
    brand: { "@type": "Brand" as const, name: "Warm-Hello" },
    category: "Alternative to personal emergency response systems (PERS)",
    operatingSystem:
      "All (SMS based, works on any mobile phone with text messaging)",
    offers: [
      {
        "@type": "Offer" as const,
        price: "5",
        priceCurrency: "USD",
        priceValidUntil,
        billingIncrement: 1,
        billingCycle: "monthly",
        name: "USD monthly plan",
        description:
          "USD 5.00 per month — equivalent to USD 60.00 per year or USD 0.16 per day.",
        url: "https://warm-hello.com/alternatives-to-medical-alert-systems",
        availability: "https://schema.org/InStock",
        areaServed: { "@type": "Place" as const, name: "United States" },
      },
      {
        "@type": "Offer" as const,
        price: "6",
        priceCurrency: "CAD",
        priceValidUntil,
        billingIncrement: 1,
        billingCycle: "monthly",
        name: "CAD monthly plan",
        description:
          "CAD 6.00 per month — equivalent to CAD 72.00 per year or CAD 0.20 per day.",
        url: "https://warm-hello.com/alternatives-to-medical-alert-systems",
        availability: "https://schema.org/InStock",
        areaServed: { "@type": "Place" as const, name: "Canada" },
      },
    ],
  };

  const jsonLdOrg = {
    "@context": "https://schema.org",
    "@type": "Organization" as const,
    name: "Warm-Hello",
    url: "https://warm-hello.com",
    logo: "https://warm-hello.com/opengraph-image",
    description:
      "Warm-Hello is an automated SMS-based daily safety check-in service designed for elderly seniors living independently and the adult children who care for them. It is a wearable-free alternative to traditional medical alert systems and call-center daily check-in services.",
    sameAs: ["https://warm-hello.com/"],
  };

  const jsonLdGraph = {
    "@context": "https://schema.org",
    "@graph": [jsonLdOrg, jsonLdProduct, jsonLdFaq],
  };

  return (
    <>
      <script
        key="alt-jsonld-graph"
        id="ld-json-graph"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdGraph) }}
      />

      <main className="shell">
        <section className="hero hero-grid hero-grid-wide">
          <div className="hero-copy">
            <p className="eyebrow">
              Alternatives to Medical Alert Systems · 2026 Guide
            </p>
            <h1>
              Your parent won&apos;t wear the medical alert button. Warm-Hello
              is the kinder, gentler alternative.
            </h1>
            <p className="entity-definition">
              Warm-Hello is a no-wearable, no-call-center alternative to
              traditional medical-alert pendants and operator-run check-in
              services for seniors living alone. Instead of forcing your mom or
              dad to wear a medical-style device, Warm-Hello texts them a
              gentle morning greeting, they tap a single secure link, press one
              large &ldquo;I&apos;m OK&rdquo; button, and everyone breathes
              easier. If two checks are missed in a row, the family is alerted
              immediately by SMS and email.
            </p>
            <p className="lede">
              Most medical-alert pendants collect dust in a drawer within 60
              days. Most call-center check-ins feel like a scripted sales call.
              Warm-Hello does the quiet daily job that both of those options
              miss — and it costs about the same as a coffee a month.
            </p>
            <div className="actions">
              <Link href={trialCtaHref} className="button primary hero-primary-cta">
                Start Their Free 7-Day Trial
              </Link>
              <SmartBuyNowButton
                className="button buy-now-button"
                label="See Pricing & Buy Now"
              />
            </div>
            <p className="hero-meta">
              No wearable required. No call center. No contracts. From{" "}
              {plan.dailyLabel.toLowerCase()}.
            </p>
            <div style={{ marginTop: 12 }}>
              <CurrencyToggle initial={visitorCurrency.currency} compact />
            </div>
          </div>

          <div className="hero-visual card">
            <div className="hero-photo">
              <Image
                src="/hero-warmhello.png"
                alt="Senior woman using the Warm-Hello one-tap SMS check-in service on her phone at home, as an alternative to wearing a medical alert pendant."
                fill
                priority
                className="hero-photo-image"
                sizes="(max-width: 720px) 100vw, 420px"
              />
            </div>
            <div className="hero-quote">
              <p className="hero-quote-label">Why families switch</p>
              <p>
                &ldquo;Mom refused the Life Alert necklace within 48 hours.
                Warm-Hello she uses every morning without reminding.&rdquo;
              </p>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="section-heading">
            <p className="eyebrow">Side-by-side</p>
            <h2>
              Compare Warm-Hello against medical-alert pendants and call-center
              daily check-ins
            </h2>
            <p className="section-copy">
              This table shows exactly where each option shines. Traditional
              PERS pendants handle the emergency-but-rare fall button press.
              Call centers can read a script every morning. Warm-Hello does the
              routine daily reassurance that makes the biggest difference for
              caregivers — with zero friction for the senior.
            </p>
          </div>
          <ComparisonTable currency={visitorCurrency.currency} />
        </section>

        <section className="section">
          <div className="section-heading">
            <p className="eyebrow">Why Warm-Hello wins</p>
            <h2>
              4 reasons caregivers choose Warm-Hello instead of a medical alert
              system
            </h2>
            <p className="section-copy">
              Every medical-alert pendant and call-center service we reviewed
              has the same three friction points for seniors. Warm-Hello was
              built specifically to remove them.
            </p>
          </div>

          <div className="grid three-up" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
            <article className="card">
              <h3>1. Nothing to wear, nothing to charge</h3>
              <p>
                Medical alert pendants require the senior to wear a device 24/7,
                remember to charge it every night, and accept that it signals
                to the world &ldquo;I&apos;m old and frail.&rdquo; For a lot of
                independent parents, that&apos;s a dealbreaker. Warm-Hello works
                on the phone they already carry, with zero new hardware.
              </p>
            </article>

            <article className="card">
              <h3>2. No strangers reading scripts</h3>
              <p>
                Human-operated call centers hire operators, and every morning
                your parent gets a phone call from a stranger following a
                checklist. A lot of seniors — especially ones who grew up with
                polite caller etiquette — feel forced to make small talk they
                don&apos;t want. Warm-Hello is impersonal in the best way: a
                two-tap text, no conversation required.
              </p>
            </article>

            <article className="card">
              <h3>3. Dignity first, reassurance close behind</h3>
              <p>
                There is no &ldquo;alert button&rdquo; branding on Warm-Hello.
                There is no dispatch center, no nurse on the line, no medical
                vibe. The morning message is a gentle wave from a family app —
                which means the senior is more likely to actually use it, and
                you are more likely to get that 10-second confirmation every
                single day.
              </p>
            </article>

            <article className="card">
              <h3>4. {plan.currency} {plan.monthlyAmount}/month with no lock-in</h3>
              <p>
                Medical-alert companies sell $30–$50/month plans, equipment
                fees, installation fees, and 1–3 year contracts. Getting out
                early is a nightmare. Warm-Hello is flat-rate: {plan.currency}{" "}
                {plan.monthlyAmount} per month for your family (or{" "}
                {other.currency} {other.monthlyAmount} for{" "}
                {other.currency === "USD" ? "US" : "Canadian"} customers),
                billed monthly. Cancel or pause with a single click in the
                dashboard. No fees, no sales calls, no pressure.
              </p>
            </article>
          </div>
        </section>

        <section className="section">
          <div className="section-heading">
            <p className="eyebrow">When to pick what</p>
            <h2>
              What to use Warm-Hello for — and when a real medical alert still
              makes sense
            </h2>
            <p className="section-copy">
              We&apos;re not here to replace 911. Here is the honest framing.
            </p>
          </div>

          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
            <article className="card">
              <h3>✅ Use Warm-Hello for:</h3>
              <ul className="check-list">
                <li>Daily routine peace-of-mind check-ins</li>
                <li>The morning &ldquo;did mom wake up?&rdquo; question</li>
                <li>Seniors who refuse to wear a medical alert pendant</li>
                <li>Seniors who find call-center calls stressful or demeaning</li>
                <li>Auto-escalation to family after 2 missed check-ins</li>
              </ul>
            </article>

            <article className="card">
              <h3>⚠️ Keep a medical alert system (or 911 on speed dial) for:</h3>
              <ul className="check-list">
                <li>Active fall response when the senior can&apos;t reach a phone</li>
                <li>24/7 EMT / emergency dispatch service</li>
                <li>Severe mobility issues or recent post-hospital discharge</li>
                <li>Conditions where seconds matter (heart, epilepsy, severe frailty)</li>
              </ul>
            </article>
          </div>
        </section>

        <section className="section">
          <div className="pricing-card card">
            <div>
              <p className="eyebrow">Simple Pricing</p>
              <h2>
                {plan.currency} {plan.monthlyAmount} per month, or{" "}
                {other.currency} {other.monthlyAmount} for{" "}
                {other.currency === "USD" ? "United States" : "Canadian"} families.
                No equipment, no contracts.
              </h2>
              <p className="pricing-amount">
                <span
                  className="pricing-amount-item"
                  dangerouslySetInnerHTML={{ __html: plan.marketing.dailyCard }}
                />
              </p>
              <p className="pricing-copy">{plan.marketing.yearlyCard}</p>
              <p className="pricing-copy">
                Compared to a $30–$50/month medical alert system with equipment
                fees, Warm-Hello pays for itself the first month — and your
                parent actually uses it.
              </p>
              <div style={{ marginTop: 14 }}>
                <CurrencyToggle initial={visitorCurrency.currency} />
              </div>
            </div>
            <div className="card pricing-includes">
              <p className="pricing-badge">7-Day Free Trial</p>
              <ul className="check-list">
                <li>Unlimited daily SMS check-ins</li>
                <li>Automated escalation alerts after 2 misses</li>
                <li>Multiple emergency contacts on every alert</li>
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
            <h2>
              Questions families ask when switching from a medical alert system
              to Warm-Hello
            </h2>
          </div>
          <div className="faq-grid">
            {FAQ.map((entry) => (
              <article key={entry.q} className="card faq-card">
                <h3>{entry.q}</h3>
                <p>{entry.a}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section final-cta card">
          <div>
            <h2>
              If they won&apos;t wear the medical alert button, there is a
              kinder way to stay in touch every morning.
            </h2>
            <p className="section-copy">
              Start a free 7-day trial, set the morning time, and let
              Warm-Hello take the daily &ldquo;are you OK?&rdquo; check-in off
              your to-do list.
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
