import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // @ts-ignore - Next.js 16 requires this to silence webpack conflict error
  turbopack: {},
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
