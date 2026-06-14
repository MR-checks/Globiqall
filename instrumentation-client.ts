import * as Sentry from "@sentry/nextjs";

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0,
    // Session replay only when the user has consented to analytics.
    // The consent banner toggles this via `Sentry.getClient()?.getOptions()` updates.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    integrations: [Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true })],
    sendDefaultPii: false,
  });
}

// Hook required by next-themes / Next.js client-side navigation traces.
// Safe no-op when Sentry is disabled.
export const onRouterTransitionStart = process.env.NEXT_PUBLIC_SENTRY_DSN
  ? Sentry.captureRouterTransitionStart
  : () => {};
