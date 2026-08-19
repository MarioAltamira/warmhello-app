import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://warm-hello.com"),
  applicationName: "Warm-Hello",
  title: {
    default: "Warm-Hello | Gentle Daily SMS Check-Ins for Seniors Living Alone",
    template: "%s · Warm-Hello",
  },
  description:
    "Warm-Hello is a no-app, one-tap daily SMS check-in service for seniors living independently. Give your parents safety and your family peace of mind - from just $0.16 a day.",
  keywords: [
    "senior check in service",
    "daily check in for elderly",
    "elderly daily check in",
    "senior safety check in",
    "senior living alone check in",
    "SMS check in for seniors",
    "daily text message check in elderly",
    "peace of mind for caregivers",
    "check on elderly parents daily",
    "alternatives to medical alert systems",
    "senior safety net",
    "daily reassurance service seniors",
    "WarmHello",
    "Warm-Hello",
  ],
  authors: [{ name: "Warm-Hello", url: "https://warm-hello.com" }],
  creator: "Warm-Hello",
  publisher: "Warm-Hello",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://warm-hello.com",
    siteName: "Warm-Hello",
    title: "Warm-Hello | Gentle Daily SMS Check-Ins for Seniors Living Alone",
    description:
      "A no-app, one-tap daily SMS check-in service for seniors living independently. Seniors confirm safety with a single tap; families get automatic escalation if they miss two checks.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Warm-Hello - Gentle daily SMS check-ins for seniors living alone. Caregiver peace of mind, senior dignity first.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@warmhello",
    creator: "@warmhello",
    title: "Warm-Hello | Gentle Daily SMS Check-Ins for Seniors Living Alone",
    description:
      "A no-app, one-tap daily SMS check-in service for seniors living independently. Peace of mind for caregivers, dignity for seniors.",
    images: ["/twitter-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  category: "Health",
};

export const viewport: Viewport = {
  themeColor: "#0b1220",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light">
      <body>{children}</body>
    </html>
  );
}
