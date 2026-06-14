import { db } from "@/lib/db";

/**
 * Tribes are DISCOVERED, not assigned. We read a user's actual voting pattern
 * and surface: who they align with (allies), who they clash with (nemesis),
 * how contrarian they are, and a derived identity name.
 *
 * No schema, no clustering job — computed on read from existing votes. Cheap
 * enough at launch scale; swap for a periodic precompute when votes get huge.
 */

export type Ally = {
  username: string | null;
  name: string | null;
  image: string | null;
  agreementPct: number;
  shared: number;
};

export type Alignment = {
  votes: number;
  sampleSize: number;
  avgAgreement: number; // how much you agree with the average compared voter
  contrarianIndex: number; // 0..100, higher = you pick minority sides more
  tribeName: string;
  tribeBlurb: string;
  allies: Ally[];
  nemesis: Ally | null;
  nemesisUserId: string | null;
};

type Row = { userId: string; shared: number; agree: number };

export async function computeAlignment(userId: string): Promise<Alignment | null> {
  // Pairwise agreement vs everyone who shares polls with this user.
  const rows = (await db.$queryRaw`
    SELECT v2.userId AS userId,
           COUNT(*) AS shared,
           SUM(CASE WHEN v1.optionId = v2.optionId THEN 1 ELSE 0 END) AS agree
    FROM Vote v1
    JOIN Vote v2 ON v2.pollId = v1.pollId AND v2.userId <> v1.userId
    WHERE v1.userId = ${userId}
    GROUP BY v2.userId
    HAVING COUNT(*) >= 3
    ORDER BY shared DESC
    LIMIT 200
  `) as Row[];

  // Total votes by this user (for the "vote more" gate)
  const myVoteCount = await db.vote.count({ where: { userId } });
  if (myVoteCount < 5) {
    return {
      votes: myVoteCount,
      sampleSize: 0,
      avgAgreement: 0,
      contrarianIndex: 0,
      tribeName: "Unformed",
      tribeBlurb: "Vote on a few more polls to reveal your tribe.",
      allies: [],
      nemesis: null,
      nemesisUserId: null,
    };
  }

  const scored = rows.map((r) => {
    const shared = Number(r.shared);
    const agree = Number(r.agree);
    return { userId: r.userId, shared, agreementPct: shared ? (agree / shared) * 100 : 0 };
  });

  const avgAgreement = scored.length
    ? Math.round((scored.reduce((a, b) => a + b.agreementPct, 0) / scored.length) * 10) / 10
    : 0;

  // Allies: highest agreement (need a meaningful sample)
  const allyCandidates = [...scored]
    .filter((s) => s.shared >= 3)
    .sort((a, b) => b.agreementPct - a.agreementPct || b.shared - a.shared)
    .slice(0, 3);

  // Nemesis: lowest agreement with enough shared history to count
  const nemesisCandidate = [...scored]
    .filter((s) => s.shared >= 5)
    .sort((a, b) => a.agreementPct - b.agreementPct || b.shared - a.shared)[0];

  // Hydrate user info
  const ids = [...allyCandidates.map((a) => a.userId), nemesisCandidate?.userId].filter(
    Boolean,
  ) as string[];
  const users = ids.length
    ? await db.user.findMany({
        where: { id: { in: ids } },
        select: { id: true, username: true, name: true, image: true },
      })
    : [];
  const byId = new Map(users.map((u) => [u.id, u]));

  const toAlly = (s: { userId: string; shared: number; agreementPct: number }): Ally => {
    const u = byId.get(s.userId);
    return {
      username: u?.username ?? null,
      name: u?.name ?? null,
      image: u?.image ?? null,
      agreementPct: Math.round(s.agreementPct),
      shared: s.shared,
    };
  };

  const contrarianIndex = await computeContrarianIndex(userId);
  const tribe = await deriveTribe(userId, contrarianIndex);

  return {
    votes: myVoteCount,
    sampleSize: scored.length,
    avgAgreement,
    contrarianIndex,
    tribeName: tribe.name,
    tribeBlurb: tribe.blurb,
    allies: allyCandidates.map(toAlly),
    nemesis: nemesisCandidate ? toAlly(nemesisCandidate) : null,
    nemesisUserId: nemesisCandidate?.userId ?? null,
  };
}

/**
 * Lightweight nemesis lookup — the user you most consistently disagree with.
 * Used by the sweep + resolution loop to persist User.nemesisId.
 */
export async function computeNemesisId(userId: string): Promise<string | null> {
  const rows = (await db.$queryRaw`
    SELECT v2.userId AS userId,
           COUNT(*) AS shared,
           SUM(CASE WHEN v1.optionId = v2.optionId THEN 1 ELSE 0 END) AS agree
    FROM Vote v1
    JOIN Vote v2 ON v2.pollId = v1.pollId AND v2.userId <> v1.userId
    WHERE v1.userId = ${userId}
    GROUP BY v2.userId
    HAVING COUNT(*) >= 5
  `) as Row[];
  if (rows.length === 0) return null;
  let worst: { id: string; pct: number } | null = null;
  for (const r of rows) {
    const shared = Number(r.shared);
    const pct = shared ? Number(r.agree) / shared : 1;
    if (!worst || pct < worst.pct) worst = { id: r.userId, pct };
  }
  return worst?.id ?? null;
}

/** How often you back the minority side. 0 = always with the crowd, 100 = always against. */
async function computeContrarianIndex(userId: string): Promise<number> {
  const votes = await db.vote.findMany({
    where: { userId },
    select: {
      optionId: true,
      poll: { select: { options: { select: { id: true, voteCount: true } } } },
    },
  });
  if (votes.length === 0) return 0;
  let contrarian = 0;
  let counted = 0;
  for (const v of votes) {
    const opts = v.poll.options;
    if (opts.length < 2) continue;
    const maxCount = Math.max(...opts.map((o) => o.voteCount));
    const leaders = opts.filter((o) => o.voteCount === maxCount).map((o) => o.id);
    // Only count polls with a clear-ish signal (someone has votes)
    if (maxCount === 0) continue;
    counted++;
    if (!leaders.includes(v.optionId)) contrarian++;
  }
  if (counted === 0) return 0;
  return Math.round((contrarian / counted) * 100);
}

/** Derive a shareable tribe identity from stance + most-active category. */
async function deriveTribe(
  userId: string,
  contrarianIndex: number,
): Promise<{ name: string; blurb: string }> {
  // Most-active category
  const grouped = await db.vote.findMany({
    where: { userId },
    select: { poll: { select: { category: { select: { name: true } } } } },
  });
  const counts = new Map<string, number>();
  for (const g of grouped) {
    const n = g.poll.category.name;
    counts.set(n, (counts.get(n) ?? 0) + 1);
  }
  let topCategory = "Generalist";
  let max = 0;
  for (const [n, c] of counts) if (c > max) ((max = c), (topCategory = n));

  const stance =
    contrarianIndex >= 55 ? "Contrarian" : contrarianIndex <= 38 ? "Consensus" : "Independent";

  const blurbByStance: Record<string, string> = {
    Contrarian: "You back the minority side more often than not — a true outlier.",
    Consensus: "You ride with the crowd — you read the room before most.",
    Independent: "You split your calls — sometimes crowd, sometimes outlier.",
  };

  return {
    name: `${stance} · ${topCategory}`,
    blurb: blurbByStance[stance],
  };
}
