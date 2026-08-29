"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { BuyNowButton } from "@/components/buy-now-button";
import { BillingCurrency } from "@/lib/pricing";
import { normalizeTimeZone, timeZoneOptions } from "@/lib/timezones";
import {
  CLICKWRAP_SENIOR_ADD_LABEL,
  CLICKWRAP_SENIOR_SMS_OPERATIONAL_LABEL,
  CLICKWRAP_MARKETING_EMAIL_LABEL,
  LEGAL_DISCLAIMER_CONDENSED,
  TOS_VERSION_CURRENT,
  PRIVACY_VERSION_CURRENT,
  FREE_TRIAL_DOES_NOT_AUTO_CONVERT,
  EMERGENCY_WARNING_ONBOARDING,
  EMERGENCY_WARNING_SENIOR_SETUP,
} from "@/lib/constants";

type HouseholdResponse = {
  ok: boolean;
  message?: string;
  firstCheckIn?: {
    token: string;
    scheduledFor: string;
  };
  firstCheckInScheduledFor?: string;
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
      active?: boolean;
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
    billingCurrency: BillingCurrency;
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
    active: boolean;
  };
  contact: {
    id: string;
    fullName: string;
    relationship: string;
    phoneNumber: string;
  };
  additionalContacts: {
    id: string;
    fullName: string;
    relationship: string;
    phoneNumber: string;
  }[];
  plan: {
    isPaidSubscriber: boolean;
    isFreeTrial: boolean;
    isTrialExpired: boolean;
    showBuyNow: boolean;
    statusLabel: string;
    buyNowIntent: "BUY_NOW" | "POPUP_ALREADY_SUBSCRIBED" | "POPUP_HAS_TIME_REMAINING";
    periodEndsAt: Date;
    timeRemainingLabel: string | null;
  };
};

type AdditionalContactState = {
  fullName: string;
  relationship: string;
  phone: string;
};

const MAX_ADDITIONAL_CONTACTS = 1;

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

function stripNorthAmericanCountryCode(raw: string): string {
  const value = String(raw ?? "").trim();
  if (value.startsWith("+1")) return value.slice(2);
  if (value.startsWith("1") && value.length === 11) return value.slice(1);
  return value;
}

const initialForm = {
  subscriberName: "Caregiver Demo",
  subscriberEmail: "caregiver@example.com",
  subscriberPhone: stripNorthAmericanCountryCode("+15551230001"),
  billingCurrency: "USD" as BillingCurrency,
  seniorFirstName: "Margaret",
  seniorLastName: "Johnson",
  seniorPhone: stripNorthAmericanCountryCode("+15551230002"),
  timezone: "America/Toronto",
  checkInTime: "540",
  secondAttemptHours: "1",
  seniorActive: true,
  contactName: "David Johnson",
  contactRelationship: "Son",
  contactPhone: stripNorthAmericanCountryCode("+15551230003"),
  additionalContacts: [] as AdditionalContactState[],
  seniorOperationalSmsConsent: false,
  marketingEmailConsent: false,
};

const blankDefaultForm = {
  subscriberName: "",
  subscriberEmail: "",
  subscriberPhone: "",
  billingCurrency: "USD" as BillingCurrency,
  seniorFirstName: "",
  seniorLastName: "",
  seniorPhone: "",
  timezone: "America/Toronto",
  checkInTime: "540",
  secondAttemptHours: "1",
  seniorActive: true,
  contactName: "",
  contactRelationship: "",
  contactPhone: "",
  additionalContacts: [] as AdditionalContactState[],
  seniorOperationalSmsConsent: false,
  marketingEmailConsent: false,
};

function buildInitialForm(
  currentHousehold?: CurrentHousehold | null,
  signupDefaults?: OnboardingFormProps["signupDefaults"],
) {
  if (currentHousehold) {
    return {
      subscriberName: currentHousehold.subscriber.fullName,
      subscriberEmail: currentHousehold.subscriber.email,
      subscriberPhone: stripNorthAmericanCountryCode(currentHousehold.subscriber.phoneNumber),
      billingCurrency: currentHousehold.subscriber.billingCurrency,
      seniorFirstName: currentHousehold.senior.firstName,
      seniorLastName: currentHousehold.senior.lastName,
      seniorPhone: stripNorthAmericanCountryCode(currentHousehold.senior.phoneNumber),
      timezone: normalizeTimeZone(currentHousehold.senior.timezone),
      checkInTime: String(
        currentHousehold.senior.checkInHour * 60 + currentHousehold.senior.checkInMinute,
      ),
      secondAttemptHours: String(currentHousehold.senior.secondAttemptHours),
      seniorActive: currentHousehold.senior.active,
      contactName: currentHousehold.contact.fullName,
      contactRelationship: currentHousehold.contact.relationship,
      contactPhone: stripNorthAmericanCountryCode(currentHousehold.contact.phoneNumber),
      additionalContacts: (currentHousehold.additionalContacts ?? []).map((c) => ({
        fullName: c.fullName,
        relationship: c.relationship,
        phone: stripNorthAmericanCountryCode(c.phoneNumber),
      })),
      seniorOperationalSmsConsent: false,
      marketingEmailConsent: false,
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
  const priorActiveRef = useRef<boolean | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [savedHousehold, setSavedHousehold] = useState<HouseholdResponse["household"]>();
  const [firstCheckIn, setFirstCheckIn] = useState<HouseholdResponse["firstCheckIn"]>();
  const [firstCheckInScheduledFor, setFirstCheckInScheduledFor] = useState<string>();
  const [firstCheckInMessage, setFirstCheckInMessage] = useState<string>();
  const [testMessage, setTestMessage] = useState<string>();
  const [testCheckInToken, setTestCheckInToken] = useState<string>();
  const [testSubmitting, setTestSubmitting] = useState(false);
  const [caregiverConsentChecked, setCaregiverConsentChecked] = useState(false);
  const firstCheckInScheduledLabel = formatScheduledFor(
    firstCheckInScheduledFor ?? firstCheckIn?.scheduledFor,
    savedHousehold?.senior.timezone ?? form.timezone,
  );

  function updateField(name: keyof typeof initialForm, value: string | AdditionalContactState[]) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function updateActiveField(value: boolean) {
    setForm((current) => ({
      ...current,
      seniorActive: value,
    }));
  }

  function addAdditionalContact() {
    setForm((current) => {
      const existing = current.additionalContacts ?? [];
      if (existing.length >= MAX_ADDITIONAL_CONTACTS) return current;
      return {
        ...current,
        additionalContacts: [...existing, { fullName: "", relationship: "", phone: "" }],
      };
    });
  }

  function removeAdditionalContact(index: number) {
    setForm((current) => {
      const existing = current.additionalContacts ?? [];
      return {
        ...current,
        additionalContacts: existing.filter((_, i) => i !== index),
      };
    });
  }

  function updateAdditionalContact(
    index: number,
    field: keyof AdditionalContactState,
    value: string,
  ) {
    setForm((current) => {
      const existing = current.additionalContacts ?? [];
      const updated = existing.map((c, i) =>
        i === index ? { ...c, [field]: value } : c,
      );
      return { ...current, additionalContacts: updated };
    });
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

    if (!caregiverConsentChecked) {
      setStatusMessage(
        "Please confirm that you are authorized to provide the senior's contact details and acknowledge the non-emergency service disclaimer.",
      );
      return;
    }
    if (!form.seniorOperationalSmsConsent) {
      setStatusMessage(
        "Please confirm Senior SMS Check-In Consent before continuing — you must be authorized to provide the senior's mobile number for check-in SMS.",
      );
      return;
    }

    setSubmitting(true);
    setSavedHousehold(undefined);
    setFirstCheckIn(undefined);
    setFirstCheckInMessage(undefined);
    setTestMessage(undefined);
    setTestCheckInToken(undefined);
    priorActiveRef.current = form.seniorActive;
    setStatusMessage(editMode ? "Updating household..." : "Creating household...");

    try {
      const totalMinutes = Number(form.checkInTime);
      const checkInHour = Math.floor(totalMinutes / 60);
      const checkInMinute = totalMinutes % 60;
      const additionalContacts = (form.additionalContacts ?? []).map((c) => ({
        fullName: c.fullName,
        relationship: c.relationship,
        phoneNumber: c.phone,
      }));
      const payload = {
        subscriberId: currentHousehold?.subscriber.id,
        subscriber: {
          fullName: form.subscriberName,
          email: form.subscriberEmail,
          phoneNumber: form.subscriberPhone,
          billingCurrency: form.billingCurrency,
        },
        senior: {
          firstName: form.seniorFirstName,
          lastName: form.seniorLastName,
          phoneNumber: form.seniorPhone,
          timezone: form.timezone,
          checkInHour,
          checkInMinute,
          secondAttemptHours: Number(form.secondAttemptHours),
          active: form.seniorActive,
        },
        primaryContact: {
          fullName: form.contactName,
          relationship: form.contactRelationship,
          phoneNumber: form.contactPhone,
        },
        additionalContacts,
        caregiverAck: true,
        tosVersion: TOS_VERSION_CURRENT,
        privacyVersion: PRIVACY_VERSION_CURRENT,
        seniorOperationalSmsConsent: Boolean(form.seniorOperationalSmsConsent),
        marketingEmailConsent: Boolean(form.marketingEmailConsent),
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
      setFirstCheckInScheduledFor(data.firstCheckInScheduledFor);
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
      const baseMessage = editMode
        ? data.message ?? "Household updated successfully."
        : "Household created successfully.";
      const wasActive = priorActiveRef.current;
      const isNowActive = data.household?.senior?.active ?? true;
      if (editMode && typeof wasActive === "boolean" && wasActive !== isNowActive) {
        if (!isNowActive) {
          setStatusMessage(
            `${baseMessage} Tomorrow and future check-ins for ${data.household?.senior?.firstName ?? form.seniorFirstName} will not be scheduled. Any check-in already scheduled for later today may still run.`,
          );
        } else {
          setStatusMessage(
            `${baseMessage} Check-ins for ${data.household?.senior?.firstName ?? form.seniorFirstName} will start again tomorrow morning at her preferred hour. Today will NOT be auto-scheduled.`,
          );
        }
      } else {
        setStatusMessage(baseMessage);
      }
      priorActiveRef.current = null;
      if (!editMode) {
        setForm(blankDefaultForm);
      }
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
      {!editMode ? (
        <p
          style={{
            marginTop: 12,
            marginBottom: 4,
            padding: "10px 14px",
            borderRadius: 10,
            background: "color-mix(in srgb, var(--primary) 8%, transparent)",
            border: "1px solid color-mix(in srgb, var(--primary) 22%, var(--border))",
            color: "var(--muted)",
            fontSize: 14,
            lineHeight: 1.5,
          }}
        >
          For best sign up experience use a laptop or a desktop computer.
        </p>
      ) : null}
      <form className="form-grid" onSubmit={handleSubmit}>
        <style>{`
          .section-card-blue input,
          .section-card-blue select,
          .section-card-blue .phone-input-group,
          .section-card-blue .region-pick-card {
            background: color-mix(in srgb, var(--primary) 14%, transparent) !important;
            border-color: color-mix(in srgb, var(--primary) 30%, var(--border)) !important;
          }
          .section-card-green input,
          .section-card-green select,
          .section-card-green .phone-input-group {
            background: color-mix(in srgb, rgb(34, 197, 94) 14%, transparent) !important;
            border-color: color-mix(in srgb, rgb(34, 197, 94) 30%, var(--border)) !important;
          }
          .section-card-yellow input,
          .section-card-yellow select,
          .section-card-yellow .phone-input-group {
            background: color-mix(in srgb, rgb(250, 204, 21) 14%, transparent) !important;
            border-color: color-mix(in srgb, rgb(250, 204, 21) 30%, var(--border)) !important;
          }
        `}</style>
        <div
          className="section-card-blue"
          style={{
            gridColumn: "1 / -1",
            padding: "12px 14px 6px",
            marginTop: 2,
            marginBottom: 8,
            borderRadius: 12,
            border: "1px solid color-mix(in srgb, var(--primary) 24%, var(--border))",
            background: "color-mix(in srgb, var(--primary) 8%, transparent)",
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>Account Manager</div>
          <p style={{ marginTop: 0, marginBottom: 8, fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>
            You&apos;re responsible for setting up and managing this account.
          </p>
          <div className="form-grid">
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
          <div className="phone-input-group">
            <span className="phone-input-prefix">+1</span>
            <input
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="10-digit number"
              value={form.subscriberPhone}
              onChange={(event) => updateField("subscriberPhone", event.target.value)}
              onFocus={handleSelectOnFocus}
            />
          </div>
        </label>
        <div className="form-grid-wide">
          <div className="region-pick-heading-row">
            <div>
              <p className="region-pick-heading-title">Your region &amp; pricing</p>
              <p className="region-pick-heading-note">
                Choose the region that matches where you live. This sets the currency and the price you&apos;ll pay if you decide to subscribe after your free trial. The 7-day free trial does not automatically convert to a paid subscription — no credit card is required to start.
              </p>
            </div>
          </div>
          <div
            className="region-pick-row"
            role="radiogroup"
            aria-label="Region and pricing"
          >
            {[
              {
                value: "USD" as BillingCurrency,
                label: "🇺🇸 United States",
                price: "USD $14.99 / month",
                detail: "Or USD $144.00 per year (save ~20% · approx. $11.99/month)",
              },
              {
                value: "CAD" as BillingCurrency,
                label: "🇨🇦 Canada",
                price: "CAD $19.99 / month",
                detail: "Or CAD $180.00 per year (save ~20% · approx. $14.99/month)",
              },
            ].map((option) => {
              const selected = form.billingCurrency === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => updateField("billingCurrency", option.value)}
                  className={
                    selected ? "region-pick-card region-pick-card-active" : "region-pick-card"
                  }
                >
                  <p className="region-pick-title">{option.label}</p>
                  <p className="region-pick-price">{option.price}</p>
                  <p className="region-pick-detail">{option.detail}</p>
                </button>
              );
            })}
          </div>
        </div>
          <div
            className="form-grid-wide"
            style={{
              border: "2px solid rgb(250, 204, 21)",
              background: "rgba(250, 204, 21, 0.08)",
              padding: 12,
              borderRadius: 12,
              marginTop: 6,
              marginBottom: 4,
            }}
          >
            <p style={{ marginTop: 0, marginBottom: 0 }}>
              <strong>{EMERGENCY_WARNING_ONBOARDING}</strong>
            </p>
          </div>
          <div
            className="form-grid-wide"
            style={{
              border: "2px solid rgb(250, 204, 21)",
              background: "rgba(250, 204, 21, 0.08)",
              padding: 12,
              borderRadius: 12,
            }}
          >
            <p style={{ marginTop: 0, marginBottom: 0 }}>
              <strong>{LEGAL_DISCLAIMER_CONDENSED}</strong>
            </p>
          </div>
          </div>
        </div>
        <div
          className="section-card-green"
          style={{
            gridColumn: "1 / -1",
            padding: "12px 14px 6px",
            marginTop: 2,
            marginBottom: 8,
            borderRadius: 12,
            border: "1px solid color-mix(in srgb, rgb(34, 197, 94) 24%, var(--border))",
            background: "color-mix(in srgb, rgb(34, 197, 94) 8%, transparent)",
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>Senior</div>
          <p style={{ marginTop: 0, marginBottom: 8, fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>
            Warm-Hello will send scheduled check-in messages to this phone number.
          </p>
          <p
            style={{
              margin: "0 0 10px",
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid color-mix(in oklab, rgb(250, 204, 21) 45%, var(--border))",
              background: "rgba(250, 204, 21, 0.06)",
              fontSize: 13,
              lineHeight: 1.55,
            }}
          >
            <strong>{EMERGENCY_WARNING_SENIOR_SETUP}</strong>
          </p>
          <div className="form-grid">
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
          Senior cell phone
          <div className="phone-input-group">
            <span className="phone-input-prefix">+1</span>
            <input
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="10-digit number"
              value={form.seniorPhone}
              onChange={(event) => updateField("seniorPhone", event.target.value)}
              onFocus={handleSelectOnFocus}
            />
          </div>
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
            <label className="form-grid-wide checkbox-grid-row">
              <input
                type="checkbox"
                checked={form.seniorActive}
                onChange={(event) => updateActiveField(event.target.checked)}
              />
              <div>
                <div className="checkbox-title">
                  Schedule daily check-in calls for {form.seniorFirstName || "your loved one"}
                </div>
                <div className="checkbox-note">
                  We&apos;ll call at her preferred hour every morning. Un-check to pause while she&apos;s on vacation or staying with family.
                  Remember to turn it back on when she returns - we will not auto-resume.
                </div>
              </div>
            </label>
          </div>
        </div>
        <div
          className="section-card-yellow"
          style={{
            gridColumn: "1 / -1",
            padding: "12px 14px 6px",
            marginTop: 2,
            marginBottom: 8,
            borderRadius: 12,
            border: "1px solid color-mix(in srgb, rgb(250, 204, 21) 24%, var(--border))",
            background: "color-mix(in srgb, rgb(250, 204, 21) 8%, transparent)",
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>Contacts Detail</div>
          <div className="form-grid">
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
          Contact cell phone
          <div className="phone-input-group">
            <span className="phone-input-prefix">+1</span>
            <input
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="10-digit number"
              value={form.contactPhone}
              onChange={(event) => updateField("contactPhone", event.target.value)}
              onFocus={handleSelectOnFocus}
            />
          </div>
        </label>
        {(form.additionalContacts ?? []).map((additional, index) => (
          <div
            key={index}
            className="form-grid-wide"
            style={{
              background: "color-mix(in srgb, rgb(250, 204, 21) 8%, transparent)",
              border: "1px solid color-mix(in srgb, rgb(250, 204, 21) 24%, var(--border))",
              borderRadius: 12,
              padding: "14px 14px 4px",
              marginTop: 8,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: 12,
                marginBottom: 8,
              }}
            >
              <strong>Additional contact #{index + 1}</strong>
              <button
                type="button"
                className="button secondary"
                onClick={() => removeAdditionalContact(index)}
                style={{ padding: "6px 12px", fontSize: 14 }}
              >
                Remove
              </button>
            </div>
            <div className="form-grid" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
              <label>
                Second contact name
                <input
                  value={additional.fullName}
                  onChange={(event) =>
                    updateAdditionalContact(index, "fullName", event.target.value)
                  }
                  onFocus={handleSelectOnFocus}
                />
              </label>
              <label>
                Relationship
                <input
                  value={additional.relationship}
                  onChange={(event) =>
                    updateAdditionalContact(index, "relationship", event.target.value)
                  }
                  onFocus={handleSelectOnFocus}
                />
              </label>
              <label>
                Second contact cell phone
                <div className="phone-input-group">
                  <span className="phone-input-prefix">+1</span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    placeholder="10-digit number"
                    value={additional.phone}
                    onChange={(event) =>
                      updateAdditionalContact(index, "phone", event.target.value)
                    }
                    onFocus={handleSelectOnFocus}
                  />
                </div>
              </label>
            </div>
          </div>
        ))}
            {(form.additionalContacts ?? []).length < MAX_ADDITIONAL_CONTACTS ? (
              <div className="form-grid-wide" style={{ marginTop: 4 }}>
                <button
                  type="button"
                  className="button secondary"
                  onClick={addAdditionalContact}
                >
                  + Add another contact
                </button>
                <p
                  style={{
                    marginTop: 8,
                    color: "rgb(148, 163, 184)",
                    fontSize: 13,
                  }}
                >
                  Up to 2 total trusted escalation contacts (1 primary + 1 additional) will all receive the check-in confirmation and escalation SMS messages.
                </p>
              </div>
            ) : null}
          </div>
        </div>
        <label
          className="form-grid-wide checkbox-grid-row"
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
            padding: "16px",
            border: "1px solid var(--border)",
            borderRadius: 12,
            background: "rgba(15, 23, 42, 0.3)",
          }}
        >
          <input
            type="checkbox"
            checked={caregiverConsentChecked}
            onChange={(event) => setCaregiverConsentChecked(event.target.checked)}
          />
          <div style={{ fontSize: 14, lineHeight: 1.55 }}>
            <div style={{ whiteSpace: "pre-line" }}>{CLICKWRAP_SENIOR_ADD_LABEL}</div>
            <div style={{ marginTop: 6, fontSize: 13, color: "var(--muted)" }}>
              <Link href="/terms" className="inline-link">
                Terms of Service
              </Link>{" "}
              ·{" "}
              <Link href="/privacy" className="inline-link">
                Privacy Policy
              </Link>
            </div>
          </div>
        </label>
        <label
          className="form-grid-wide checkbox-grid-row"
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
            padding: "16px",
            border: "1px solid color-mix(in oklab, rgb(16, 185, 129) 50%, var(--border))",
            borderRadius: 12,
            background: "color-mix(in oklab, rgb(16, 185, 129) 7%, transparent)",
          }}
        >
          <input
            type="checkbox"
            checked={Boolean(form.seniorOperationalSmsConsent)}
            onChange={(event) =>
              updateField("seniorOperationalSmsConsent", event.target.checked as any)
            }
          />
          <div style={{ fontSize: 14, lineHeight: 1.55 }}>
            <div style={{ whiteSpace: "pre-line" }}>
              {CLICKWRAP_SENIOR_SMS_OPERATIONAL_LABEL}
            </div>
          </div>
        </label>
        <label
          className="form-grid-wide checkbox-grid-row"
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
            padding: "16px",
            border: "1px dashed var(--border)",
            borderRadius: 12,
            background: "transparent",
          }}
        >
          <input
            type="checkbox"
            checked={Boolean(form.marketingEmailConsent)}
            onChange={(event) =>
              updateField("marketingEmailConsent", event.target.checked as any)
            }
          />
          <div style={{ fontSize: 14, lineHeight: 1.55 }}>
            <div style={{ whiteSpace: "pre-line" }}>{CLICKWRAP_MARKETING_EMAIL_LABEL}</div>
          </div>
        </label>
        <p
          className="form-grid-wide"
          style={{
            margin: 0,
            padding: "12px 14px",
            borderRadius: 10,
            border: "1px dashed color-mix(in oklab, rgb(59, 130, 246) 40%, var(--border))",
            color: "var(--muted)",
            fontSize: 13,
            lineHeight: 1.6,
          }}
        >
          <strong>Free trial — no payment required.</strong> {FREE_TRIAL_DOES_NOT_AUTO_CONVERT}
        </p>
        <div className="form-actions">
          <button
            className="button primary"
            type="submit"
            disabled={submitting || !caregiverConsentChecked || !form.seniorOperationalSmsConsent}
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
            disabled={submitting || !caregiverConsentChecked}
            onClick={() => {
              submitIntent.current = "saveAndTest";
            }}
          >
            {editMode ? "Update + Test" : "Create + Test"}
          </button>
          {currentHousehold ? (
            <BuyNowButton
              subscriberId={savedHousehold?.subscriber.id ?? currentHousehold.subscriber.id}
              intent={currentHousehold.plan.buyNowIntent}
              timeRemainingLabel={currentHousehold.plan.timeRemainingLabel}
              className="button buy-now-button"
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
            {(savedHousehold as unknown as { additionalContacts?: { fullName: string }[] })
              .additionalContacts?.length
              ? `. Additional contacts: ${
                  (
                    savedHousehold as unknown as {
                      additionalContacts: { fullName: string }[];
                    }
                  ).additionalContacts
                    .map((c) => c.fullName)
                    .join(", ")
                }.`
              : ""}
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
              <Link href={`/checkin/${firstCheckIn.token}?preview=1`} className="button secondary">
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
              <Link href={`/checkin/${testCheckInToken}?preview=1`} className="button secondary">
                Open Test Check-In Link
              </Link>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
