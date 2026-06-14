"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { db } from "@/lib/db";
import { checkLimit, tooFastMessage } from "@/lib/rate-limit";

/**
 * Delete the current user's account and all owned content.
 * Cascading FKs in Prisma schema take care of:
 *  - Account, Session (auth tokens)
 *  - Poll → PollOption → Vote (their polls + all votes on them)
 *  - Vote (votes they cast on others' polls)
 *  - Comment (their own; replies orphan-cascade)
 * Caller must confirm by typing their username; we verify it here too.
 */
export async function deleteMyAccount(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const rl = checkLimit("updateProfile", session.user.id);
  if (!rl.ok) {
    return { ok: false as const, error: tooFastMessage("updateProfile", rl.retryAfterSec) };
  }

  const me = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, username: true, email: true },
  });
  if (!me) return { ok: false as const, error: "Account not found" };

  // Confirmation token: prefers username; falls back to "DELETE" if no username set
  const confirmExpected = me.username ?? "DELETE";
  const confirmGiven = String(formData.get("confirm") ?? "").trim().toLowerCase();
  if (confirmGiven !== confirmExpected.toLowerCase()) {
    return {
      ok: false as const,
      error: `Type "${confirmExpected}" to confirm deletion.`,
    };
  }

  // Best-effort denormalized fixup: reduce totalVotes on polls this user voted on
  // (votes will cascade-delete; counters need to drop). Keep it tidy.
  const myVotes = await db.vote.findMany({
    where: { userId: me.id },
    select: { pollId: true, optionId: true },
  });
  for (const v of myVotes) {
    await db.$transaction([
      db.pollOption.update({ where: { id: v.optionId }, data: { voteCount: { decrement: 1 } } }),
      db.poll.update({ where: { id: v.pollId }, data: { totalVotes: { decrement: 1 } } }),
    ]).catch(() => null);
  }

  // Cascade everything else
  await db.user.delete({ where: { id: me.id } });

  revalidatePath("/");
  await signOut({ redirectTo: "/" });
  // Above throws NEXT_REDIRECT; this line is unreachable but TypeScript-happy:
  return { ok: true as const };
}

/**
 * Return a JSON blob of everything we hold on the user.
 * Used by /settings/account → Export.
 */
export async function exportMyData() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const u = await db.user.findUnique({
    where: { id: session.user.id },
    include: {
      polls: {
        include: { options: { orderBy: { position: "asc" } }, category: { select: { slug: true } } },
        orderBy: { createdAt: "desc" },
      },
      votes: {
        include: {
          poll: { select: { slug: true, title: true } },
          option: { select: { label: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      comments: {
        include: { poll: { select: { slug: true, title: true } } },
        orderBy: { createdAt: "desc" },
        where: { deletedAt: null },
      },
    },
  });
  if (!u) {
    return { ok: false as const, error: "Not found" };
  }

  // Strip sensitive fields, shape for portability
  const payload = {
    generatedAt: new Date().toISOString(),
    profile: {
      id: u.id,
      name: u.name,
      email: u.email,
      username: u.username,
      bio: u.bio,
      country: u.country,
      reputation: u.reputation,
      streakDays: u.streakDays,
      lastVoteOn: u.lastVoteOn,
      createdAt: u.createdAt,
    },
    polls: u.polls.map((p) => ({
      slug: p.slug,
      title: p.title,
      description: p.description,
      type: p.type,
      visibility: p.visibility,
      category: p.category.slug,
      totalVotes: p.totalVotes,
      closesAt: p.closesAt,
      createdAt: p.createdAt,
      options: p.options.map((o) => ({ label: o.label, emoji: o.emoji, voteCount: o.voteCount })),
    })),
    votes: u.votes.map((v) => ({
      pollSlug: v.poll.slug,
      pollTitle: v.poll.title,
      option: v.option.label,
      countryCode: v.countryCode,
      castAt: v.createdAt,
    })),
    comments: u.comments.map((c) => ({
      pollSlug: c.poll.slug,
      pollTitle: c.poll.title,
      body: c.body,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    })),
  };

  return { ok: true as const, payload };
}
