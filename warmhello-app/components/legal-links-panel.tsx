"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { pricingPlanFor } from "@/lib/pricing";
import { LEGAL_DISCLAIMER_UNIVERSAL, NON_EMERGENCY_POSITIONING_LINE } from "@/lib/constants";
import { YourPrivacyChoicesButton } from "@/components/privacy-choices-modal";

type SectionKey = "privacy" | "terms" | "about" | "contact" | "howto" | "faq" | "choices";
const contactEmail = "sales@warm-hello.com";

const sectionLabels: Record<SectionKey, string> = {
  privacy: "Privacy Policy",
  terms: "Terms of Service",
  about: "About Us",
  contact: "Contact",
  howto: "HowTo",
  faq: "FAQ",
  choices: "Your Privacy Choices",
};

type Props = { initialCurrency?: unknown };

export function LegalLinksPanel(_props: Props) {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<SectionKey | null>(null);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactStatus, setContactStatus] = useState("");
  const plan = pricingPlanFor("USD");

  function toggleSection(section: SectionKey) {
    setActiveSection((current) => (current === section ? null : section));
  }

  function updateContactField(name: "name" | "email" | "message", value: string) {
    setContactForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleContactSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = contactForm.name.trim();
    const trimmedEmail = contactForm.email.trim();
    const trimmedMessage = contactForm.message.trim();

    if (!trimmedName || !trimmedEmail || !trimmedMessage) {
      setContactStatus("Please complete all contact form fields.");
      return;
    }

    if (trimmedMessage.length < 10) {
      setContactStatus("Please enter a message with at least 10 characters.");
      return;
    }

    setContactSubmitting(true);
    setContactStatus("Sending your message...");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          message: trimmedMessage,
        }),
      });

      const data = (response.headers.get("content-type")?.includes("application/json")
        ? await response.json()
        : {}) as { ok?: boolean; message?: string };

      if (!response.ok || !data.ok) {
        setContactStatus(data.message ?? "We could not send your message right now.");
        return;
      }

      setContactForm({
        name: "",
        email: "",
        message: "",
      });
      setContactStatus(data.message ?? "Your message was sent successfully.");
    } catch {
      setContactStatus("We could not send your message right now.");
    } finally {
      setContactSubmitting(false);
    }
  }

  return (
    <section className="section">
      <div className="card footer-links-card">
        <h3
          className="footer-brand"
          style={{ fontSize: 18, fontWeight: 800, marginTop: 4 }}
        >
          Warm-Hello
        </h3>
        <p className="footer-links-heading">
          <strong>Quick Links</strong>
        </p>

        <ul className="footer-quick-links">
          {(Object.keys(sectionLabels) as SectionKey[]).map((section) => {
            if (section === "terms") {
              return (
                <li key={section}>
                  <Link href="/terms" className="footer-link-button">
                    {sectionLabels[section]}
                  </Link>
                </li>
              );
            }
            if (section === "privacy") {
              return (
                <li key={section}>
                  <Link href="/privacy" className="footer-link-button">
                    {sectionLabels[section]}
                  </Link>
                </li>
              );
            }
            if (section === "choices") {
              return (
                <li key={section}>
                  <YourPrivacyChoicesButton />
                </li>
              );
            }
            return (
              <li key={section}>
                <button
                  type="button"
                  className="footer-link-button"
                  onClick={() => toggleSection(section)}
                >
                  {sectionLabels[section]}
                </button>
              </li>
            );
          })}
        </ul>

        {activeSection ? (
          <div className="legal-panel footer-panel">
            <h4>{sectionLabels[activeSection]}</h4>

            {activeSection === "privacy" ? (
              <>
                <p className="section-meta">
                  <strong>Last Updated:</strong> August 29, 2026
                </p>
                <p>
                  At <strong>Warm-Hello</strong>, we provide automated status check-in
                  services to help families stay connected with loved ones living
                  independently. Because our service is a routine daily check-in tool, we
                  treat your personal data with the highest level of security, functional
                  necessity, and confidentiality.
                </p>
                <blockquote
                  className="notice-block"
                  style={{
                    borderColor: "rgba(255,214,102,0.25)",
                    background: "rgba(255,214,102,0.06)",
                  }}
                >
                  <strong>{NON_EMERGENCY_POSITIONING_LINE}</strong>
                </blockquote>
                <ul className="longform-list">
                  <li>
                    <strong>Information We Collect:</strong> We only collect the minimum
                    required data: account information, designated trusted escalation
                    contacts, and automated check-in response logs.
                  </li>
                  <li>
                    <strong>How We Use Your Information:</strong> Your data powers SMS
                    check-ins, escalation notifications, and secure Stripe billing.
                  </li>
                  <li>
                    <strong>Data Retention and Security:</strong> We retain operational
                    logs only as long as needed and protect data in transit and at rest
                    using modern security standards.
                  </li>
                  <li>
                    <strong>Your Rights:</strong> You can modify your settings, update
                    contacts, or delete your account data from your dashboard. Depending
                    on your jurisdiction you may also have rights to access, correct,
                    delete, port, or opt out of targeted advertising or sale/sharing.
                  </li>
                </ul>
                <div style={{ marginTop: 14 }}>
                  <YourPrivacyChoicesButton variant="button" />
                  <p className="section-meta" style={{ marginTop: 10, marginBottom: 0 }}>
                    Use the preference center above to opt in or out of non-essential
                    categories (Analytics, Targeted Advertising, Sale/Sharing) at any time.
                  </p>
                </div>
              </>
            ) : null}

            {activeSection === "terms" ? (
              <>
                <p className="section-meta">
                  <strong>Effective Date:</strong> August 29, 2026
                </p>
                <blockquote className="notice-block">
                  <strong>IMPORTANT DISCLAIMER:</strong> Warm-Hello is an automated
                  text-message check-in notification tool designed to facilitate
                  routine check-ins between individuals and their trusted personal contacts.{" "}
                  <strong>Warm-Hello is NOT a medical alert system, emergency
                  dispatch line, or a replacement for professional healthcare or 911
                  services.</strong>
                </blockquote>
                <ul className="longform-list">
                  <li>
                    <strong>Service Description:</strong> Warm-Hello sends automated SMS
                    prompts and alerts designated contacts when a check-in window is
                    missed.
                  </li>
                  <li>
                    <strong>Subscriptions and Billing:</strong> Service is billed at{" "}
                    <strong>{plan.monthlyLabel}</strong> ({plan.dailyLabel}, equivalent to{" "}
                    <strong>{plan.yearlyLabel}</strong>) through Stripe. Cancel or pause anytime.
                  </li>
                  <li>
                    <strong>Carrier and Device Reliability:</strong> SMS delivery
                    depends on carrier service, device power, and cellular reception.
                  </li>
                  <li>
                    <strong>Limitation of Liability:</strong> Warm-Hello is not liable
                    for missed escalations or damages caused by outages, delays, or
                    user errors to the fullest extent allowed by law.
                  </li>
                </ul>
              </>
            ) : null}

            {activeSection === "about" ? (
              <>
                <p className="section-meta">
                  <strong>Simple check-ins. Families stay connected.</strong>
                </p>
                <p>
                  Warm-Hello was created to help families stay in touch with loved ones
                  living independently every day without being intrusive.
                </p>
                <p>
                  We built a quiet, software-driven daily routine that uses a quick SMS
                  response so families know their loved one started their day, and
                  notifies trusted escalation contacts if a check-in is missed.
                </p>
                <blockquote
                  className="notice-block"
                  style={{
                    borderColor: "rgba(255,214,102,0.25)",
                    background: "rgba(255,214,102,0.06)",
                  }}
                >
                  <strong>{NON_EMERGENCY_POSITIONING_LINE}</strong>
                </blockquote>
                <p>
                  Our goal is to keep families connected with reliable, secure, and
                  affordable technology.
                </p>
              </>
            ) : null}

            {activeSection === "contact" ? (
              <>
                <p>
                  Have questions about your automated check-in setup or billing
                  profile? We&apos;re here to help.
                </p>
                <p>
                  Submit an inquiry with your name, registered email address, and a
                  brief description of how we can help.
                </p>
                <p>
                  Contact us at{" "}
                  <a href={`mailto:${contactEmail}`} className="inline-link">
                    {contactEmail}
                  </a>
                  .
                </p>
                <form className="contact-form" onSubmit={handleContactSubmit}>
                  <label>
                    Your name
                    <input
                      type="text"
                      value={contactForm.name}
                      onChange={(event) => updateContactField("name", event.target.value)}
                      placeholder="Jordan Miller"
                    />
                  </label>
                  <label>
                    Your email
                    <input
                      type="email"
                      value={contactForm.email}
                      onChange={(event) => updateContactField("email", event.target.value)}
                      placeholder="you@example.com"
                    />
                  </label>
                  <label>
                    Message
                    <textarea
                      value={contactForm.message}
                      onChange={(event) => updateContactField("message", event.target.value)}
                      placeholder="Tell us how we can help."
                      rows={5}
                    />
                  </label>
                  <div className="contact-form-actions">
                    <button type="submit" className="button primary" disabled={contactSubmitting}>
                      {contactSubmitting ? "Sending..." : "Send Message"}
                    </button>
                    {contactStatus ? <p className="contact-form-status">{contactStatus}</p> : null}
                  </div>
                </form>
              </>
            ) : null}

            {activeSection === "howto" ? (
              <ul className="longform-list">
                <li>
                  <strong>1. Set Up Your Profile:</strong> Choose your check-in time
                  and schedule.
                </li>
                <li>
                  <strong>2. Add Trusted Escalation Contacts:</strong> Assign people who
                  should be notified if the senior misses a check-in.
                </li>
                <li>
                  <strong>3. Respond To Daily Texts:</strong> Reply to the SMS or tap
                  the secure validation link.
                </li>
                <li>
                  <strong>4. Escalation:</strong> If no reply arrives in time, Warm-Hello
                  notifies your trusted escalation contacts by SMS and email.
                </li>
              </ul>
            ) : null}

            {activeSection === "faq" ? (
              <ul className="longform-list">
                <li>
                  <strong>Is Warm-Hello an emergency service?</strong> No. Warm-Hello is a routine check-in and notification service. It does not contact 911 or emergency services.
                </li>
                <li>
                  <strong>What happens if a check-in is missed?</strong> Warm-Hello may notify the designated contacts according to the account's configuration.
                </li>
                <li>
                  <strong>Does a missed check-in mean there is an emergency?</strong> No. A missed check-in may happen for many reasons and does not establish that an emergency has occurred.
                </li>
                <li>
                  <strong>Does the free trial automatically become paid?</strong> No. The 7-day free trial does not automatically convert to a paid subscription. You must actively select and purchase a paid subscription to continue.
                </li>
                <li>
                  <strong>Do paid subscriptions renew?</strong> Yes. Paid subscriptions automatically renew at the applicable billing interval unless cancelled before the next renewal date.
                </li>
                <li>
                  <strong>How much does it cost?</strong> United States: $14.99 USD/month or $144 USD/year. Canada: $19.99 CAD/month or $180 CAD/year. Plus applicable taxes.
                </li>
                <li>
                  <strong>What devices work?</strong> Any phone capable of sending and receiving SMS messages can use Warm-Hello.
                </li>
              </ul>
            ) : null}
          </div>
        ) : null}

        <hr className="footer-divider" />

        <p
          className="footer-disclaimer"
          style={{
            fontSize: 10,
            lineHeight: 1.55,
            opacity: 0.92,
          }}
        >
          &copy; 2026 Warm-Hello. All rights reserved. | {LEGAL_DISCLAIMER_UNIVERSAL}{" "}
          <Link href="/terms" className="inline-link">
            Read full Terms
          </Link>{" "}
          ·{" "}
          <Link href="/privacy" className="inline-link">
            Privacy Policy
          </Link>{" "}
          ·{" "}
          <YourPrivacyChoicesButton />
          .
        </p>
      </div>
    </section>
  );
}
