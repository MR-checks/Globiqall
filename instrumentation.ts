import * as Sentry from "@sentry/nextjs";

// Next.js calls this once per runtime. We initialize Sentry conditionally —
// without a DSN env var, the SDK is a no-op.
export async function register() {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Surface uncaught request errors to Sentry's request capture API.
export const onRequestError = Sentry.captureRequestError;
