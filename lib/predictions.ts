import { db } from "@/lib/db";
import { addWeeklyPoints } from "@/lib/leagues";

/**
 * Prediction engine — reputation-only by design.
 *
 * IMPORTANT (money-separability): the ONLY stake here is reputation (an integer
 * score). There is no currency, wallet, or payout. A future regulated real-money
 * mode, if ever added, must live in a PARALLEL module and must not import or
 * mutate anything in this file. Keep this boundary clean.
 */

export type PredictionState =
  | "NOT_PREDICTION" // a debate poll
  | "OPEN" // accepting calls (and switches)
  | "LOCKED" // lockAt passed, awaiting resolution — calls are final
  | "RESOLVED"; // outcome set

type PollLike = {
  mode: string;
  lockAt: Date | null;
  resolvedAt: Date | null;
};

export function computePredictionState(
  poll: PollLike,
  now: Date = new Date(),
): PredictionState {
  if (poll.mode !== "PREDICTION") return "NOT_PREDICTION";
  if (poll.resolvedAt) return "RESOLVED";
  if (poll.lockAt && poll.lockAt <= now) return "LOCKED";
  return "OPEN";
}

export function predictionStateLabel(state: PredictionState): string {
  switch (state) {
    case "OPEN":
      return "Open to call";
    case "LOCKED":
      return "Locked · awaiting result";
    case "RESOLVED":
      return "Resolved";
    default:
      return "";
  }
}

// ---- Scoring ----
// Reward math is intentionally simple + transparent so the UI can explain it.
const BASE_REWARD = 10; // points for a correct, consensus call
const WRONG_PENALTY_PER_CONVICTION = 2; // gentle sting for a wrong, confident call

/**
 * Reputation delta for one resolved pick.
 *  - Correct: BASE × conviction × difficulty, where difficulty rewards being
 *    right against the crowd. difficulty = 1 + (1 − pickShareOfWinner), so a
 *    contrarian-correct call (few people picked it) is worth up to ~2×, while a
 *    consensus-correct call is worth ~1×.
 *  - Wrong: −(conviction × penalty). Low-conviction wrong calls barely sting.
 */
export function scorePick(opts: {
  correct: boolean;
  conviction: number;
  winnerPickShare: number; // 0..1 — fraction of all voters who picked the winner
}): number {
  const conv = Math.min(3, Math.max(1, opts.conviction || 1));
  if (opts.correct) {
    const difficulty = 1 + (1 - clamp01(opts.winnerPickShare));
    return Math.round(BASE_REWARD * conv * difficulty);
  }
  return -(conv * WRONG_PENALTY_PER_CONVICTION);
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 1;
  return Math.min(1, Math.max(0, n));
}

export type ResolveResult = {
  ok: boolean;
  error?: string;
  scored?: number; // number of picks scored
  winnerLabel?: string;
};

/**
 * Resolve a prediction: set the winning option, score every pick into reputation,
 * update each predictor's track record (resolved/correct counts + streaks), and
 * stamp the poll. Idempotent guard: refuses if already resolved.
 */
export async function resolvePrediction(opts: {
  pollId: string;
  winningOptionId: string;
  resolverId: string;
  source?: string | null;
  note?: string | null;
}): Promise<ResolveResult> {
  const poll = await db.poll.findUnique({
    where: { id: opts.pollId },
    include: {
      options: { select: { id: true, label: true, voteCount: true } },
      votes: { select: { id: true, userId: true, optionId: true, conviction: true } },
    },
  });
  if (!poll) return { ok: false, error: "Poll not found" };
  if (poll.mode !== "PREDICTION") return { ok: false, error: "Not a prediction" };
  if (poll.resolvedAt) return { ok: false, error: "Already resolved" };

  const winner = poll.options.find((o) => o.id === opts.winningOptionId);
  if (!winner) return { ok: false, error: "Winning option not on this poll" };

  const totalVotes = poll.votes.length;
  const winnerVotes = poll.votes.filter(
    (v) => v.optionId === opts.winningOptionId,
  ).length;
  const winnerPickShare = totalVotes > 0 ? winnerVotes / totalVotes : 1;

  // Compute per-user deltas first (pure), then commit in one transaction.
  const voteUpdates = poll.votes.map((v) => {
    const correct = v.optionId === opts.winningOptionId;
    const repAwarded = scorePick({
      correct,
      conviction: v.conviction,
      winnerPickShare,
    });
    return { id: v.id, userId: v.userId, correct, repAwarded };
  });

  await db.$transaction(async (tx) => {
    // Stamp the poll
    await tx.poll.update({
      where: { id: poll.id },
      data: {
        resolvedAt: new Date(),
        resolvedOptionId: opts.winningOptionId,
        resolutionSource: opts.source?.trim() || null,
        resolutionNote: opts.note?.trim() || null,
        resolvedById: opts.resolverId,
      },
    });

    for (const vu of voteUpdates) {
      await tx.vote.update({
        where: { id: vu.id },
        data: { correct: vu.correct, repAwarded: vu.repAwarded },
      });

      // Update the predictor's reputation + track record + streak.
      const user = await tx.user.findUnique({
        where: { id: vu.userId },
        select: { predictionStreak: true, bestPredictionStreak: true },
      });
      const nextStreak = vu.correct ? (user?.predictionStreak ?? 0) + 1 : 0;
      const bestStreak = Math.max(user?.bestPredictionStreak ?? 0, nextStreak);

      await tx.user.update({
        where: { id: vu.userId },
        data: {
          reputation: { increment: vu.repAwarded },
          predictionsResolved: { increment: 1 },
          predictionsCorrect: { increment: vu.correct ? 1 : 0 },
          predictionStreak: nextStreak,
          bestPredictionStreak: bestStreak,
        },
      });
    }
  });

  // Weekly league points for correct calls (post-transaction; best-effort).
  for (const vu of voteUpdates) {
    if (vu.repAwarded > 0) await addWeeklyPoints(vu.userId, vu.repAwarded).catch(() => {});
  }

  // Notify every predictor with their result (in-app + email), and fire rivalry
  // callouts when their nemesis also played this poll with the opposite outcome.
  await notifyOnResolution({
    pollSlug: poll.slug,
    pollTitle: poll.title,
    pollId: poll.id,
    winnerLabel: winner.label,
    voteUpdates,
  }).catch(() => {});

  return { ok: true, scored: voteUpdates.length, winnerLabel: winner.label };
}

async function notifyOnResolution(args: {
  pollSlug: string;
  pollTitle: string;
  pollId: string;
  winnerLabel: string;
  voteUpdates: { userId: string; correct: boolean; repAwarded: number }[];
}) {
  const { notify } = await import("@/lib/notifications");
  const { trophyTierForRep } = await import("@/lib/trophies");
  const href = `/p/${args.pollSlug}`;
  const correctness = new Map(args.voteUpdates.map((v) => [v.userId, v.correct]));

  // Personal result notifications
  for (const vu of args.voteUpdates) {
    if (vu.correct) {
      const tier = trophyTierForRep(vu.repAwarded);
      await notify({
        userId: vu.userId,
        type: "PREDICTION_RESOLVED",
        title: `You called it — ${truncate(args.pollTitle)}`,
        body: `${tier.name} call · +${vu.repAwarded} rep. Share your receipt.`,
        href,
        pollId: args.pollId,
        email: true,
      });
    } else {
      await notify({
        userId: vu.userId,
        type: "PREDICTION_RESOLVED",
        title: `Resolved — ${truncate(args.pollTitle)}`,
        body: `The answer: ${args.winnerLabel}. You'll get the next one.`,
        href,
        pollId: args.pollId,
        email: true,
      });
    }
  }

  // Rivalry callouts: only for predictors whose stored nemesis also played here.
  const predictorIds = args.voteUpdates.map((v) => v.userId);
  const predictors = await db.user.findMany({
    where: { id: { in: predictorIds }, nemesisId: { not: null } },
    select: { id: true, nemesisId: true },
  });
  const nemesisIds = predictors.map((p) => p.nemesisId!).filter(Boolean);
  if (nemesisIds.length === 0) return;
  const nemUsers = await db.user.findMany({
    where: { id: { in: nemesisIds } },
    select: { id: true, username: true, name: true },
  });
  const nemById = new Map(nemUsers.map((u) => [u.id, u]));

  for (const p of predictors) {
    const nemId = p.nemesisId!;
    if (!correctness.has(nemId)) continue; // nemesis didn't play this poll
    const meCorrect = correctness.get(p.id);
    const nemCorrect = correctness.get(nemId);
    if (meCorrect === nemCorrect) continue; // no drama if both same
    const nem = nemById.get(nemId);
    const handle = nem?.username ? `@${nem.username}` : nem?.name ?? "your nemesis";
    if (meCorrect === false && nemCorrect === true) {
      await notify({
        userId: p.id,
        type: "NEMESIS",
        title: `${handle} called it — you didn't`,
        body: `Your nemesis nailed "${truncate(args.pollTitle)}". Get them back.`,
        href,
        pollId: args.pollId,
        actorId: nemId,
      });
    } else if (meCorrect === true && nemCorrect === false) {
      await notify({
        userId: p.id,
        type: "NEMESIS",
        title: `You beat ${handle}`,
        body: `You called "${truncate(args.pollTitle)}" — your nemesis missed it.`,
        href,
        pollId: args.pollId,
        actorId: nemId,
      });
    }
  }
}

function truncate(s: string, n = 48): string {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

export function predictionAccuracy(correct: number, resolved: number): number {
  if (!resolved) return 0;
  return Math.round((correct / resolved) * 1000) / 10;
}

// ---- Listing queries for the /predictions hub ----

const predCardInclude = {
  category: { select: { name: true, slug: true, color: true } },
  author: { select: { name: true, username: true, image: true } },
  options: { orderBy: { position: "asc" as const } },
};

/** Open predictions, soonest-to-lock first — the "call these now" set. */
export async function listOpenPredictions(limit = 30) {
  const now = new Date();
  return db.poll.findMany({
    where: {
      mode: "PREDICTION",
      visibility: "PUBLIC",
      resolvedAt: null,
      OR: [{ lockAt: null }, { lockAt: { gt: now } }],
    },
    orderBy: [{ lockAt: "asc" }, { createdAt: "desc" }],
    take: limit,
    include: predCardInclude,
  });
}

/** Locked predictions awaiting resolution. */
export async function listLockedPredictions(limit = 20) {
  const now = new Date();
  return db.poll.findMany({
    where: {
      mode: "PREDICTION",
      visibility: "PUBLIC",
      resolvedAt: null,
      lockAt: { lte: now },
    },
    orderBy: [{ resolvesAt: "asc" }, { lockAt: "asc" }],
    take: limit,
    include: predCardInclude,
  });
}

/** Recently resolved predictions. */
export async function listResolvedPredictions(limit = 20) {
  return db.poll.findMany({
    where: { mode: "PREDICTION", visibility: "PUBLIC", resolvedAt: { not: null } },
    orderBy: { resolvedAt: "desc" },
    take: limit,
    include: predCardInclude,
  });
}
