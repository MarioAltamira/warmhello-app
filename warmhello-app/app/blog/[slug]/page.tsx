import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllPosts, getPostBySlug, getAllSlugs, type BlogBodyNode } from "../../../content/posts";
import { SmartBuyNowButton } from "../../../components/smart-buy-now-button";
import { CurrencyToggle } from "../../../components/currency-toggle";
import { resolveCurrencyForCurrentVisitor } from "../../../lib/visitor-currency";
import { pricingPlanFor } from "../../../lib/pricing";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "Not found · Warm-Hello" };

  const base = "https://warm-hello.com";
  const ogImageUrl = `/opengraph-image?title=${encodeURIComponent(post.title)}&subtitle=${encodeURIComponent(post.description)}&tag=${encodeURIComponent(post.tags.slice(0, 3).join(" · "))}`;
  const twImageUrl = `/twitter-image?title=${encodeURIComponent(post.title)}`;
  return {
    title: { absolute: post.title },
    description: post.description,
    keywords: post.keywords,
    alternates: { canonical: `/blog/${post.slug}` },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      url: `${base}/blog/${post.slug}`,
      siteName: "Warm-Hello",
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt ?? post.publishedAt,
      authors: [post.author],
      tags: post.tags,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [twImageUrl],
    },
  };
}

function renderNode(node: BlogBodyNode, idx: number) {
  const k = `bnode-${idx}`;
  switch (node.kind) {
    case "h2":
      return <h2 key={k}>{node.text}</h2>;
    case "h3":
      return <h3 key={k}>{node.text}</h3>;
    case "p":
      return <p key={k}>{node.text}</p>;
    case "callout":
      return (
        <div key={k} className={`callout callout-${node.tone}`}>
          <p>{node.text}</p>
        </div>
      );
    case "ul":
      return (
        <ul key={k}>
          {node.items.map((it, i) => (
            <li key={`${k}-${i}`}>{it}</li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol key={k}>
          {node.items.map((it, i) => (
            <li key={`${k}-${i}`}>{it}</li>
          ))}
        </ol>
      );
    default:
      return null;
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();
  const all = getAllPosts().filter((p) => p.slug !== slug).slice(0, 2);
  const visitorCurrency = await resolveCurrencyForCurrentVisitor();
  const plan = pricingPlanFor(visitorCurrency.currency);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "Warm-Hello",
        url: "https://warm-hello.com",
        logo: "https://warm-hello.com/opengraph-image",
      },
      {
        "@type": "BlogPosting",
        headline: post.title,
        description: post.description,
        datePublished: post.publishedAt,
        dateModified: post.updatedAt ?? post.publishedAt,
        author: { "@type": "Person", name: post.author },
        publisher: {
          "@type": "Organization",
          name: "Warm-Hello",
          url: "https://warm-hello.com",
        },
        mainEntityOfPage: `https://warm-hello.com/blog/${post.slug}`,
        keywords: post.keywords.join(", "),
        articleSection: post.tags[0] ?? "Caregiving",
        image: `https://warm-hello.com/opengraph-image?title=${encodeURIComponent(post.title)}`,
      },
      {
        "@type": "FAQPage",
        mainEntity: post.faq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };

  return (
    <>
      <script
        key={`blog-${post.slug}-ld`}
        id="ld-json-blog"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="shell">
        <article className="blog-article">
          <header className="blog-hero">
            <p className="eyebrow">Caregiver Journal</p>
            <h1 className="blog-hero-title">{post.title}</h1>
            <div className="blog-hero-meta">
              <time dateTime={post.publishedAt}>
                {new Date(post.publishedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
              <span className="sep">·</span>
              <span>By {post.author}</span>
              <span className="sep">·</span>
              <div className="blog-tag-row">
                {post.tags.map((t) => (
                  <span className="tag-chip" key={t}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <p className="lede blog-hero-excerpt">{post.excerpt}</p>
          </header>

          <div className="blog-body">
            {post.body.map((n, i) => renderNode(n, i))}
          </div>

          <div className="blog-share-card">
            <div>
              <p className="eyebrow">This was useful?</p>
              <h2>Share this with another caregiver.</h2>
              <p className="section-copy">
                A sibling, a cousin, a friend - anyone checking in on an aging
                parent from a distance.
              </p>
            </div>
            <div className="blog-share-actions">
              <a
                className="btn btn-primary"
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                  `https://warm-hello.com/blog/${post.slug}`,
                )}`}
                target="_blank"
                rel="noreferrer"
              >
                Share on Facebook
              </a>
              <a
                className="btn btn-ghost"
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                  post.title,
                )}&url=${encodeURIComponent(
                  `https://warm-hello.com/blog/${post.slug}`,
                )}`}
                target="_blank"
                rel="noreferrer"
              >
                Tweet this article
              </a>
            </div>
          </div>

          <section className="blog-faq">
            <div className="section-heading">
              <p className="eyebrow">FAQ</p>
              <h2>Common caregiver questions about daily check-ins</h2>
            </div>
            <div className="faq-list">
              {post.faq.map((f, i) => (
                <details key={`faq-${i}`} className="faq-item" open={i === 0}>
                  <summary className="faq-q">{f.q}</summary>
                  <p className="faq-a">{f.a}</p>
                </details>
              ))}
            </div>
          </section>

          {all.length > 0 && (
            <section className="blog-related">
              <div className="section-heading">
                <p className="eyebrow">Keep reading</p>
                <h2>Related caregiver articles</h2>
              </div>
              <div className="blog-index-grid">
                {all.map((p) => (
                  <article className="blog-card" key={p.slug}>
                    <div className="blog-card-meta">
                      <time dateTime={p.publishedAt}>
                        {new Date(p.publishedAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </time>
                    </div>
                    <h3 className="blog-card-title">
                      <Link href={`/blog/${p.slug}` as `/blog/${string}`}>{p.title}</Link>
                    </h3>
                    <p className="blog-card-excerpt">{p.excerpt}</p>
                    <Link className="blog-card-readmore" href={`/blog/${p.slug}` as `/blog/${string}`}>
                      Read article &rarr;
                    </Link>
                  </article>
                ))}
              </div>
            </section>
          )}
        </article>

        <section className="section pricing">
          <div className="pricing-card pricing-card-wide">
            <div className="pricing-card-head">
              <div>
                <p className="eyebrow">Pricing</p>
                <h2>
                  {plan.marketing.monthlyCard} · Cancel any time.
                </h2>
                <p className="section-copy">
                  14-day free trial, no credit card required. Coverage for 1
                  senior living alone + unlimited family members on the
                  dashboard.
                </p>
              </div>
              <div className="pricing-card-side">
                <CurrencyToggle compact />
                <SmartBuyNowButton />
              </div>
            </div>
            <p className="legal-subcopy">
              Questions? See our{" "}
              <Link href="/">home page FAQ</Link> or{" "}
              <Link href="/auth">create a free household</Link> in 60 seconds.
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
