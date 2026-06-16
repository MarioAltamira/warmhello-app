import type { Metadata } from "next";
import "./globals.css";
import { FloatingReturnButton } from "@/components/floating-return-button";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "WarmHello",
  description: "Daily senior check-ins with Stripe, Telnyx, Prisma, and Supabase.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light">
      <body>
        <SiteHeader />
        {children}
        <FloatingReturnButton />
      </body>
    </html>
  );
}
