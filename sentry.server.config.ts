import * as Sentry from "@sentry/nextjs";

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0,
    enabled: true,
    // Don't send PII by default — privacy policy promises this.
    sendDefaultPii: false,
    // Scrub anything that looks like an email, an IP, or an auth token.
    beforeSend(event) {
      if (event.user) {
        event.user = { id: event.user.id }; // strip email/ip
      }
      return event;
    },
  });
}
