// Server-side PostHog: small wrapper that returns null when no key is set.
// Use posthogServer()?.capture(...) so calls become no-ops without config.

import { PostHog } from "posthog-node";

let client: PostHog | null = null;

export function posthogServer(): PostHog | null {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return null;
  if (client) return client;
  client = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
    flushAt: 1,           // small site — send immediately
    flushInterval: 5_000,
  });
  return client;
}

/**
 * Capture a server-side event. Identified by user.id when known, else anonymous.
 * Privacy: we never send email or PII. Categories + counts + flags only.
 */
export function captureServerEvent(
  event: string,
  opts: { distinctId?: string; properties?: Record<string, unknown> } = {},
) {
  const ph = posthogServer();
  if (!ph) return;
  ph.capture({
    event,
    distinctId: opts.distinctId ?? "anonymous",
    properties: opts.properties ?? {},
  });
}
