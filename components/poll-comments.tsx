import { auth } from "@/auth";
import { listPollComments } from "@/lib/comments";
import { CommentComposer } from "@/components/comment-composer";
import { CommentItem } from "@/components/comment-item";

export async function PollComments({
  pollId,
  shareCode,
}: {
  pollId: string;
  shareCode?: string | null;
}) {
  const [session, comments] = await Promise.all([
    auth(),
    listPollComments(pollId),
  ]);
  const signedIn = Boolean(session?.user?.id);
  const userId = session?.user?.id;

  // Count includes replies for the header
  const totalAlive = comments.reduce(
    (acc, c) => acc + (c.deletedAt ? 0 : 1) + c.replies.filter((r) => !r.deletedAt).length,
    0,
  );

  return (
    <section className="mt-12">
      <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground hairline-b pb-2 mb-4 flex items-center justify-between">
        <span>Discussion</span>
        <span className="tabular-nums">
          {totalAlive} {totalAlive === 1 ? "comment" : "comments"}
        </span>
      </h2>

      <div className="mb-6">
        <CommentComposer pollId={pollId} signedIn={signedIn} shareCode={shareCode} />
      </div>

      {comments.length === 0 ? (
        <p className="text-center text-[13px] text-muted-foreground py-8">
          No comments yet. Start the conversation.
        </p>
      ) : (
        <ol className="divide-y divide-border">
          {comments.map((c) => (
            <li key={c.id}>
              <CommentItem
                comment={c}
                pollId={pollId}
                currentUserId={userId}
                signedIn={signedIn}
                shareCode={shareCode}
              />
              {c.replies.length > 0 && (
                <ol className="border-l border-border ml-3">
                  {c.replies.map((r) => (
                    <li key={r.id}>
                      <CommentItem
                        comment={r}
                        pollId={pollId}
                        currentUserId={userId}
                        isReply
                        signedIn={signedIn}
                        shareCode={shareCode}
                      />
                    </li>
                  ))}
                </ol>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
