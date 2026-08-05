"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { normalizeTimeZone, timeZoneOptions } from "@/lib/timezones";

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
      checkInMinute?: number;
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
    checkInMinute: number;
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

function formatTimeLabel(hour: number, minute: number) {
  const ampm = hour < 12 ? "AM" : "PM";
  const displayHour = ((hour + 11) % 12) + 1;
  const minuteLabel = String(minute).padStart(2, "0");
  return `${String(displayHour).padStart(2, "0")}:${minuteLabel} ${ampm}`;
}

const checkInTimeOptions = Array.from({ length: 96 }, (_, index) => {
  const totalMinutes = index * 15;
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  return {
    value: String(totalMinutes),
    label: formatTimeLabel(hour, minute),
  };
});

const initialForm = {
  subscriberName: "Caregiver Demo",
  subscriberEmail: "caregiver@example.com",
  subscriberPhone: "+15551230001",
  seniorFirstName: "Margaret",
  seniorLastName: "Johnson",
  seniorPhone: "+15551230002",
  timezone: "America/Toronto",
  checkInTime: "540",
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
      timezone: normalizeTimeZone(currentHousehold.senior.timezone),
      checkInTime: String(
        currentHousehold.senior.checkInHour * 60 + currentHousehold.senior.checkInMinute,
      ),
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

function formatScheduledFor(value?: string, timeZone?: string) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  const resolvedTimeZone = timeZone ? normalizeTimeZone(timeZone) : undefined;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
    ...(resolvedTimeZone ? { timeZone: resolvedTimeZone } : {}),
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
  const submitIntent = useRef<"save" | "saveAndTest">("save");
  const [statusMessage, setStatusMessage] = useState("");
  const [savedHousehold, setSavedHousehold] = useState<HouseholdResponse["household"]>();
  const [firstCheckIn, setFirstCheckIn] = useState<HouseholdResponse["firstCheckIn"]>();
  const [firstCheckInMessage, setFirstCheckInMessage] = useState<string>();
  const [testMessage, setTestMessage] = useState<string>();
  const [testCheckInToken, setTestCheckInToken] = useState<string>();
  const [testSubmitting, setTestSubmitting] = useState(false);
  const firstCheckInScheduledLabel = formatScheduledFor(
    firstCheckIn?.scheduledFor,
    savedHousehold?.senior.timezone ?? form.timezone,
  );

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

  async function createTestCheckIn(household?: HouseholdResponse["household"]) {
    if (!household || testSubmitting) {
      return;
    }

    setTestSubmitting(true);
    setTestMessage("Sending test check-in...");
    setTestCheckInToken(undefined);
    try {
      const response = await fetch("/api/checkins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriberId: household.subscriber.id,
          seniorId: household.senior.id,
        }),
      });
      const data = (await response.json()) as { ok?: boolean; token?: string; message?: string };
      if (!response.ok || !data.ok || !data.token) {
        setTestMessage(data.message ?? "We could not send the test check-in.");
        return;
      }
      setTestCheckInToken(data.token);
      setTestMessage("Test check-in sent.");
    } catch {
      setTestMessage("We could not reach the server right now.");
    } finally {
      setTestSubmitting(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setSavedHousehold(undefined);
    setFirstCheckIn(undefined);
    setFirstCheckInMessage(undefined);
    setTestMessage(undefined);
    setTestCheckInToken(undefined);
    setStatusMessage(editMode ? "Updating household..." : "Creating household...");

    try {
      const totalMinutes = Number(form.checkInTime);
      const checkInHour = Math.floor(totalMinutes / 60);
      const checkInMinute = totalMinutes % 60;
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
          checkInHour,
          checkInMinute,
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
      if (submitIntent.current === "saveAndTest") {
        await createTestCheckIn(data.household);
      }
    } catch {
      setStatusMessage("We could not reach the server right now.");
    } finally {
      setSubmitting(false);
      submitIntent.current = "save";
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
            {timeZoneOptions.map((timezone) => (
              <option key={timezone.value} value={timezone.value}>
                {timezone.label}
              </option>
            ))}
          </select>
        </label>
        <label className="form-grid-compact">
          Check-in time
          <select
            value={form.checkInTime}
            onChange={(event) => updateField("checkInTime", event.target.value)}
          >
            {checkInTimeOptions.map((option) => (
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
          <button
            className="button primary"
            type="submit"
            disabled={submitting}
            onClick={() => {
              submitIntent.current = "save";
            }}
          >
            {submitting
              ? editMode
                ? "Saving..."
                : "Creating..."
              : editMode
                ? "Update Household"
                : "Create Household"}
          </button>
          <button
            className="button secondary"
            type="submit"
            disabled={submitting}
            onClick={() => {
              submitIntent.current = "saveAndTest";
            }}
          >
            {editMode ? "Update + Test" : "Create + Test"}
          </button>
          {currentHousehold?.plan.showBuyNow ? (
            <Link
              href={`/subscribe/${
                savedHousehold?.subscriber.id ?? currentHousehold.subscriber.id
              }`}
              className="button buy-now-button"
            >
              Buy Now
            </Link>
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
              <button
                type="button"
                className="button secondary"
                onClick={() => createTestCheckIn(savedHousehold)}
                disabled={testSubmitting}
              >
                {testSubmitting ? "Sending Test..." : "Send Test Check-In Now"}
              </button>
            </div>
          ) : (
            <div className="result-panel-actions">
              <Link href="/dashboard" className="button primary">
                View Family Dashboard
              </Link>
              <button
                type="button"
                className="button secondary"
                onClick={() => createTestCheckIn(savedHousehold)}
                disabled={testSubmitting}
              >
                {testSubmitting ? "Sending Test..." : "Send Test Check-In Now"}
              </button>
            </div>
          )}
          {firstCheckInMessage ? (
            <p className="result-panel-note">{firstCheckInMessage}</p>
          ) : null}
          {testMessage ? <p className="result-panel-note">{testMessage}</p> : null}
          {testCheckInToken ? (
            <div className="result-panel-actions">
              <Link href={`/checkin/${testCheckInToken}`} className="button secondary">
                Open Test Check-In Link
              </Link>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
