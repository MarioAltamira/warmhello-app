"use client";

import { YourPrivacyChoicesButton } from "@/components/privacy-choices-modal";

export function PrivacyChoicesInlineButton() {
  return <YourPrivacyChoicesButton variant="button" />;
}

export function PrivacyChoicesInlineLink() {
  return <YourPrivacyChoicesButton variant="link" />;
}
