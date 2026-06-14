"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { applyCommentAccrual } from "@/lib/reputation";
import { checkLimit, tooFastMessage } from "@/lib/rate-limit";
import { moderate } from "@/lib/moderation";
import { pollAccessCheck } from "@/lib/access";

const bodySchema = z
  .string()
  .trim()
  .min(1, "Say something")
  .max(800, "Keep it under 800 characters");

export async function postComment(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const, error: "Sign in to comment" };

  const pollId = String(formData.get("pollId") ?? "");
  const parentId = (formData.get("parentId") as string | null) || null;
  const shareCode = (formData.get("shareCode") as string | null) || null;
  const bodyParse = bodySchema.safeParse(formData.get("body"));
  if (!pollId) return { ok: false as const, error: "Missing poll" };
  if (!bodyParse.success) {
    return { ok: false as const, error: bodyParse.error.issues[0]?.message ?? "Invalid" };
  }

  // Visibility check — block writes to private polls without share code
  const access = await pollAccessCheck({
    pollId,
    viewerId: session.user.id,
    shareCode,
  });
  if (!access) return { ok: false as const, error: "Poll not found" };

  const poll = await db.poll.findUnique({
    where: { id: pollId },
    select: { id: true, slug: true },
  });
  if (!poll) return { ok: false as const, error: "Poll not found" };

  // Rate limit
  const rl = checkLimit("postComment", session.user.id);
  if (!rl.ok) {
    return { ok: false as const, error: tooFastMessage("postComment", rl.retryAfterSec) };
  }

  // Content guard
  const guard = moderate(bodyParse.data, "comment");
  if (!guard.ok) return { ok: false as const, error: guard.error };

  if (parentId) {
    const parent = await db.comment.findUnique({
      where: { id: parentId },
      select: { id: true, pollId: true, parentId: true },
    });
    if (!parent || parent.pollId !== pollId) {
      return { ok: false as const, error: "Bad reply target" };
    }
    // Cap depth at 1 (replies cannot have replies)
    if (parent.parentId) {
      return { ok: false as const, error: "Replies are one level deep" };
    }
  }

  await db.comment.create({
    data: {
      pollId,
      authorId: session.user.id,
      parentId,
      body: bodyParse.data,
    },
  });

  await applyCommentAccrual(session.user.id).catch(() => null);

  revalidatePath(`/p/${poll.slug}`);
  return { ok: true as const };
}

export async function deleteComment(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const, error: "Sign in required" };
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false as const, error: "Missing id" };

  const c = await db.comment.findUnique({
    where: { id },
    select: { authorId: true, poll: { select: { slug: true } } },
  });
  if (!c || c.authorId !== session.user.id) {
    return { ok: false as const, error: "Not yours to delete" };
  }
  await db.comment.update({
    where: { id },
    data: { deletedAt: new Date(), body: "" },
  });
  revalidatePath(`/p/${c.poll.slug}`);
  return { ok: true as const };
}

export async function editComment(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const, error: "Sign in required" };
  const id = String(formData.get("id") ?? "");
  const bodyParse = bodySchema.safeParse(formData.get("body"));
  if (!id) return { ok: false as const, error: "Missing id" };
  if (!bodyParse.success)
    return { ok: false as const, error: bodyParse.error.issues[0]?.message ?? "Invalid" };

  const c = await db.comment.findUnique({
    where: { id },
    select: { authorId: true, poll: { select: { slug: true } }, deletedAt: true },
  });
  if (!c || c.authorId !== session.user.id || c.deletedAt) {
    return { ok: false as const, error: "Not editable" };
  }
  await db.comment.update({
    where: { id },
    data: { body: bodyParse.data },
  });
  revalidatePath(`/p/${c.poll.slug}`);
  return { ok: true as const };
}
