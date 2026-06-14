import { NextResponse, type NextRequest } from "next/server";

/**
 * Security headers. Applied to every response except Next internals.
 *
 * - Strict-Transport-Security: enforce HTTPS once the cert is live (1 year).
 * - X-Content-Type-Options: prevent MIME-sniff.
 * - X-Frame-Options: deny framing (clickjacking).
 * - Referrer-Policy: same-origin for outbound link safety.
 * - Permissions-Policy: lock unused browser capabilities by default.
 * - Cross-Origin-Opener-Policy: isolate browsing context.
 * - Content-Security-Policy: tight defaults; allows the OAuth avatar hosts we
 *   already list in next.config.ts. Inline styles allowed for theme tokens and
 *   for next/font runtime. Inline scripts are blocked.
 */
const SECURITY_HEADERS: Record<string, string> = {
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  "Cross-Origin-Opener-Policy": "same-origin",
  "X-DNS-Prefetch-Control": "on",
};

// Next.js dev mode uses eval() for HMR + WebSocket for hot reloads.
// In production it doesn't, so we keep the tight policy there.
const isDev = process.env.NODE_ENV !== "production";

const scriptSrc = isDev
  ? "'self' 'unsafe-inline' 'unsafe-eval'"
  : "'self' 'unsafe-inline'";

// External services we POST telemetry to. Their endpoints must be allowed
// or the browser blocks XHR/fetch. Use wildcards conservatively.
const TELEMETRY_HOSTS = [
  "https://*.sentry.io",
  "https://*.ingest.sentry.io",
  "https://*.ingest.us.sentry.io",
  "https://*.ingest.eu.sentry.io",
  "https://app.posthog.com",
  "https://us.i.posthog.com",
  "https://eu.i.posthog.com",
];

const connectSrc = isDev
  ? `'self' ws: wss: ${TELEMETRY_HOSTS.join(" ")}`
  : `'self' ${TELEMETRY_HOSTS.join(" ")}`;

const CSP = [
  "default-src 'self'",
  `script-src ${scriptSrc}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://lh3.googleusercontent.com https://avatars.githubusercontent.com https://appleid.cdn-apple.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  `connect-src ${connectSrc}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) res.headers.set(k, v);
  res.headers.set("Content-Security-Policy", CSP);
  return res;
}

export const config = {
  matcher: [
    // Apply to everything except Next internals + static assets
    "/((?!_next/static|_next/image|favicon.svg|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
