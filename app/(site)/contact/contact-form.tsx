"use client";

import { useState } from "react";

export function ContactForm() {
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactStatus, setContactStatus] = useState("");

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
  );
}
