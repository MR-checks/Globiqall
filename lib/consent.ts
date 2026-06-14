// Tiny consent helper. Single source of truth for whether the user has
// opted in to analytics/replay. Lives in localStorage so it survives reloads
// without a cookie (no server roundtrip needed).

export type ConsentLevel = "essential" | "analytics";

const KEY = "globiqall:consent";

export function readConsent(): ConsentLevel | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(KEY);
  if (v === "essential" || v === "analytics") return v;
  return null;
}

export function setConsent(v: ConsentLevel): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, v);
  // Notify listeners (analytics provider, etc.)
  window.dispatchEvent(new CustomEvent("globiqall:consent-changed", { detail: v }));
}

export function clearConsent(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
  window.dispatchEvent(new CustomEvent("globiqall:consent-changed", { detail: null }));
}
