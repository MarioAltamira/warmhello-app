"use client";

import { useState } from "react";
import { CheckoutButton } from "@/components/checkout-button";

type HouseholdResponse = {
  ok: boolean;
  message?: string;
  firstCheckIn?: {
    token: string;
    scheduledFor: string;
  };
  firstCheckInMessage?: string;
  household?: {
    subscriber: {
      id: string;
      email: string;
      fullName: string;
    };
    senior: {
      id: string;
      firstName: string;
      lastName: string;
    };
    contact: {
      id: string;
      fullName: string;
    };
  };
};

const initialForm = {
  subscriberName: "Caregiver Demo",
  subscriberEmail: "caregiver@example.com",
  subscriberPhone: "+15551230001",
  seniorFirstName: "Margaret",
  seniorLastName: "Johnson",
  seniorPhone: "+15551230002",
  timezone: "America/New_York",
  checkInHour: "9",
  contactName: "David Johnson",
  contactRelationship: "Son",
  contactPhone: "+15551230003",
};

export function OnboardingForm() {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(
    "Create a real subscriber, senior, and primary contact record.",
  );
  const [created, setCreated] = useState<HouseholdResponse["household"]>();
  const [firstCheckIn, setFirstCheckIn] = useState<HouseholdResponse["firstCheckIn"]>();
  const [firstCheckInMessage, setFirstCheckInMessage] = useState<string>();

  function updateField(name: keyof typeof initialForm, value: string) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setCreated(undefined);
    setFirstCheckIn(undefined);
    setFirstCheckInMessage(undefined);
    setStatusMessage("Creating household...");

    try {
      const response = await fetch("/api/subscribers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscriber: {
            fullName: form.subscriberName,
            email: form.subscriberEmail,
            phoneNumber: form.subscriberPhone,
          },
          senior: {
            firstName: form.seniorFirstName,
            lastName: form.seniorLastName,
            phoneNumber: form.seniorPhone,
            timezone: form.timezone,
            checkInHour: Number(form.checkInHour),
          },
          primaryContact: {
            fullName: form.contactName,
            relationship: form.contactRelationship,
            phoneNumber: form.contactPhone,
          },
        }),
      });

      const data = (await response.json()) as HouseholdResponse;

      if (!response.ok || !data.ok || !data.household) {
        setStatusMessage(data.message ?? "We could not create the household.");
        return;
      }

      setCreated(data.household);
      setFirstCheckIn(data.firstCheckIn);
      setFirstCheckInMessage(data.firstCheckInMessage);
      setStatusMessage("Household created successfully.");
    } catch {
      setStatusMessage("We could not reach the server right now.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="card">
      <h2>Create Subscriber Household</h2>
      <p>
        This stores a real subscriber, senior, and emergency contact when your
        database is connected.
      </p>
      <form className="form-grid" onSubmit={handleSubmit}>
        <label>
          Caregiver name
          <input
            value={form.subscriberName}
            onChange={(event) => updateField("subscriberName", event.target.value)}
          />
        </label>
        <label>
          Caregiver email
          <input
            type="email"
            value={form.subscriberEmail}
            onChange={(event) => updateField("subscriberEmail", event.target.value)}
          />
        </label>
        <label>
          Caregiver phone
          <input
            value={form.subscriberPhone}
            onChange={(event) => updateField("subscriberPhone", event.target.value)}
          />
        </label>
        <label>
          Senior first name
          <input
            value={form.seniorFirstName}
            onChange={(event) => updateField("seniorFirstName", event.target.value)}
          />
        </label>
        <label>
          Senior last name
          <input
            value={form.seniorLastName}
            onChange={(event) => updateField("seniorLastName", event.target.value)}
          />
        </label>
        <label>
          Senior phone
          <input
            value={form.seniorPhone}
            onChange={(event) => updateField("seniorPhone", event.target.value)}
          />
        </label>
        <label>
          Timezone
          <input
            value={form.timezone}
            onChange={(event) => updateField("timezone", event.target.value)}
          />
        </label>
        <label>
          Check-in hour
          <input
            type="number"
            min="0"
            max="23"
            value={form.checkInHour}
            onChange={(event) => updateField("checkInHour", event.target.value)}
          />
        </label>
        <label>
          Primary contact name
          <input
            value={form.contactName}
            onChange={(event) => updateField("contactName", event.target.value)}
          />
        </label>
        <label>
          Contact relationship
          <input
            value={form.contactRelationship}
            onChange={(event) => updateField("contactRelationship", event.target.value)}
          />
        </label>
        <label>
          Contact phone
          <input
            value={form.contactPhone}
            onChange={(event) => updateField("contactPhone", event.target.value)}
          />
        </label>
        <div className="form-actions">
          <button className="button primary" type="submit" disabled={submitting}>
            {submitting ? "Creating..." : "Create Household"}
          </button>
        </div>
      </form>
      <p style={{ marginTop: 16 }}>{statusMessage}</p>
      {created ? (
        <div className="result-panel">
          <p>
            <strong>Subscriber ID:</strong> {created.subscriber.id}
          </p>
          <p>
            <strong>Senior ID:</strong> {created.senior.id}
          </p>
          <p>
            <strong>Primary contact:</strong> {created.contact.fullName}
          </p>
          {firstCheckIn ? (
            <p>
              <strong>First check-in:</strong>{" "}
              <a href={`/checkin/${firstCheckIn.token}`}>{firstCheckIn.token}</a>
            </p>
          ) : null}
          {firstCheckInMessage ? <p>{firstCheckInMessage}</p> : null}
          <CheckoutButton
            subscriberId={created.subscriber.id}
            customerEmail={created.subscriber.email}
          />
        </div>
      ) : null}
    </section>
  );
}
