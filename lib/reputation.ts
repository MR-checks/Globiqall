import { db } from "@/lib/db";
import { addWeeklyPoints } from "@/lib/leagues";

/** Reputation events. Keep deltas small + transparent. */
export const REP = {
  vote: 1,
  poll: 5,
  comment: 1,
} as const;

/** UTC calendar-day boundary helper. */
function utcStartOfDay(d: Date): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}
function daysBetween(a: Date, b: Date): number {
  const ms = utcStartOfDay(b).getTime() - utcStartOfDay(a).getTime();
  return Math.round(ms / 86_400_000);
}

/**
 * Recalculate streak + bump reputation when a user casts a vote.
 * Idempotent within the same UTC day (won't double-count repeat votes).
 * Returns the updated streak so callers can show toasts ("streak: 4 days").
 */
export async function applyVoteAccrual(userId: string): Promise<{
  streakDays: number;
  streakChanged: boolean;
  repDelta: number;
}> {
  const now = new Date();
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { lastVoteOn: true, streakDays: true },
  });
  if (!user) return { streakDays: 0, streakChanged: false, repDelta: 0 };

  let nextStreak = user.streakDays;
  let streakChanged = false;
  let repDelta = REP.vote;

  if (!user.lastVoteOn) {
    nextStreak = 1;
    streakChanged = true;
  } else {
    const gap = daysBetween(user.lastVoteOn, now);
    if (gap === 0) {
      // Already voted today — no streak change, no extra rep beyond per-vote.
      // (per-vote rep is still applied for the new vote action.)
    } else if (gap === 1) {
      nextStreak = user.streakDays + 1;
      streakChanged = true;
    } else if (gap > 1) {
      nextStreak = 1;
      streakChanged = true;
    }
  }

  await db.user.update({
    where: { id: userId },
    data: {
      lastVoteOn: now,
      streakDays: nextStreak,
      reputation: { increment: repDelta },
    },
  });
  await addWeeklyPoints(userId, repDelta).catch(() => {});

  return { streakDays: nextStreak, streakChanged, repDelta };
}

export async function applyPollAccrual(userId: string) {
  await db.user.update({
    where: { id: userId },
    data: { reputation: { increment: REP.poll } },
  });
  await addWeeklyPoints(userId, REP.poll).catch(() => {});
}

export async function applyCommentAccrual(userId: string) {
  await db.user.update({
    where: { id: userId },
    data: { reputation: { increment: REP.comment } },
  });
  await addWeeklyPoints(userId, REP.comment).catch(() => {});
}

// ---- Derived badges (computed from current stats) ----
export type Badge = {
  slug: string;
  label: string;
  hint: string;
  tone: "default" | "accent" | "positive" | "warning";
};

export function deriveBadges(stats: {
  pollsCount: number;
  votesCount: number;
  commentsCount: number;
  streakDays: number;
  accountAgeDays: number;
  topPollVotes: number;
  predictionsResolved?: number;
  predictionsCorrect?: number;
  bestPredictionStreak?: number;
}): Badge[] {
  const b: Badge[] = [];
  if (stats.pollsCount >= 1) b.push({ slug: "first-poll", label: "First signal", hint: "Opened your first poll", tone: "accent" });
  if (stats.pollsCount >= 3) b.push({ slug: "builder", label: "Builder", hint: "3+ polls opened", tone: "default" });
  if (stats.votesCount >= 10) b.push({ slug: "voter", label: "Voter", hint: "10+ votes cast", tone: "default" });
  if (stats.commentsCount >= 5) b.push({ slug: "talker", label: "Talker", hint: "5+ comments", tone: "default" });
  if (stats.streakDays >= 7) b.push({ slug: "streak-7", label: "7-day streak", hint: "Voted 7 days in a row", tone: "positive" });
  if (stats.streakDays >= 30) b.push({ slug: "streak-30", label: "30-day streak", hint: "Voted 30 days in a row", tone: "warning" });
  if (stats.topPollVotes >= 100) b.push({ slug: "hot-take", label: "Hot take", hint: "Poll crossed 100 votes", tone: "warning" });
  if (stats.accountAgeDays >= 30 && stats.votesCount >= 50)
    b.push({ slug: "veteran", label: "Veteran", hint: "30 days + 50 votes", tone: "default" });

  // Prediction badges
  const pr = stats.predictionsResolved ?? 0;
  const pc = stats.predictionsCorrect ?? 0;
  if (pc >= 1) b.push({ slug: "first-call", label: "Called it", hint: "Got your first prediction right", tone: "accent" });
  if (pr >= 10 && pc / pr >= 0.6) b.push({ slug: "sharp", label: "Sharp", hint: "60%+ accuracy over 10+ calls", tone: "positive" });
  if (pr >= 25 && pc / pr >= 0.7) b.push({ slug: "oracle", label: "Oracle", hint: "70%+ accuracy over 25+ calls", tone: "warning" });
  if ((stats.bestPredictionStreak ?? 0) >= 5) b.push({ slug: "hot-hand", label: "Hot hand", hint: "5 correct calls in a row", tone: "positive" });
  return b;
}
