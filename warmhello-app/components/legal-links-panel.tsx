"use client";

import Link from "next/link";
import type { Route } from "next";
import { LEGAL_DISCLAIMER_UNIVERSAL } from "@/lib/constants";
import { YourPrivacyChoicesButton } from "@/components/privacy-choices-modal";

type SectionKey = "privacy" | "terms" | "about" | "contact" | "howto" | "faq" | "choices";

const sectionLabels: Record<SectionKey, string> = {
  privacy: "Privacy Policy",
  terms: "Terms of Service",
  about: "About Us",
  contact: "Contact",
  howto: "HowTo",
  faq: "FAQ",
  choices: "Your Privacy Choices",
};

const sectionHrefs: Partial<Record<SectionKey, Route<string>>> = {
  terms: "/terms" as Route<string>,
  privacy: "/privacy" as Route<string>,
  about: "/about" as Route<string>,
  contact: "/contact" as Route<string>,
  howto: "/howto" as Route<string>,
  faq: "/faq" as Route<string>,
};

type Props = { initialCurrency?: unknown };

export function LegalLinksPanel(_props: Props) {
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
            if (section === "choices") {
              return (
                <li key={section}>
                  <YourPrivacyChoicesButton />
                </li>
              );
            }
            if (section === "terms" || section === "privacy") {
              return (
                <li key={section}>
                  <Link href={sectionHrefs[section]!} className="footer-link-button">
                    {sectionLabels[section]}
                  </Link>
                </li>
              );
            }
            return (
              <li key={section}>
                <Link
                  href={sectionHrefs[section]!}
                  className="footer-link-button"
                >
                  {sectionLabels[section]}
                </Link>
              </li>
            );
          })}
        </ul>

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
