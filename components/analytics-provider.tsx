"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import posthog from "posthog-js";
import { readConsent } from "@/lib/consent";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

let phInitialized = false;

/**
 * Mounts client-side analytics, but only when the user has opted in.
 * Listens for consent changes so toggling in the cookie banner takes effect
 * immediately without a reload.
 */
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [enabled, setEnabled] = React.useState(false);

  React.useEffect(() => {
    const apply = () => setEnabled(readConsent() === "analytics");
    apply();
    const handler = () => apply();
    window.addEventListener("globiqall:consent-changed", handler);
    return () => window.removeEventListener("globiqall:consent-changed", handler);
  }, []);

  // Lazy-init PostHog once, only if enabled + configured.
  React.useEffect(() => {
    if (!enabled || !POSTHOG_KEY || phInitialized) return;
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      capture_pageview: false, // we send manual pageviews so we can scope them to consent
      capture_pageleave: true,
      person_profiles: "identified_only",
      autocapture: false, // explicit events only
      disable_session_recording: true, // off by default; opt-in via dashboard
    });
    phInitialized = true;
  }, [enabled]);

  // Send a pageview on every navigation change while opted in.
  React.useEffect(() => {
    if (!enabled || !phInitialized || !pathname) return;
    posthog.capture("$pageview", { $current_url: window.location.href });
  }, [pathname, enabled]);

  // If user revoked consent, kill capture
  React.useEffect(() => {
    if (phInitialized && !enabled) {
      posthog.opt_out_capturing();
    } else if (phInitialized && enabled) {
      posthog.opt_in_capturing();
    }
  }, [enabled]);

  return <>{children}</>;
}
