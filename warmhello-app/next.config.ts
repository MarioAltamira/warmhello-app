import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["stripe"],
  typedRoutes: true,
  typescript: {
    ignoreBuildErrors: !!process.env.DEPLOY_SKIP_TYPESCRIPT,
  },
};

export default nextConfig;
