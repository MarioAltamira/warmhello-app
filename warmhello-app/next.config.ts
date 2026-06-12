import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "prisma", "stripe", "twilio"],
  typedRoutes: true,
};

export default nextConfig;
