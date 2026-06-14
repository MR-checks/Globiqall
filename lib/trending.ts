import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

/**
 * HN-style time-decay score.
 *   score = (votes + featuredBoost) / (ageHours + 2)^gravity
 * Gravity ~1.6 → strong decay after ~24h, but recent activity always wins.
 */
const GRAVITY = 1.6;
const FEATURED_BOOST = 8;

export function computeScore(p: {
  totalVotes: number;
  featured: boolean;
  createdAt: Date;
}): number {
  const ageHours = Math.max(0, (Date.now() - p.createdAt.getTime()) / 3_600_000);
  const numerator = p.totalVotes + (p.featured ? FEATURED_BOOST : 0);
  return numerator / Math.pow(ageHours + 2, GRAVITY);
}

const cardInclude = {
  category: { select: { name: true, slug: true, emoji: true, color: true } },
  author: { select: { name: true, username: true, image: true } },
  options: { orderBy: { position: "asc" as const } },
} satisfies Prisma.PollInclude;

/**
 * Trending feed: fetches a broad candidate pool, scores in memory, returns top N
 * tagged with a `rising` flag when momentum is exceptional (high score, recent age,
 * meaningful sample size).
 */
export async function listTrendingPolls(limit = 12, where: Prisma.PollWhereInput = {}) {
  const baseWhere = { visibility: "PUBLIC", ...where };

  // Two-pronged candidate pool: most recent + most voted. Dedupe by id.
  const [recent, popular] = await Promise.all([
    db.poll.findMany({
      where: baseWhere,
      orderBy: { createdAt: "desc" },
      take: 120,
      include: cardInclude,
    }),
    db.poll.findMany({
      where: baseWhere,
      orderBy: { totalVotes: "desc" },
      take: 80,
      include: cardInclude,
    }),
  ]);

  const byId = new Map<string, (typeof recent)[number]>();
  for (const p of [...recent, ...popular]) byId.set(p.id, p);

  const scored = Array.from(byId.values())
    .map((p) => {
      const score = computeScore(p);
      const ageHours = (Date.now() - p.createdAt.getTime()) / 3_600_000;
      return { ...p, score, ageHours };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  // Determine median score in the top set; "rising" = recent (≤24h) AND meaningful sample AND above median
  const sortedScores = scored.map((s) => s.score).sort((a, b) => a - b);
  const median =
    sortedScores.length === 0
      ? 0
      : sortedScores[Math.floor(sortedScores.length / 2)];

  return scored.map((p) => ({
    ...p,
    rising:
      p.ageHours <= 24 &&
      p.totalVotes >= 5 &&
      p.score >= median,
  }));
}

export type TrendingPoll = Awaited<ReturnType<typeof listTrendingPolls>>[number];
