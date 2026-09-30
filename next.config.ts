import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  agentRules: false,
  trailingSlash: true,
  ...(process.env.SITE_STATIC_EXPORT === "1" ? { output: "export" as const } : {}),
};

export default nextConfig;
