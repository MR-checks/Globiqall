import { db } from "@/lib/db";
import { publish } from "@/lib/pubsub";
import { applyVoteAccrual } from "@/lib/reputation";
import { applyDailyAccrual, todayUtc } from "@/lib/daily";

export type PollWithRelations = Awaited<ReturnType<typeof getPollBySlug>>;

export async function getPollBySlug(slug: string) {
  return db.poll.findUnique({
    where: { slug },
    include: {
      author: {
        select: { id: true, name: true, username: true, image: true },
      },
      category: true,
      options: { orderBy: { position: "asc" } },
      arena: { select: { slug: true, title: true, emoji: true, color: true } },
    },
  });
}

export async function listFeaturedPolls(limit = 12) {
  return db.poll.findMany({
    where: { visibility: "PUBLIC" },
    orderBy: [{ featured: "desc" }, { totalVotes: "desc" }, { createdAt: "desc" }],
    take: limit,
    include: {
      category: { select: { name: true, slug: true, emoji: true, color: true } },
      author: { select: { name: true, username: true, image: true } },
      options: { orderBy: { position: "asc" } },
      _count: { select: { votes: true } },
    },
  });
}

export async function listPollsByCategory(categorySlug: string, limit = 24) {
  return db.poll.findMany({
    where: { visibility: "PUBLIC", category: { slug: categorySlug } },
    orderBy: [{ createdAt: "desc" }],
    take: limit,
    include: {
      category: { select: { name: true, slug: true, emoji: true, color: true } },
      author: { select: { name: true, username: true, image: true } },
      options: { orderBy: { position: "asc" } },
      _count: { select: { votes: true } },
    },
  });
}

export async function searchPolls(q: string, limit = 30) {
  if (!q.trim()) return [];
  return db.poll.findMany({
    where: {
      visibility: "PUBLIC",
      OR: [
        { title: { contains: q } },
        { description: { contains: q } },
      ],
    },
    orderBy: [{ totalVotes: "desc" }],
    take: limit,
    include: {
      category: { select: { name: true, slug: true, emoji: true, color: true } },
      author: { select: { name: true, username: true, image: true } },
      options: { orderBy: { position: "asc" } },
      _count: { select: { votes: true } },
    },
  });
}

export async function getUserVote(pollId: string, userId: string | undefined) {
  if (!userId) return null;
  return db.vote.findUnique({
    where: { pollId_userId: { pollId, userId } },
    select: {
      optionId: true,
      createdAt: true,
      conviction: true,
      correct: true,
      repAwarded: true,
    },
  });
}

/**
 * Casts (or changes) a user's vote for a poll. Atomic vs option counters.
 * Publishes a realtime update on success.
 */
export async function castVote({
  pollId,
  optionId,
  userId,
  countryCode,
  conviction,
}: {
  pollId: string;
  optionId: string;
  userId: string;
  countryCode?: string;
  /** Prediction confidence 1–3. Ignored for debate polls (stored as 1). */
  conviction?: number;
}) {
  const poll = await db.poll.findUnique({
    where: { id: pollId },
    select: {
      mode: true,
      lockAt: true,
      closesAt: true,
      resolvedAt: true,
      dailyOn: true,
      options: { select: { id: true } },
    },
  });
  if (!poll) throw new Error("Poll not found");
  if (poll.resolvedAt) throw new Error("This is already resolved");
  if (poll.closesAt && poll.closesAt < new Date()) {
    throw new Error("Poll has expired");
  }
  // Prediction lock: once lockAt passes, the call is final — no new picks, no switching.
  if (poll.mode === "PREDICTION" && poll.lockAt && poll.lockAt < new Date()) {
    throw new Error("Predictions are locked");
  }
  if (!poll.options.some((o) => o.id === optionId)) {
    throw new Error("Invalid option");
  }

  // Clamp conviction to 1–3; debate polls always store 1.
  const conv =
    poll.mode === "PREDICTION"
      ? Math.min(3, Math.max(1, Math.round(conviction ?? 1)))
      : 1;

  const existing = await db.vote.findUnique({
    where: { pollId_userId: { pollId, userId } },
  });

  if (existing && existing.optionId === optionId && existing.conviction === conv) {
    // No-op
    return { changed: false };
  }

  await db.$transaction(async (tx) => {
    if (existing) {
      // Move vote from old option to new (and/or update conviction)
      await tx.vote.update({
        where: { id: existing.id },
        data: {
          optionId,
          conviction: conv,
          countryCode: countryCode ?? existing.countryCode,
        },
      });
      if (existing.optionId !== optionId) {
        await tx.pollOption.update({
          where: { id: existing.optionId },
          data: { voteCount: { decrement: 1 } },
        });
        await tx.pollOption.update({
          where: { id: optionId },
          data: { voteCount: { increment: 1 } },
        });
      }
    } else {
      await tx.vote.create({
        data: {
          pollId,
          optionId,
          userId,
          countryCode,
          conviction: conv,
        },
      });
      await tx.pollOption.update({
        where: { id: optionId },
        data: { voteCount: { increment: 1 } },
      });
      await tx.poll.update({
        where: { id: pollId },
        data: { totalVotes: { increment: 1 } },
      });
    }
  });

  // Accrue reputation + update streak for this user
  const accrual = await applyVoteAccrual(userId).catch(() => null);

  // If this is today's Daily Call, advance the daily participation streak.
  let daily: { dailyStreak: number; changed: boolean } | null = null;
  if (poll.dailyOn && poll.dailyOn.getTime() === todayUtc().getTime()) {
    daily = await applyDailyAccrual(userId).catch(() => null);
  }

  const fresh = await db.poll.findUnique({
    where: { id: pollId },
    include: { options: { select: { id: true, voteCount: true } } },
  });
  if (fresh) {
    publish(pollId, {
      totalVotes: fresh.totalVotes,
      options: fresh.options,
    });
  }

  return { changed: true, accrual, daily };
}
