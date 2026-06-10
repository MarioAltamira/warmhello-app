import type { Metadata } from "next";
import "./globals.css";
import { FloatingReturnButton } from "@/components/floating-return-button";

export const metadata: Metadata = {
  title: "StillGood",
  description: "Daily senior check-ins with Stripe, Twilio, Prisma, and Supabase.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="site-logo">
          <img
            src="/StillGood%20Logo.png?v=2"
            alt="StillGood"
            className="site-logo-image"
          />
        </div>
        {children}
        <FloatingReturnButton />
      </body>
    </html>
  );
}
