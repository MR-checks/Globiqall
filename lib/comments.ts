import { db } from "@/lib/db";

export type CommentNode = Awaited<ReturnType<typeof listPollComments>>[number];

/**
 * Returns comments for a poll grouped into top-level + their direct replies.
 * Soft-deleted comments are kept in tree if they have children (body redacted).
 */
export async function listPollComments(pollId: string) {
  const rows = await db.comment.findMany({
    where: { pollId },
    orderBy: { createdAt: "asc" },
    include: {
      author: {
        select: { id: true, name: true, username: true, image: true },
      },
    },
  });

  type WithReplies = (typeof rows)[number] & {
    replies: WithReplies[];
    redactedBody: string | null;
  };

  const byId = new Map<string, WithReplies>();
  for (const r of rows) {
    byId.set(r.id, {
      ...r,
      replies: [],
      redactedBody: r.deletedAt ? "[deleted]" : null,
    });
  }
  const roots: WithReplies[] = [];
  for (const r of byId.values()) {
    if (r.parentId && byId.has(r.parentId)) {
      byId.get(r.parentId)!.replies.push(r);
    } else {
      roots.push(r);
    }
  }
  // Newest top-level first; replies stay oldest-first
  roots.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  // Strip top-level soft-deleted with no children
  return roots.filter((r) => !(r.deletedAt && r.replies.length === 0));
}

export async function countPollComments(pollId: string) {
  return db.comment.count({ where: { pollId, deletedAt: null } });
}
