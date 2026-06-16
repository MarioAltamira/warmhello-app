import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "prisma", "stripe"],
  typedRoutes: true,
};

export default nextConfig;
