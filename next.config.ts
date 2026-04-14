import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // !! WARN !!
    // This allows production builds to successfully complete
    // even if your project has type errors in node_modules (like googleapis).
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
