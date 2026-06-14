"use client";

import { clearConsent } from "@/lib/consent";

export function CookiePreferencesLink() {
  return (
    <button
      type="button"
      onClick={() => {
        clearConsent();
        window.dispatchEvent(new CustomEvent("globiqall:consent-reopen"));
      }}
      className="text-[13px] text-foreground/80 hover:text-foreground hover:underline underline-offset-4 decoration-accent transition-colors"
    >
      Cookie preferences
    </button>
  );
}
