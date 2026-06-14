import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const config: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "appleid.cdn-apple.com" },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
};

// Only wrap with Sentry config when DSN is set (production usually).
// Without DSN, `withSentryConfig` still works but tunnels uploads — we want to
// skip the upload step entirely in builds without Sentry credentials.
export default process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(config, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      silent: true,
      tunnelRoute: "/api/monitoring",
      disableLogger: true,
      sourcemaps: { disable: false },
    })
  : config;
