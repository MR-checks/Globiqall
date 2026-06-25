import { db } from "@/lib/db";
import { moderate } from "@/lib/moderation";
import {
  fetchGoogleNews,
  fetchHN,
  fetchProductHunt,
  fetchReddit,
  type RawDrop,
} from "@/lib/drops/sources";
import { anticipationScore, fingerprint, guessCategory } from "@/lib/drops/filter";

const MIN_SCORE = 2;
const EXPIRE_DAYS = 7;
const KEEP_TOP = 200; // hard cap on what we persist per refresh

export type RefreshResult = {
  fetched: number;
  filtered: number;
  inserted: number;
  refreshed: number; // existing fingerprints we touched (no-op in v1)
  expired: number;
  bySource: Record<string, number>;
};

export async function refreshDrops(): Promise<RefreshResult> {
  // Fetch everything in parallel; never let one bad source kill the run.
  const settled = await Promise.allSettled([
    fetchReddit(),
    fetchHN(),
    fetchProductHunt(),
    fetchGoogleNews(),
  ]);
  const all: RawDrop[] = [];
  for (const r of settled) {
    if (r.status === "fulfilled") all.push(...r.value);
  }

  const fetched = all.length;

  // Score + filter
  type Scored = RawDrop & { score: number; fp: string; category: string | null };
  const scored: Scored[] = [];
  const seen = new Set<string>();
  for (const r of all) {
    if (!r.title || r.title.length < 6) continue;
    const score = anticipationScore(r.title);
    if (score < MIN_SCORE) continue;
    // Final content guard, catch slurs/spam even from news sources
    const m = moderate(r.title, "title");
    if (!m.ok) continue;
    const fp = fingerprint(r.title);
    if (!fp || seen.has(fp)) continue;
    seen.add(fp);
    scored.push({
      ...r,
      score,
      fp,
      category: guessCategory(r.title),
    });
  }

  // Sort + cap
  scored.sort((a, b) => b.score - a.score);
  const winners = scored.slice(0, KEEP_TOP);

  const expiresAt = new Date(Date.now() + EXPIRE_DAYS * 86_400_000);
  let inserted = 0;
  let refreshed = 0;
  const bySource: Record<string, number> = {};

  // Insert. We use upsert on fingerprint so re-runs are idempotent.
  for (const w of winners) {
    const r = await db.drop.upsert({
      where: { fingerprint: w.fp },
      create: {
        fingerprint: w.fp,
        title: w.title,
        source: w.source,
        sourceUrl: w.sourceUrl,
        imageUrl: w.imageUrl ?? null,
        category: w.category,
        score: w.score,
        expectedAt: w.publishedAt ?? null,
        expiresAt,
      },
      update: {
        // Refresh expiry + score if same drop reappears (still trending)
        expiresAt,
        score: Math.max(w.score, 0), // never lower; could choose max(existing, new)
        ...(w.imageUrl ? { imageUrl: w.imageUrl } : {}),
      },
      select: { fetchedAt: true },
    });
    if (Date.now() - r.fetchedAt.getTime() < 5_000) inserted++;
    else refreshed++;
    bySource[w.source] = (bySource[w.source] ?? 0) + 1;
  }

  // GC expired
  const expired = await db.drop
    .deleteMany({ where: { expiresAt: { lt: new Date() }, pollId: null } })
    .then((r) => r.count);

  return {
    fetched,
    filtered: scored.length,
    inserted,
    refreshed,
    expired,
    bySource,
  };
}
