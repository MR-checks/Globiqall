"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { castVote } from "@/lib/polls";
import { detectCountry } from "@/lib/geo";
import { applyPollAccrual } from "@/lib/reputation";
import { checkLimit, tooFastMessage } from "@/lib/rate-limit";
import { moderate } from "@/lib/moderation";
import { pollAccessCheck } from "@/lib/access";
import { shortCode, slugify } from "@/lib/utils";

const optionSchema = z.object({
  label: z.string().trim().min(1, "Required").max(80),
  emoji: z.string().trim().max(8).optional(),
});

const createPollSchema = z.object({
  title: z.string().trim().min(5, "Tell us what to vote on").max(140),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  categoryId: z.string().min(1, "Pick a category"),
  type: z.enum(["BINARY", "MULTI"]),
  mode: z.enum(["DEBATE", "PREDICTION"]),
  visibility: z.enum(["PUBLIC", "UNLISTED", "PRIVATE"]),
  closesAt: z.string().optional().or(z.literal("")),
  lockAt: z.string().optional().or(z.literal("")),
  resolvesAt: z.string().optional().or(z.literal("")),
  options: z.array(optionSchema).min(2).max(6),
});

export async function createPoll(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in?next=/new");
  }

  // Rate limit poll creation per user
  const rl = checkLimit("createPoll", session.user.id);
  if (!rl.ok) {
    return { ok: false as const, error: tooFastMessage("createPoll", rl.retryAfterSec) };
  }

  // Pull array fields manually
  const rawOptions: { label: string; emoji?: string }[] = [];
  for (let i = 0; i < 6; i++) {
    const label = formData.get(`option_${i}`);
    const emoji = formData.get(`emoji_${i}`);
    if (typeof label === "string" && label.trim()) {
      rawOptions.push({
        label: label.trim(),
        emoji: typeof emoji === "string" && emoji.trim() ? emoji.trim() : undefined,
      });
    }
  }

  const parsed = createPollSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    categoryId: formData.get("categoryId"),
    type: formData.get("type") ?? "MULTI",
    mode: formData.get("mode") ?? "DEBATE",
    visibility: formData.get("visibility") ?? "PUBLIC",
    closesAt: formData.get("closesAt") ?? "",
    lockAt: formData.get("lockAt") ?? "",
    resolvesAt: formData.get("resolvesAt") ?? "",
    options: rawOptions,
  });

  if (!parsed.success) {
    const issues = parsed.error.flatten();
    return {
      ok: false as const,
      error: Object.values(issues.fieldErrors).flat().join(" · ") || "Invalid input",
    };
  }
  const data = parsed.data;

  if (data.type === "BINARY" && data.options.length !== 2) {
    return { ok: false as const, error: "Versus polls need exactly 2 options" };
  }

  // Content guard
  const titleCheck = moderate(data.title, "title");
  if (!titleCheck.ok) return { ok: false as const, error: titleCheck.error };
  if (data.description) {
    const descCheck = moderate(data.description, "description");
    if (!descCheck.ok) return { ok: false as const, error: descCheck.error };
  }
  for (const o of data.options) {
    const optCheck = moderate(o.label, "title");
    if (!optCheck.ok) return { ok: false as const, error: optCheck.error };
  }

  const slug = slugify(data.title);
  const shareCode = data.visibility === "PRIVATE" ? shortCode(8) : null;

  const closesAt =
    data.closesAt && data.closesAt.length > 0 ? new Date(data.closesAt) : null;
  if (closesAt && Number.isNaN(closesAt.getTime())) {
    return { ok: false as const, error: "Invalid closing date" };
  }

  // Prediction timing
  let lockAt: Date | null = null;
  let resolvesAt: Date | null = null;
  if (data.mode === "PREDICTION") {
    if (!data.lockAt) {
      return { ok: false as const, error: "Predictions need a lock time" };
    }
    lockAt = new Date(data.lockAt);
    if (Number.isNaN(lockAt.getTime())) {
      return { ok: false as const, error: "Invalid lock time" };
    }
    if (lockAt < new Date(Date.now() - 60_000)) {
      return { ok: false as const, error: "Lock time must be in the future" };
    }
    if (data.resolvesAt) {
      resolvesAt = new Date(data.resolvesAt);
      if (Number.isNaN(resolvesAt.getTime())) {
        return { ok: false as const, error: "Invalid resolve time" };
      }
      if (resolvesAt < lockAt) {
        return { ok: false as const, error: "Resolve time must be after lock time" };
      }
    }
  }

  await applyPollAccrual(session.user.id).catch(() => null);

  // If kicked off from a Drop, carry its thumbnail onto the poll and remember
  // to link it back below.
  const dropId =
    typeof formData.get("dropId") === "string"
      ? (formData.get("dropId") as string)
      : "";
  const dropImageUrl = dropId
    ? (
        await db.drop
          .findUnique({ where: { id: dropId }, select: { imageUrl: true } })
          .catch(() => null)
      )?.imageUrl ?? null
    : null;

  const poll = await db.poll.create({
    data: {
      slug,
      title: data.title,
      description: data.description || null,
      imageUrl: dropImageUrl,
      type: data.type,
      mode: data.mode,
      visibility: data.visibility,
      shareCode,
      closesAt,
      lockAt,
      resolvesAt,
      categoryId: data.categoryId,
      authorId: session.user.id,
      options: {
        create: data.options.map((o, i) => ({
          label: o.label,
          emoji: o.emoji,
          position: i,
        })),
      },
    },
    select: { id: true, slug: true, shareCode: true, visibility: true },
  });

  // If this poll was kicked off from a Drop, link it back for attribution + analytics.
  if (dropId) {
    await db.drop
      .update({
        where: { id: dropId },
        data: { pollId: poll.id, clickCount: { increment: 1 } },
      })
      .catch(() => null);
  }

  revalidatePath("/");
  if (poll.visibility === "PRIVATE" && poll.shareCode) {
    redirect(`/p/${poll.slug}?k=${poll.shareCode}&new=1`);
  }
  redirect(`/p/${poll.slug}?new=1`);
}

export async function voteAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false as const, error: "Sign in to vote" };
  }
  const pollId = formData.get("pollId");
  const optionId = formData.get("optionId");
  const shareCode = formData.get("shareCode");
  const convictionRaw = formData.get("conviction");
  if (typeof pollId !== "string" || typeof optionId !== "string") {
    return { ok: false as const, error: "Bad request" };
  }
  const conviction =
    typeof convictionRaw === "string" ? Number(convictionRaw) : undefined;

  // Rate limit per user
  const rl = checkLimit("vote", session.user.id);
  if (!rl.ok) {
    return { ok: false as const, error: tooFastMessage("vote", rl.retryAfterSec) };
  }

  // Visibility check, never let someone vote on a private poll they can't see.
  const access = await pollAccessCheck({
    pollId,
    viewerId: session.user.id,
    shareCode: typeof shareCode === "string" ? shareCode : null,
  });
  if (!access) {
    return { ok: false as const, error: "Poll not found" };
  }

  // Detect country from edge headers (Vercel/Cloudflare), falls back to null in plain Node.
  const country = await detectCountry();

  try {
    const result = await castVote({
      pollId,
      optionId,
      userId: session.user.id,
      countryCode: country ?? undefined,
      conviction: Number.isFinite(conviction) ? conviction : undefined,
    });
    return { ok: true as const, streakDays: result.accrual?.streakDays };
  } catch (e) {
    return {
      ok: false as const,
      error: e instanceof Error ? e.message : "Vote failed",
    };
  }
}

/**
 * Resolve a prediction. Allowed for the poll's author or an admin.
 * Scores every pick into reputation and stamps the outcome.
 */
export async function resolvePollAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const, error: "Sign in required" };

  const pollId = String(formData.get("pollId") ?? "");
  const winningOptionId = String(formData.get("winningOptionId") ?? "");
  const source = String(formData.get("source") ?? "");
  const note = String(formData.get("note") ?? "");
  if (!pollId || !winningOptionId) {
    return { ok: false as const, error: "Missing fields" };
  }

  const poll = await db.poll.findUnique({
    where: { id: pollId },
    select: { authorId: true, slug: true, mode: true },
  });
  if (!poll) return { ok: false as const, error: "Poll not found" };
  if (poll.mode !== "PREDICTION") {
    return { ok: false as const, error: "Only predictions can be resolved" };
  }

  const me = await db.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true },
  });
  const isAuthor = poll.authorId === session.user.id;
  if (!isAuthor && !me?.isAdmin) {
    return { ok: false as const, error: "Only the author can resolve this" };
  }

  // Light content guard on the note
  if (note) {
    const g = moderate(note, "comment");
    if (!g.ok) return { ok: false as const, error: g.error };
  }

  const { resolvePrediction } = await import("@/lib/predictions");
  const res = await resolvePrediction({
    pollId,
    winningOptionId,
    resolverId: session.user.id,
    source,
    note,
  });
  if (!res.ok) return { ok: false as const, error: res.error ?? "Resolve failed" };

  revalidatePath(`/p/${poll.slug}`);
  revalidatePath("/predictions");
  return { ok: true as const, scored: res.scored, winnerLabel: res.winnerLabel };
}
