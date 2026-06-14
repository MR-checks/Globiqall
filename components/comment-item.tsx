"use client";

import * as React from "react";
import Link from "next/link";
import { CornerDownRight, MoreHorizontal, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CommentComposer } from "@/components/comment-composer";
import { deleteComment, editComment } from "@/app/actions/comments";
import { cn, formatRelative } from "@/lib/utils";

type Author = {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
};

type CommentItemModel = {
  id: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  parentId: string | null;
  author: Author;
};

type Props = {
  comment: CommentItemModel;
  pollId: string;
  currentUserId?: string;
  isReply?: boolean;
  signedIn: boolean;
  shareCode?: string | null;
};

export function CommentItem({
  comment,
  pollId,
  currentUserId,
  isReply,
  signedIn,
  shareCode,
}: Props) {
  const [showReply, setShowReply] = React.useState(false);
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(comment.body);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!menuOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [menuOpen]);

  const isOwn = currentUserId && comment.author.id === currentUserId;
  const deleted = Boolean(comment.deletedAt);
  const initial = (comment.author.name?.[0] ?? comment.author.username?.[0] ?? "?").toUpperCase();
  const displayName = comment.author.username
    ? `@${comment.author.username}`
    : comment.author.name ?? "anonymous";

  async function handleDelete() {
    setMenuOpen(false);
    const fd = new FormData();
    fd.set("id", comment.id);
    const res = await deleteComment(fd);
    if (!res.ok) toast.error(res.error);
  }

  async function handleSaveEdit() {
    const fd = new FormData();
    fd.set("id", comment.id);
    fd.set("body", draft);
    const res = await editComment(fd);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setEditing(false);
  }

  return (
    <article
      className={cn(
        "group relative flex gap-3 py-3",
        isReply && "pl-8 sm:pl-10",
      )}
    >
      {isReply && (
        <CornerDownRight
          className="absolute left-1 top-3.5 h-3.5 w-3.5 text-muted-foreground/60"
          aria-hidden
        />
      )}
      <div className="shrink-0">
        <Link
          href={comment.author.username ? `/u/${comment.author.username}` : "#"}
          tabIndex={comment.author.username ? 0 : -1}
        >
          <Avatar className="h-7 w-7 border border-border">
            {comment.author.image && (
              <AvatarImage src={comment.author.image} alt={comment.author.name ?? ""} />
            )}
            <AvatarFallback className="text-[10px]">{initial}</AvatarFallback>
          </Avatar>
        </Link>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-0.5">
          <Link
            href={comment.author.username ? `/u/${comment.author.username}` : "#"}
            className={cn(
              "text-[13px] font-medium tracking-tight-2 truncate",
              comment.author.username
                ? "hover:underline decoration-accent underline-offset-4"
                : "pointer-events-none",
            )}
          >
            {displayName}
          </Link>
          <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
            {formatRelative(comment.createdAt)}
            {comment.updatedAt.getTime() - comment.createdAt.getTime() > 5_000 && !deleted && (
              <> · edited</>
            )}
          </span>
          {isOwn && !deleted && (
            <div className="ml-auto relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="h-6 w-6 inline-flex items-center justify-center rounded-sm text-muted-foreground hover:text-foreground hover:bg-secondary opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                aria-label="Comment actions"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-7 z-20 w-32 rounded-md border border-border bg-popover shadow-md p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setEditing(true);
                    }}
                    className="w-full text-left text-[13px] px-2 py-1.5 rounded-sm hover:bg-secondary inline-flex items-center gap-2"
                  >
                    <Pencil className="h-3 w-3" /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="w-full text-left text-[13px] px-2 py-1.5 rounded-sm hover:bg-secondary inline-flex items-center gap-2 text-destructive"
                  >
                    <Trash2 className="h-3 w-3" /> Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {deleted ? (
          <p className="text-[13px] text-muted-foreground italic">[deleted]</p>
        ) : editing ? (
          <div className="space-y-2 mt-1">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              className="bg-card text-[13px]"
              autoFocus
            />
            <div className="flex items-center gap-2">
              <Button size="sm" variant="accent" onClick={handleSaveEdit}>
                Save
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditing(false);
                  setDraft(comment.body);
                }}
              >
                <X /> Cancel
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-[14px] leading-relaxed text-foreground/95 whitespace-pre-wrap text-pretty">
            {comment.body}
          </p>
        )}

        {!deleted && !editing && !isReply && (
          <div className="mt-1.5">
            <button
              type="button"
              onClick={() => setShowReply((v) => !v)}
              className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground hover:text-foreground"
            >
              {showReply ? "Cancel" : "Reply"}
            </button>
          </div>
        )}

        {showReply && !isReply && (
          <div className="mt-3">
            <CommentComposer
              pollId={pollId}
              parentId={comment.id}
              signedIn={signedIn}
              autoFocus
              placeholder={`Reply to ${displayName}…`}
              onPosted={() => setShowReply(false)}
              shareCode={shareCode}
            />
          </div>
        )}
      </div>
    </article>
  );
}
