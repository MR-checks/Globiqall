import { db } from "@/lib/db";

/**
 * Verify that a viewer can access a poll given its visibility rules.
 *
 *  - PUBLIC:   anyone
 *  - UNLISTED: anyone with the URL (no check beyond existence)
 *  - PRIVATE:  the author, OR anyone who can present the shareCode
 *
 * Use this from any endpoint or action that touches a specific poll.
 * Returns the poll record on success, or null on failure so callers
 * can decide between 404 / 403.
 */
export async function pollAccessCheck(opts: {
  pollId: string;
  viewerId?: string | null;
  shareCode?: string | null;
}) {
  const poll = await db.poll.findUnique({
    where: { id: opts.pollId },
    select: {
      id: true,
      slug: true,
      visibility: true,
      shareCode: true,
      authorId: true,
      closesAt: true,
      resolvedAt: true,
    },
  });
  if (!poll) return null;

  if (poll.visibility === "PRIVATE") {
    const ok =
      (opts.shareCode && opts.shareCode === poll.shareCode) ||
      (opts.viewerId && opts.viewerId === poll.authorId);
    if (!ok) return null;
  }
  return poll;
}
