import { db } from "@/lib/db";

/**
 * Trophies are minted for CORRECT prediction calls, with rarity scaled to how
 * hard the call was. We reuse the reputation a pick earned at resolution
 * (repAwarded) as the difficulty signal, it already encodes conviction ×
 * contrarian-correctness. No separate table needed: the trophy case is derived
 * from the user's correct votes.
 *
 * Reward range for a correct call is ~10..60, so tiers are calibrated to that.
 */

export type TrophyTier = {
  key: string;
  name: string;
  min: number; // repAwarded needed for this tier
  tone: "default" | "accent" | "positive" | "warning";
};

export const TROPHY_TIERS: TrophyTier[] = [
  { key: "bronze", name: "Bronze", min: 1, tone: "default" },
  { key: "silver", name: "Silver", min: 16, tone: "default" },
  { key: "gold", name: "Gold", min: 24, tone: "warning" },
  { key: "platinum", name: "Platinum", min: 36, tone: "accent" },
  { key: "diamond", name: "Diamond", min: 48, tone: "positive" },
];

export function trophyTierForRep(rep: number): TrophyTier {
  let tier = TROPHY_TIERS[0];
  for (const t of TROPHY_TIERS) if (rep >= t.min) tier = t;
  return tier;
}

export type TrophyCount = TrophyTier & { count: number };

/** Counts of each trophy tier the user has earned, highest tier first. */
export async function computeTrophyCase(userId: string): Promise<{
  total: number;
  byTier: TrophyCount[];
  rarest: TrophyTier | null;
}> {
  const wins = await db.vote.findMany({
    where: { userId, correct: true, repAwarded: { not: null } },
    select: { repAwarded: true },
  });

  const counts = new Map<string, number>();
  for (const w of wins) {
    const t = trophyTierForRep(w.repAwarded ?? 0);
    counts.set(t.key, (counts.get(t.key) ?? 0) + 1);
  }

  const byTier: TrophyCount[] = [...TROPHY_TIERS]
    .reverse()
    .map((t) => ({ ...t, count: counts.get(t.key) ?? 0 }))
    .filter((t) => t.count > 0);

  const rarest = byTier[0] ?? null;
  return { total: wins.length, byTier, rarest };
}
