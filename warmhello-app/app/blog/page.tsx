import Link from "next/link";
import type { Metadata } from "next";
import { getAllPosts } from "../../content/posts";
import { SmartBuyNowButton } from "../../components/smart-buy-now-button";

export const metadata: Metadata = {
  title:
    "Caregiver Blog: Gentle Check-In Scripts & Tips for Aging Parents · Warm-Hello",
  description:
    "Caregiver-tested scripts, daily check-in questions, and advice for supporting elderly parents living alone with dignity. No 'babying' — real copy-paste SMS templates.",
  alternates: { canonical: "/blog" },
  keywords: [
    "caregiver blog",
    "daily check in questions for seniors",
    "aging parents support blog",
    "senior check in SMS templates",
  ],
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  openGraph: {
    title:
      "Caregiver Blog · Warm-Hello: Gentle Check-In Scripts for Seniors Living Alone",
    description:
      "Copy-paste caregiver scripts and dignity-first check-in questions for elderly parents. Updated weekly.",
    type: "website",
    url: "https://warm-hello.com/blog",
    siteName: "Warm-Hello",
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Caregiver Blog · Warm-Hello: Gentle Check-In Scripts for Seniors Living Alone",
    description:
      "Copy-paste caregiver scripts and dignity-first check-in questions for elderly parents.",
  },
};

export default function BlogIndexPage() {
  const posts = getAllPosts();
  return (
    <main className="shell">
      <section className="hero hero-grid hero-grid-wide">
        <div className="hero-copy">
          <p className="eyebrow">Caregiver Journal</p>
          <h1>
            Gentle scripts for checking in on aging parents living alone.
          </h1>
          <p className="lede">
            No more defaulting to &ldquo;are you okay?&rdquo; every morning.
            Each post below has a copy-paste SMS conversation opener,
            caregiver framing, and how-tos that make daily family check-ins
            feel like care — not like monitoring.
          </p>
          <SmartBuyNowButton />
        </div>
        <div className="entity-definition">
          <p>
            <strong>About Warm-Hello:</strong> An automated SMS-based daily
            check-in service for elderly seniors living independently and the
            adult children who care for them. After 2 unanswered days, the
            family is notified. <Link href="/">See how it works &rarr;</Link>
          </p>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">Latest articles</p>
          <h2>Caregiver scripts &amp; real-world advice</h2>
          <p className="section-copy">
            Short, practical reads. No fluff. Every question, template and
            framework has been tested with real Warm-Hello families.
          </p>
        </div>

        <div className="blog-index-grid">
          {posts.map((p) => (
            <article className="blog-card" key={p.slug}>
              <div className="blog-card-meta">
                <time dateTime={p.publishedAt}>
                  {new Date(p.publishedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
                <span className="blog-card-author">By {p.author}</span>
              </div>
              <h3 className="blog-card-title">
                <Link href={`/blog/${p.slug}` as `/blog/${string}`}>{p.title}</Link>
              </h3>
              <p className="blog-card-excerpt">{p.excerpt}</p>
              <div className="blog-card-tags">
                {p.tags.map((t) => (
                  <span className="tag-chip" key={t}>
                    {t}
                  </span>
                ))}
              </div>
              <Link className="blog-card-readmore" href={`/blog/${p.slug}` as `/blog/${string}`}>
                Read article &rarr;
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="section pricing">
        <div className="pricing-card">
          <p className="eyebrow">Pricing</p>
          <h2>Simple, transparent pricing. Cancel anytime.</h2>
          <p className="section-copy">
            Try Warm-Hello free for 14 days. No credit card required to start.
          </p>
          <SmartBuyNowButton />
        </div>
      </section>
    </main>
  );
}
