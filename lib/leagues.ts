import { db } from "@/lib/db";

/**
 * Weekly leagues — Duolingo-style competitive tiers that reset every week.
 * Reputation-only: "points" are weekly activity, not money.
 *
 * v1 is threshold-based (earn X points this week → reach a tier) rather than
 * cohort promotion/relegation, so it works without a rotation cron. The weekly
 * reset is lazy: the first time a user earns in a new ISO week, their counter
 * rolls over.
 */

export type LeagueTier = {
  key: string;
  name: string;
  min: number; // weekly points needed to enter this tier
  tone: "default" | "accent" | "positive" | "warning";
};

// Ordered low → high.
export const LEAGUE_TIERS: LeagueTier[] = [
  { key: "bronze", name: "Bronze", min: 0, tone: "default" },
  { key: "silver", name: "Silver", min: 40, tone: "default" },
  { key: "gold", name: "Gold", min: 120, tone: "warning" },
  { key: "platinum", name: "Platinum", min: 300, tone: "accent" },
  { key: "diamond", name: "Diamond", min: 700, tone: "positive" },
];

/** ISO week key like "2026-W24". */
export function currentWeekKey(d: Date = new Date()): string {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = (date.getUTCDay() + 6) % 7; // Mon=0
  date.setUTCDate(date.getUTCDate() - dayNum + 3); // nearest Thursday
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const week =
    1 +
    Math.round(
      ((date.getTime() - firstThursday.getTime()) / 86_400_000 -
        3 +
        ((firstThursday.getUTCDay() + 6) % 7)) /
        7,
    );
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

/** Effective weekly points for a user (0 if their counter is from a past week). */
export function effectiveWeeklyPoints(u: { weeklyPoints: number; weekKey: string | null }): number {
  return u.weekKey === currentWeekKey() ? u.weeklyPoints : 0;
}

export function tierForPoints(points: number): LeagueTier {
  let tier = LEAGUE_TIERS[0];
  for (const t of LEAGUE_TIERS) if (points >= t.min) tier = t;
  return tier;
}

export function nextTier(points: number): LeagueTier | null {
  const idx = LEAGUE_TIERS.findIndex((t) => t.key === tierForPoints(points).key);
  return LEAGUE_TIERS[idx + 1] ?? null;
}

/** Lazily roll the week, then add points. Called from the reputation accrual paths. */
export async function addWeeklyPoints(userId: string, points: number): Promise<void> {
  if (points <= 0) return;
  const wk = currentWeekKey();
  const u = await db.user.findUnique({
    where: { id: userId },
    select: { weekKey: true },
  });
  if (!u) return;
  if (u.weekKey !== wk) {
    // New week — reset, then add.
    await db.user.update({
      where: { id: userId },
      data: { weekKey: wk, weeklyPoints: points },
    });
  } else {
    await db.user.update({
      where: { id: userId },
      data: { weeklyPoints: { increment: points } },
    });
  }
}

export type LeagueEntry = {
  username: string | null;
  name: string | null;
  image: string | null;
  points: number;
  tier: LeagueTier;
};

/** This week's league table — top earners, current week only. */
export async function weeklyLeaderboard(limit = 50): Promise<LeagueEntry[]> {
  const wk = currentWeekKey();
  const users = await db.user.findMany({
    where: { weekKey: wk, weeklyPoints: { gt: 0 } },
    orderBy: { weeklyPoints: "desc" },
    take: limit,
    select: { username: true, name: true, image: true, weeklyPoints: true },
  });
  return users.map((u) => ({
    username: u.username,
    name: u.name,
    image: u.image,
    points: u.weeklyPoints,
    tier: tierForPoints(u.weeklyPoints),
  }));
}
