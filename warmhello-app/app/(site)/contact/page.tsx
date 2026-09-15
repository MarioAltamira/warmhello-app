import type { Metadata } from "next";
import { ContactForm } from "./contact-form";

const contactEmail = "sales@warm-hello.com";

export const metadata: Metadata = {
  title: "Contact · Warm-Hello",
  description: "Contact the Warm-Hello team with questions about your check-in setup or billing.",
  robots: "noindex,nofollow",
};

export default function ContactPage() {
  return (
    <main className="shell">
      <article
        className="card longform"
        style={{ textAlign: "left", maxWidth: 860, margin: "0 auto" }}
      >
        <p className="eyebrow">Warm-Hello</p>
        <h1>Contact</h1>
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
        <ContactForm />
      </article>
    </main>
  );
}
