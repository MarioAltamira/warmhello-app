"use client";

import { useState } from "react";

type SectionKey = "privacy" | "terms" | "about" | "contact" | "howto" | "faq";

const sectionLabels: Record<SectionKey, string> = {
  privacy: "Privacy Policy",
  terms: "Terms of Service",
  about: "About Us",
  contact: "Contact",
  howto: "HowTo",
  faq: "FAQ",
};

export function LegalLinksPanel() {
  const [activeSection, setActiveSection] = useState<SectionKey | null>(null);

  function toggleSection(section: SectionKey) {
    setActiveSection((current) => (current === section ? null : section));
  }

  return (
    <section className="section">
      <div className="card footer-links-card">
        <h3 className="footer-brand">WarmHello</h3>
        <p className="footer-links-heading">
          <strong>Quick Links</strong>
        </p>

        <ul className="footer-quick-links">
          {(Object.keys(sectionLabels) as SectionKey[]).map((section) => (
            <li key={section}>
              <button
                type="button"
                className="footer-link-button"
                onClick={() => toggleSection(section)}
              >
                {sectionLabels[section]}
              </button>
            </li>
          ))}
        </ul>

        {activeSection ? (
          <div className="legal-panel footer-panel">
            <h4>{sectionLabels[activeSection]}</h4>

            {activeSection === "privacy" ? (
              <>
                <p className="section-meta">
                  <strong>Last Updated:</strong> June 12, 2026
                </p>
                <p>
                  At <strong>WarmHello</strong>, we provide automated status check-in
                  services to ensure your safety and give your loved ones peace of
                  mind. Because our service relies on checking in on your well-being,
                  we treat your personal data with the highest level of security,
                  functional necessity, and confidentiality.
                </p>
                <ul className="longform-list">
                  <li>
                    <strong>Information We Collect:</strong> We only collect the
                    minimum required data: account information, designated emergency
                    contacts, and automated check-in response logs.
                  </li>
                  <li>
                    <strong>How We Use Your Information:</strong> Your data powers SMS
                    check-ins, escalation alerts, and secure Stripe billing.
                  </li>
                  <li>
                    <strong>Data Retention and Security:</strong> We retain operational
                    logs only as long as needed and protect data in transit and at rest
                    using modern security standards.
                  </li>
                  <li>
                    <strong>Your Rights:</strong> You can modify your settings, update
                    contacts, or delete your account data from your dashboard.
                  </li>
                </ul>
              </>
            ) : null}

            {activeSection === "terms" ? (
              <>
                <p className="section-meta">
                  <strong>Effective Date:</strong> June 12, 2026
                </p>
                <blockquote className="notice-block">
                  <strong>IMPORTANT DISCLAIMER:</strong> WarmHello is an automated
                  text-message check-in notification tool designed to facilitate
                  routine monitoring between individuals and their trusted personal
                  contacts. <strong>WarmHello is NOT a medical alert system, emergency
                  dispatch line, or a replacement for professional healthcare or 911
                  services.</strong>
                </blockquote>
                <ul className="longform-list">
                  <li>
                    <strong>Service Description:</strong> WarmHello sends automated SMS
                    prompts and alerts designated contacts when a check-in window is
                    missed.
                  </li>
                  <li>
                    <strong>Subscriptions and Billing:</strong> Service is priced at{" "}
                    <strong>$0.10 per day</strong> and billed through Stripe.
                  </li>
                  <li>
                    <strong>Carrier and Device Reliability:</strong> SMS delivery
                    depends on carrier service, device power, and cellular reception.
                  </li>
                  <li>
                    <strong>Limitation of Liability:</strong> WarmHello is not liable
                    for missed escalations or damages caused by outages, delays, or
                    user errors to the fullest extent allowed by law.
                  </li>
                </ul>
              </>
            ) : null}

            {activeSection === "about" ? (
              <>
                <p className="section-meta">
                  <strong>Simple check-ins. Absolute peace of mind.</strong>
                </p>
                <p>
                  WarmHello was created to help families make sure loved ones living
                  independently are okay every day without being intrusive.
                </p>
                <p>
                  We built a quiet, software-driven safety net that uses a quick daily
                  text response to reduce worry and alert trusted contacts if a check-in
                  is missed.
                </p>
                <p>
                  Our goal is to keep families connected with reliable, secure, and
                  affordable technology at just <strong>$0.10 a day</strong>.
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
              </>
            ) : null}

            {activeSection === "howto" ? (
              <ul className="longform-list">
                <li>
                  <strong>1. Set Up Your Profile:</strong> Choose your check-in time
                  and schedule.
                </li>
                <li>
                  <strong>2. Add Emergency Contacts:</strong> Assign trusted people who
                  should be alerted if you miss a check-in.
                </li>
                <li>
                  <strong>3. Respond To Daily Texts:</strong> Reply to the SMS or tap
                  the secure validation link.
                </li>
                <li>
                  <strong>4. Escalation:</strong> If no reply arrives in time, WarmHello
                  notifies your trusted contacts.
                </li>
              </ul>
            ) : null}

            {activeSection === "faq" ? (
              <ul className="longform-list">
                <li>
                  <strong>How does check-in monitoring work?</strong> WarmHello sends a
                  daily SMS and updates your status when you respond. If you miss the
                  window, alerts go out automatically.
                </li>
                <li>
                  <strong>How much does it cost?</strong> WarmHello costs{" "}
                  <strong>$0.10 per day</strong> with secure recurring billing through
                  Stripe.
                </li>
                <li>
                  <strong>What devices work?</strong> Any phone capable of sending and
                  receiving SMS messages can use WarmHello.
                </li>
                <li>
                  <strong>What if I forget to reply?</strong> The system allows a grace
                  period before notifying your trusted contacts.
                </li>
              </ul>
            ) : null}
          </div>
        ) : null}

        <hr className="footer-divider" />

        <p className="footer-disclaimer">
          &copy; 2026 WarmHello. All rights reserved. | <strong>Disclaimer:</strong>{" "}
          WarmHello is an automated text-message check-in notification tool designed to
          facilitate routine monitoring between individuals and their trusted personal
          contacts. WarmHello is NOT a medical alert system, emergency dispatch line,
          or a replacement for professional healthcare or 911 services. Standard
          cellular carrier SMS messaging rates may apply.
        </p>
      </div>
    </section>
  );
}
