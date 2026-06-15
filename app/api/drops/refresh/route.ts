import { NextResponse } from "next/server";
import { refreshDrops } from "@/lib/drops/refresh";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Generous budget — fetching ~16 endpoints + DB writes
export const maxDuration = 60;

/**
 * Drop refresh endpoint. Hit by Vercel Cron (or curl in dev).
 *
 * Auth model:
 *   - In production: requires `Authorization: Bearer <secret>` OR `?secret=`,
 *     where <secret> is DROPS_REFRESH_SECRET or CRON_SECRET (Vercel Cron sends
 *     `Authorization: Bearer $CRON_SECRET` automatically when that env is set).
 *   - In dev (NODE_ENV !== "production"): if no secret env var is set,
 *     unauthenticated calls are allowed for convenience.
 */
function authorize(req: Request): boolean {
  const secrets = [
    process.env.DROPS_REFRESH_SECRET,
    process.env.CRON_SECRET,
  ].filter(Boolean) as string[];
  if (secrets.length === 0) return process.env.NODE_ENV !== "production";

  const auth = req.headers.get("authorization");
  const qp = new URL(req.url).searchParams.get("secret");
  return secrets.some((s) => auth === `Bearer ${s}` || qp === s);
}

async function handler(req: Request) {
  if (!authorize(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const t0 = Date.now();
  try {
    const result = await refreshDrops();
    return NextResponse.json({
      ok: true,
      durationMs: Date.now() - t0,
      ...result,
    });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        durationMs: Date.now() - t0,
        error: e instanceof Error ? e.message : String(e),
      },
      { status: 500 },
    );
  }
}

export const GET = handler;
export const POST = handler;
