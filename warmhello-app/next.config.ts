import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "prisma", "stripe"],
  typedRoutes: true,
  typescript: {
    ignoreBuildErrors: !!process.env.DEPLOY_SKIP_TYPESCRIPT,
  },
};

export default nextConfig;
