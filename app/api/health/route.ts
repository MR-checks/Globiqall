import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Liveness + readiness probe for uptime monitors (BetterStack / Pingdom / etc.).
 * Returns 200 only when the database is reachable. Cheap query, sub-50ms.
 */
export async function GET() {
  const started = Date.now();
  try {
    await db.$queryRawUnsafe("SELECT 1");
    return NextResponse.json(
      {
        ok: true,
        durationMs: Date.now() - started,
        service: "globiqall",
        version: process.env.npm_package_version ?? "0.1.0",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        durationMs: Date.now() - started,
        error: err instanceof Error ? err.message : "db unreachable",
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
