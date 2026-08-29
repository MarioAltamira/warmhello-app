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
    "Warm-Hello is a no-app, one-tap daily SMS check-in service for seniors living independently. A simple morning routine to help families stay connected.",
  keywords: [
    "senior check in service",
    "daily check in for elderly",
    "elderly daily check in",
    "senior living alone check in",
    "SMS check in for seniors",
    "daily text message check in elderly",
    "check on elderly parents daily",
    "alternatives to daily operator check-in calls",
    "daily reassurance service seniors",
    "family stay connected tool",
    "gentle morning check in SMS",
    "senior daily check in app",
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
      "A no-app, one-tap daily SMS check-in service for seniors living independently. Seniors tap one large button to confirm they started their day; designated family contacts are notified if checks are missed.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Warm-Hello - Gentle daily SMS check-ins for seniors living alone. Senior dignity first, families stay connected.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@warmhello",
    creator: "@warmhello",
    title: "Warm-Hello | Gentle Daily SMS Check-Ins for Seniors Living Alone",
    description:
      "A no-app, one-tap daily SMS check-in service for seniors living independently. Senior dignity first, families stay connected.",
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
  category: "Lifestyle",
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
