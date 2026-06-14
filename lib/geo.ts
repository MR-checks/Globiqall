import { headers } from "next/headers";

/**
 * Resolve the request's country code from edge-set headers.
 * - Vercel: `x-vercel-ip-country`
 * - Cloudflare: `cf-ipcountry`
 * Returns a 2-letter ISO code (uppercased) or null when unknown.
 *
 * Local dev: if GLOBIQALL_DEV_FAKE_GEO=1, returns a stable-ish random pick from
 * a small pool so you can populate breakdowns for screenshots. Off by default.
 */
export async function detectCountry(): Promise<string | null> {
  const h = await headers();
  const v =
    h.get("x-vercel-ip-country") ||
    h.get("cf-ipcountry") ||
    h.get("x-globiqall-country"); // testing override
  if (v && /^[A-Za-z]{2}$/.test(v)) return v.toUpperCase();

  if (process.env.GLOBIQALL_DEV_FAKE_GEO === "1") {
    const pool = ["US", "GB", "DE", "FR", "BR", "IN", "JP", "NG", "KE", "MX", "ID", "ZA", "AU", "CA", "ES", "IT", "TR", "PH"];
    return pool[Math.floor(Math.random() * pool.length)];
  }
  return null;
}
