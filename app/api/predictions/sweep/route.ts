import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notify } from "@/lib/notifications";
import { computeNemesisId } from "@/lib/tribes";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Periodic sweep (hit by GitHub Actions cron):
 *  1. Nudge authors whose predictions are past `resolvesAt` and still unresolved
 *     ("your prediction is due to resolve").
 *  2. Refresh stored nemesis for a bounded batch of active users so the rivalry
 *     notification loop has data to work with.
 *
 * Auth: Bearer PREDICTIONS_SWEEP_SECRET (or ?secret=). Dev allows unauthenticated.
 */
function authorize(req: Request): boolean {
  const secret = process.env.PREDICTIONS_SWEEP_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  if (req.headers.get("authorization") === `Bearer ${secret}`) return true;
  const url = new URL(req.url);
  return url.searchParams.get("secret") === secret;
}

async function handler(req: Request) {
  if (!authorize(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const t0 = Date.now();
  const now = new Date();

  // 1) Nudge due predictions
  const due = await db.poll.findMany({
    where: {
      mode: "PREDICTION",
      resolvedAt: null,
      resolveNudgedAt: null,
      resolvesAt: { not: null, lt: now },
    },
    select: { id: true, slug: true, title: true, authorId: true },
    take: 200,
  });
  for (const p of due) {
    await notify({
      userId: p.authorId,
      type: "PREDICTION_DUE",
      title: "Your prediction is ready to resolve",
      body: `"${p.title}" has passed its resolve time. Mark what happened to score everyone.`,
      href: `/p/${p.slug}`,
      pollId: p.id,
      email: true,
    }).catch(() => {});
    await db.poll.update({ where: { id: p.id }, data: { resolveNudgedAt: now } }).catch(() => {});
  }

  // 2) Refresh nemesis for a bounded batch of users who lack one
  const candidates = await db.user.findMany({
    where: { nemesisId: null },
    select: { id: true, _count: { select: { votes: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  let nemesisRefreshed = 0;
  for (const u of candidates) {
    if (u._count.votes < 5) continue;
    const nem = await computeNemesisId(u.id).catch(() => null);
    if (nem) {
      await db.user.update({ where: { id: u.id }, data: { nemesisId: nem } }).catch(() => {});
      nemesisRefreshed++;
    }
  }

  return NextResponse.json({
    ok: true,
    durationMs: Date.now() - t0,
    nudged: due.length,
    nemesisRefreshed,
  });
}

export const GET = handler;
export const POST = handler;
