import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";

const arenaPollInclude = {
  category: { select: { name: true, slug: true, color: true } },
  author: { select: { name: true, username: true, image: true } },
  options: { orderBy: { position: "asc" as const } },
};

export async function listArenas() {
  return db.arena.findMany({
    orderBy: [{ featured: "desc" }, { status: "asc" }, { createdAt: "desc" }],
    include: { _count: { select: { polls: true } } },
  });
}

export async function getArenaBySlug(slug: string) {
  return db.arena.findUnique({
    where: { slug },
    include: {
      polls: {
        orderBy: [{ resolvedAt: "asc" }, { lockAt: "asc" }, { createdAt: "desc" }],
        include: arenaPollInclude,
      },
    },
  });
}

export type ArenaLeader = {
  username: string | null;
  name: string | null;
  image: string | null;
  rep: number;
  calls: number;
  correct: number;
};

type LbRow = {
  userId: string;
  rep: number;
  calls: number;
  correct: number;
};

/** Top predictors within an arena, ranked by reputation earned on its polls. */
export async function arenaLeaderboard(arenaId: string, limit = 15): Promise<ArenaLeader[]> {
  const rows = (await db.$queryRaw`
    SELECT v."userId" AS "userId",
           SUM(v."repAwarded") AS rep,
           COUNT(*) AS calls,
           SUM(CASE WHEN v."correct" THEN 1 ELSE 0 END) AS correct
    FROM "Vote" v
    JOIN "Poll" p ON p."id" = v."pollId"
    WHERE p."arenaId" = ${arenaId} AND v."repAwarded" IS NOT NULL
    GROUP BY v."userId"
    ORDER BY rep DESC
    LIMIT ${limit}
  `) as LbRow[];

  if (rows.length === 0) return [];
  const users = await db.user.findMany({
    where: { id: { in: rows.map((r) => r.userId) } },
    select: { id: true, username: true, name: true, image: true },
  });
  const byId = new Map(users.map((u) => [u.id, u]));
  return rows.map((r) => {
    const u = byId.get(r.userId);
    return {
      username: u?.username ?? null,
      name: u?.name ?? null,
      image: u?.image ?? null,
      rep: Number(r.rep),
      calls: Number(r.calls),
      correct: Number(r.correct),
    };
  });
}

export function arenaStatusLabel(status: string): string {
  switch (status) {
    case "UPCOMING":
      return "Upcoming";
    case "CLOSED":
      return "Closed";
    default:
      return "Live";
  }
}

/**
 * Spawn an Arena from a Drop the trend engine detected. Idempotent per drop.
 * Reputation-only; this just creates the container — predictions get attached
 * by curators or a follow-up generation step.
 */
export async function spawnArenaFromDrop(opts: {
  dropId: string;
  title: string;
  description?: string;
  emoji?: string;
  color?: string;
  endsAt?: Date | null;
}) {
  const existing = await db.arena.findFirst({ where: { sourceDropId: opts.dropId } });
  if (existing) return existing;
  return db.arena.create({
    data: {
      slug: slugify(opts.title),
      title: opts.title,
      description: opts.description ?? null,
      emoji: opts.emoji ?? null,
      color: opts.color ?? "indigo",
      endsAt: opts.endsAt ?? null,
      status: "LIVE",
      featured: true,
      sourceDropId: opts.dropId,
    },
  });
}
