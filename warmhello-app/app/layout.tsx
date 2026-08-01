import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Warm_Hello",
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
        {children}
      </body>
    </html>
  );
}
