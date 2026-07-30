"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
      phoneNumber?: string;
    };
    senior: {
      id: string;
      firstName: string;
      lastName: string;
      phoneNumber?: string;
      timezone?: string;
      checkInHour?: number;
      secondAttemptHours?: number;
    };
    contact: {
      id: string;
      fullName: string;
      relationship?: string;
      phoneNumber?: string;
    };
  };
};

type CurrentHousehold = {
  subscriber: {
    id: string;
    fullName: string;
    email: string;
    phoneNumber: string;
  };
  senior: {
    id: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    timezone: string;
    checkInHour: number;
    secondAttemptHours: number;
  };
  contact: {
    id: string;
    fullName: string;
    relationship: string;
    phoneNumber: string;
  };
  plan: {
    isPaidSubscriber: boolean;
    isFreeTrial: boolean;
    isTrialExpired: boolean;
    showBuyNow: boolean;
    statusLabel: string;
  };
};

type OnboardingFormProps = {
  editMode?: boolean;
  currentHousehold?: CurrentHousehold | null;
  signupDefaults?: {
    subscriberName?: string;
    subscriberEmail?: string;
  };
};

const timezoneOptions = [
  "Baker Island (US)",
  "Samoa, American Samoa, Midway Atoll",
  "Hawaii, Tahiti, Cook Islands",
  "Alaska",
  "Pacific Time (US/Canada/Mexico)",
  "Mountain Time (US/Canada/Mexico)",
  "Central Time (US/Canada/Mexico), Central America",
  "Eastern Time (US/Canada), Peru, Colombia, Panama",
  "Atlantic Time (Canada), Venezuela, Bolivia, Chile",
  "Newfoundland (Canada)",
  "Argentina, Brazil (Brasilia), Uruguay",
  "South Georgia, Fernando de Noronha",
  "Azores, Cape Verde",
  "Greenwich Mean Time (UK), Portugal, Iceland, West Africa",
  "Central European Time (Germany, France, Italy, etc.), Nigeria",
  "Eastern European Time, South Africa, Israel, Egypt",
  "Moscow, Saudi Arabia, East Africa (Kenya, Ethiopia)",
  "Iran",
  "UAE, Azerbaijan, Armenia, Mauritius",
  "Afghanistan",
  "Pakistan, Uzbekistan, Maldives",
  "India, Sri Lanka",
  "Nepal",
  "Bangladesh, Kazakhstan",
  "Myanmar",
  "Thailand, Indonesia (West), Vietnam",
  "China, Singapore, Philippines, Western Australia",
  "Japan, South Korea",
  "Northern Territory / South Australia",
  "Eastern Australia (Sydney/Melbourne), Papua New Guinea",
  "Solomon Islands, New Caledonia",
  "New Zealand, Fiji, Marshall Islands",
  "Samoa (Independent State), Tonga",
  "Kiribati (Line Islands)",
] as const;

const checkInHourOptions = [
  { value: "0", label: "12:00 AM" },
  { value: "1", label: "01:00 AM" },
  { value: "2", label: "02:00 AM" },
  { value: "3", label: "03:00 AM" },
  { value: "4", label: "04:00 AM" },
  { value: "5", label: "05:00 AM" },
  { value: "6", label: "06:00 AM" },
  { value: "7", label: "07:00 AM" },
  { value: "8", label: "08:00 AM" },
  { value: "9", label: "09:00 AM" },
  { value: "10", label: "10:00 AM" },
  { value: "11", label: "11:00 AM" },
  { value: "12", label: "12:00 PM" },
  { value: "13", label: "01:00 PM" },
  { value: "14", label: "02:00 PM" },
  { value: "15", label: "03:00 PM" },
  { value: "16", label: "04:00 PM" },
  { value: "17", label: "05:00 PM" },
  { value: "18", label: "06:00 PM" },
  { value: "19", label: "07:00 PM" },
  { value: "20", label: "08:00 PM" },
  { value: "21", label: "09:00 PM" },
  { value: "22", label: "10:00 PM" },
  { value: "23", label: "11:00 PM" },
] as const;

const initialForm = {
  subscriberName: "Caregiver Demo",
  subscriberEmail: "caregiver@example.com",
  subscriberPhone: "+15551230001",
  seniorFirstName: "Margaret",
  seniorLastName: "Johnson",
  seniorPhone: "+15551230002",
  timezone: "Eastern Time (US/Canada), Peru, Colombia, Panama",
  checkInHour: "9",
  secondAttemptHours: "1",
  contactName: "David Johnson",
  contactRelationship: "Son",
  contactPhone: "+15551230003",
};

function buildInitialForm(
  currentHousehold?: CurrentHousehold | null,
  signupDefaults?: OnboardingFormProps["signupDefaults"],
) {
  if (currentHousehold) {
    return {
      subscriberName: currentHousehold.subscriber.fullName,
      subscriberEmail: currentHousehold.subscriber.email,
      subscriberPhone: currentHousehold.subscriber.phoneNumber,
      seniorFirstName: currentHousehold.senior.firstName,
      seniorLastName: currentHousehold.senior.lastName,
      seniorPhone: currentHousehold.senior.phoneNumber,
      timezone: currentHousehold.senior.timezone,
      checkInHour: String(currentHousehold.senior.checkInHour),
      secondAttemptHours: String(currentHousehold.senior.secondAttemptHours),
      contactName: currentHousehold.contact.fullName,
      contactRelationship: currentHousehold.contact.relationship,
      contactPhone: currentHousehold.contact.phoneNumber,
    };
  }

  return {
    ...initialForm,
    subscriberName: signupDefaults?.subscriberName?.trim() || initialForm.subscriberName,
    subscriberEmail: signupDefaults?.subscriberEmail?.trim() || initialForm.subscriberEmail,
  };
}

function formatScheduledFor(value?: string) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

export function OnboardingForm({
  editMode = false,
  currentHousehold,
  signupDefaults,
}: OnboardingFormProps) {
  const resolvedInitialForm = useMemo(
    () => buildInitialForm(currentHousehold, signupDefaults),
    [currentHousehold, signupDefaults],
  );
  const [form, setForm] = useState(resolvedInitialForm);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [savedHousehold, setSavedHousehold] = useState<HouseholdResponse["household"]>();
  const [firstCheckIn, setFirstCheckIn] = useState<HouseholdResponse["firstCheckIn"]>();
  const [firstCheckInMessage, setFirstCheckInMessage] = useState<string>();
  const firstCheckInScheduledLabel = formatScheduledFor(firstCheckIn?.scheduledFor);

  useEffect(() => {
    setForm(resolvedInitialForm);
  }, [resolvedInitialForm]);

  function updateField(name: keyof typeof initialForm, value: string) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleSelectOnFocus(
    event: React.FocusEvent<HTMLInputElement>,
  ) {
    event.currentTarget.select();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setSavedHousehold(undefined);
    setFirstCheckIn(undefined);
    setFirstCheckInMessage(undefined);
    setStatusMessage(editMode ? "Updating household..." : "Creating household...");

    try {
      const payload = {
        subscriberId: currentHousehold?.subscriber.id,
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
          secondAttemptHours: Number(form.secondAttemptHours),
        },
        primaryContact: {
          fullName: form.contactName,
          relationship: form.contactRelationship,
          phoneNumber: form.contactPhone,
        },
      };

      const response = await fetch("/api/subscribers", {
        method: editMode ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as HouseholdResponse;

      if (!response.ok || !data.ok || !data.household) {
        setStatusMessage(data.message ?? "We could not create the household.");
        return;
      }

      setSavedHousehold(data.household);
      setFirstCheckIn(data.firstCheckIn);
      setFirstCheckInMessage(data.firstCheckInMessage);
      if (data.household?.subscriber.id) {
        await fetch("/api/session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            subscriberId: data.household.subscriber.id,
          }),
        });
      }
      setStatusMessage(
        editMode
          ? data.message ?? "Household updated successfully."
          : "Household created successfully.",
      );
    } catch {
      setStatusMessage("We could not reach the server right now.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="card">
      <h2>{editMode ? "Edit Subscriber Household" : "Create Subscriber Household"}</h2>
      {currentHousehold ? (
        <p style={{ marginTop: 12 }}>
          <strong>Plan status:</strong> {currentHousehold.plan.statusLabel}
          {currentHousehold.plan.isTrialExpired
            ? " - Buy now to keep the household protected."
            : null}
        </p>
      ) : null}
      <form className="form-grid" onSubmit={handleSubmit}>
        <label>
          Caregiver name
          <input
            value={form.subscriberName}
            onChange={(event) => updateField("subscriberName", event.target.value)}
            onFocus={handleSelectOnFocus}
          />
        </label>
        <label>
          Caregiver email
          <input
            type="email"
            value={form.subscriberEmail}
            onChange={(event) => updateField("subscriberEmail", event.target.value)}
            onFocus={handleSelectOnFocus}
          />
        </label>
        <label>
          Caregiver phone
          <input
            value={form.subscriberPhone}
            onChange={(event) => updateField("subscriberPhone", event.target.value)}
            onFocus={handleSelectOnFocus}
          />
        </label>
        <label>
          Senior first name
          <input
            value={form.seniorFirstName}
            onChange={(event) => updateField("seniorFirstName", event.target.value)}
            onFocus={handleSelectOnFocus}
          />
        </label>
        <label>
          Senior last name
          <input
            value={form.seniorLastName}
            onChange={(event) => updateField("seniorLastName", event.target.value)}
            onFocus={handleSelectOnFocus}
          />
        </label>
        <label>
          Senior phone
          <input
            value={form.seniorPhone}
            onChange={(event) => updateField("seniorPhone", event.target.value)}
            onFocus={handleSelectOnFocus}
          />
        </label>
        <label className="form-grid-wide">
          Timezone
          <select
            value={form.timezone}
            onChange={(event) => updateField("timezone", event.target.value)}
          >
            {timezoneOptions.map((timezone) => (
              <option key={timezone} value={timezone}>
                {timezone}
              </option>
            ))}
          </select>
        </label>
        <label className="form-grid-compact">
          Check-in hour
          <select
            value={form.checkInHour}
            onChange={(event) => updateField("checkInHour", event.target.value)}
          >
            {checkInHourOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="form-grid-compact">
          Second attempt
          <select
            value={form.secondAttemptHours}
            onChange={(event) => updateField("secondAttemptHours", event.target.value)}
          >
            <option value="1">1 hour</option>
            <option value="2">2 hours</option>
            <option value="3">3 hours</option>
          </select>
        </label>
        <label>
          Primary contact name
          <input
            value={form.contactName}
            onChange={(event) => updateField("contactName", event.target.value)}
            onFocus={handleSelectOnFocus}
          />
        </label>
        <label>
          Contact relationship
          <input
            value={form.contactRelationship}
            onChange={(event) => updateField("contactRelationship", event.target.value)}
            onFocus={handleSelectOnFocus}
          />
        </label>
        <label>
          Contact phone
          <input
            value={form.contactPhone}
            onChange={(event) => updateField("contactPhone", event.target.value)}
            onFocus={handleSelectOnFocus}
          />
        </label>
        <div className="form-actions">
          <button className="button primary" type="submit" disabled={submitting}>
            {submitting
              ? editMode
                ? "Saving..."
                : "Creating..."
              : editMode
                ? "Update Household"
                : "Create Household"}
          </button>
          {currentHousehold?.plan.showBuyNow ? (
            <CheckoutButton
              subscriberId={savedHousehold?.subscriber.id ?? currentHousehold.subscriber.id}
              customerEmail={savedHousehold?.subscriber.email ?? currentHousehold.subscriber.email}
            />
          ) : null}
        </div>
      </form>
      {statusMessage && !savedHousehold ? <p style={{ marginTop: 16 }}>{statusMessage}</p> : null}
      {savedHousehold ? (
        <div className="result-panel">
          <p className="result-panel-kicker">
            {editMode ? "Household Updated" : "Household Created"}
          </p>
          <h3>
            {savedHousehold.senior.firstName} {savedHousehold.senior.lastName} is set up and ready.
          </h3>
          <p className="result-panel-summary">
            Caregiver: {savedHousehold.subscriber.fullName}. Primary contact:{" "}
            {savedHousehold.contact.fullName}.
          </p>
          {firstCheckInScheduledLabel ? (
            <p className="result-panel-summary">
              First check-in is scheduled for {firstCheckInScheduledLabel}.
            </p>
          ) : null}
          {firstCheckIn ? (
            <div className="result-panel-actions">
              <Link href="/dashboard" className="button primary">
                View Family Dashboard
              </Link>
              <Link href={`/checkin/${firstCheckIn.token}`} className="button secondary">
                Preview First Check-In
              </Link>
            </div>
          ) : (
            <div className="result-panel-actions">
              <Link href="/dashboard" className="button primary">
                View Family Dashboard
              </Link>
            </div>
          )}
          {firstCheckInMessage ? (
            <p className="result-panel-note">{firstCheckInMessage}</p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
