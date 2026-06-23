import { db } from "@/lib/db";

/** UTC midnight for "today", the canonical key for a Daily Call. */
export function todayUtc(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function daysBetweenUtc(a: Date, b: Date): number {
  const x = new Date(a);
  x.setUTCHours(0, 0, 0, 0);
  const y = new Date(b);
  y.setUTCHours(0, 0, 0, 0);
  return Math.round((y.getTime() - x.getTime()) / 86_400_000);
}

/** The single global prediction designated for today (UTC). */
export async function getTodaysDaily() {
  return db.poll.findUnique({
    where: { dailyOn: todayUtc() },
    include: {
      category: true,
      author: { select: { name: true, username: true, image: true } },
      options: { orderBy: { position: "asc" } },
    },
  });
}

/** Is this poll the active Daily Call? */
export async function isPollTodaysDaily(pollId: string): Promise<boolean> {
  const today = await db.poll.findUnique({
    where: { dailyOn: todayUtc() },
    select: { id: true },
  });
  return today?.id === pollId;
}

/**
 * Record daily participation + advance the participation streak (Wordle-style:
 * counts consecutive days you played, not whether you were right).
 * Idempotent within the same UTC day.
 */
export async function applyDailyAccrual(userId: string): Promise<{
  dailyStreak: number;
  changed: boolean;
  freezeUsed: boolean;
}> {
  const now = todayUtc();
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      lastDailyOn: true,
      dailyStreak: true,
      bestDailyStreak: true,
      streakFreezes: true,
    },
  });
  if (!user) return { dailyStreak: 0, changed: false, freezeUsed: false };

  let next = user.dailyStreak;
  let changed = false;
  let freezeUsed = false;
  let freezeDelta = 0;

  if (!user.lastDailyOn) {
    next = 1;
    changed = true;
  } else {
    const gap = daysBetweenUtc(user.lastDailyOn, now);
    if (gap === 0) {
      return { dailyStreak: user.dailyStreak, changed: false, freezeUsed: false }; // already played today
    } else if (gap === 1) {
      next = user.dailyStreak + 1;
      changed = true;
    } else if (gap === 2 && user.streakFreezes > 0) {
      // Missed exactly one day, burn a freeze to keep the streak alive.
      next = user.dailyStreak + 1;
      changed = true;
      freezeUsed = true;
      freezeDelta = -1;
    } else {
      next = 1;
      changed = true;
    }
  }

  // Grant a freeze on every 7-day milestone (capped at 3).
  if (changed && next > 0 && next % 7 === 0 && user.streakFreezes + freezeDelta < 3) {
    freezeDelta += 1;
  }

  await db.user.update({
    where: { id: userId },
    data: {
      lastDailyOn: now,
      dailyStreak: next,
      bestDailyStreak: Math.max(user.bestDailyStreak, next),
      ...(freezeDelta !== 0 ? { streakFreezes: { increment: freezeDelta } } : {}),
    },
  });

  if (freezeUsed) {
    // Tell them a freeze saved their streak (best-effort).
    const { notify } = await import("@/lib/notifications");
    await notify({
      userId,
      type: "STREAK_FREEZE",
      title: "Streak freeze used",
      body: `You missed a day, but a freeze kept your ${next}-day streak alive.`,
      href: "/daily",
    }).catch(() => {});
  }

  return { dailyStreak: next, changed, freezeUsed };
}

/** Set a poll as the Daily Call for today (admin/seed helper). */
export async function setDailyCall(pollId: string) {
  const today = todayUtc();
  // Clear any existing daily for today, then assign.
  await db.poll.updateMany({ where: { dailyOn: today }, data: { dailyOn: null } });
  await db.poll.update({ where: { id: pollId }, data: { dailyOn: today } });
}
