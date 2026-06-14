import Image from "next/image";
import Link from "next/link";
import { LegalLinksPanel } from "@/components/legal-links-panel";
import { getIntegrationStatus } from "@/lib/env";
import {
  dashboardAuthHref,
  protectAuthHref,
  trialAuthHref,
} from "@/lib/routes";

export default function HomePage() {
  const integrations = getIntegrationStatus();
  const allSystemsReady =
    integrations.database &&
    integrations.stripe &&
    integrations.twilio &&
    integrations.qstash;

  return (
    <main className="shell">
      <section className="hero hero-grid">
        <div className="hero-copy">
          <p className="eyebrow">Daily Peace Of Mind For Families</p>
          <h1>They love their independence. You love knowing they&apos;re okay.</h1>
          <p className="lede">
            WarmHello is the zero-friction daily check-in for seniors who live alone. No
            intrusive phone calls, no complicated apps to download. Just a single tap
            that says, &quot;I&apos;m doing great this morning.&quot;
          </p>
          <div className="actions">
            <Link href={trialAuthHref} className="button primary">
              Start Their Free 7-Day Trial
            </Link>
            <Link href={dashboardAuthHref} className="button secondary">
              View Family Dashboard
            </Link>
          </div>
          <p className="hero-meta">
            No credit card required. Protect peace of mind for $3/month.
          </p>
        </div>

        <div className="hero-visual card">
          <div className="hero-photo">
            <Image
              src="/hero-warmhello.png"
              alt="A senior holding a phone with the WarmHello daily check-in screen open during a peaceful morning at home."
              fill
              priority
              className="hero-photo-image"
              sizes="(max-width: 720px) 100vw, 420px"
            />
          </div>
          <div className="hero-quote">
            <p className="hero-quote-label">A peaceful morning at home</p>
            <p>
              A gentle text arrives, one tap confirms everything is okay, and the day
              begins without stress for anyone.
            </p>
          </div>
        </div>
      </section>

      <section className="section story-section">
        <div className="section-heading">
          <p className="eyebrow">The Problem</p>
          <h2>The Daily Worry We Don&apos;t Talk About</h2>
        </div>
        <div className="card story-card">
          <p>
            You love your parents, but you also want to respect their space. You
            don&apos;t want to be overbearing calling every single morning at 8:00 AM
            just to make sure they&apos;re awake.
          </p>
          <p>But when a few hours pass without a text back, the anxiety creeps in:</p>
          <ul className="prompt-list">
            <li>Are they just out in the garden?</li>
            <li>Did they leave their phone in the other room?</li>
            <li>Or did something happen?</li>
          </ul>
          <p>
            You shouldn&apos;t have to trade their dignity for your peace of mind. Now,
            you don&apos;t have to.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">The Solution</p>
          <h2>How WarmHello Works</h2>
          <p className="section-copy">It&apos;s beautifully simple for seniors and reassuringly automatic for families.</p>
        </div>
        <div className="grid three-up">
          <article className="card step-card">
            <span className="step-number">1</span>
            <h3>The Morning Greeting</h3>
            <p>
              Every morning at a time you choose, WarmHello sends your loved one a
              gentle text message. No app to install, no password to remember. Just a
              text.
            </p>
          </article>
          <article className="card step-card">
            <span className="step-number">2</span>
            <h3>The One-Tap Check-In</h3>
            <p>
              They tap the secure link in the text and press one giant, high-contrast
              button that says &quot;I&apos;m OK.&quot; No typing required. It takes exactly
              two seconds.
            </p>
          </article>
          <article className="card step-card">
            <span className="step-number">3</span>
            <h3>Automated Safety Net</h3>
            <p>
              If they&apos;re busy or forget, the system gently reminds them 3 hours later.
              If there&apos;s still no response after another hour, WarmHello immediately
              alerts you by text and email so you can check in.
            </p>
          </article>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">Why Families Love It</p>
          <h2>Designed To Feel Warm, Not Clinical</h2>
        </div>
        <div className="grid three-up">
          <article className="card">
            <h3>Zero Learning Curve</h3>
            <p>
              If they can open a text message, they can use WarmHello. It works on any
              smartphone without downloads or logins.
            </p>
          </article>
          <article className="card">
            <h3>Preserves Independence</h3>
            <p>
              It doesn&apos;t feel like a medical alert or a tracking device. It feels
              like a quick morning wave across the fence.
            </p>
          </article>
          <article className="card">
            <h3>Reliable Infrastructure</h3>
            <p>
              Built on the same secure technology trusted by major banks and healthcare
              systems, so the automated clock never misses a beat.
            </p>
            <p className="supporting-note">
              Current system status: {allSystemsReady ? "fully connected" : "setup in progress"}.
            </p>
          </article>
        </div>
      </section>

      <section className="section">
        <div className="pricing-card card">
          <div>
            <p className="eyebrow">Simple Pricing</p>
            <h2>Peace of mind costs less than a cup of coffee.</h2>
            <p className="pricing-amount">
              <span className="pricing-amount-item">
                $0.10 <span className="pricing-amount-label">/ day</span>
              </span>
            </p>
            <p className="pricing-copy">(Billed at $36 annually)</p>
            <p className="pricing-copy">
              That is just $0.10 a day to eliminate the daily &quot;what-if&quot; anxiety
              and make sure you know within hours, not days, if something is wrong.
            </p>
          </div>
          <div className="card pricing-includes">
            <p className="pricing-badge">7-Day Free Trial</p>
            <ul className="check-list">
              <li>Unlimited daily SMS check-ins</li>
              <li>Automated escalation alerts to your phone</li>
              <li>Cancel or pause anytime</li>
            </ul>
            <Link href={protectAuthHref} className="button primary">
              Protect Your Loved One Today
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">FAQ</p>
          <h2>Questions Families Ask Before They Start</h2>
        </div>
        <div className="faq-grid">
          <article className="card">
            <h3>My mom isn&apos;t good with technology. Will she be able to use this?</h3>
            <p>
              Absolutely. She never has to log in, type a password, or text back. She
              simply taps a single link and presses a large button on her screen.
            </p>
          </article>
          <article className="card">
            <h3>What if you need to pause for a special occasion?</h3>
            <p>
              You or your loved one can pause daily check-ins for specific dates from
              the dashboard so no false alarms are triggered.
            </p>
          </article>
          <article className="card">
            <h3>Can I add more than one emergency contact?</h3>
            <p>
              Yes. You can assign multiple people to receive the escalation alert if
              the morning check-in is missed.
            </p>
          </article>
        </div>
      </section>

      <section className="section final-cta card">
        <div>
          <h2>Respect their independence without carrying the daily worry alone.</h2>
          <p className="section-copy">
            Start with a free trial, set the morning time, and let WarmHello handle the
            gentle daily rhythm.
          </p>
        </div>
        <div className="actions">
          <Link href={trialAuthHref} className="button primary">
            Start Their Free 7-Day Trial
          </Link>
          <Link href="/checkin/demo-token" className="button secondary">
            See The Check-In Experience
          </Link>
        </div>
      </section>

      <LegalLinksPanel />
    </main>
  );
}
