"use client";

import * as React from "react";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { postComment } from "@/app/actions/comments";
import { cn } from "@/lib/utils";

type Props = {
  pollId: string;
  parentId?: string;
  signedIn: boolean;
  autoFocus?: boolean;
  placeholder?: string;
  onPosted?: () => void;
  /** Required for PRIVATE polls, passed through to the server action. */
  shareCode?: string | null;
};

const MAX = 800;

export function CommentComposer({
  pollId,
  parentId,
  signedIn,
  autoFocus,
  placeholder = "Add to the discussion…",
  onPosted,
  shareCode,
}: Props) {
  const [value, setValue] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);

  if (!signedIn) {
    return (
      <div className="rounded-md border border-dashed border-border bg-card px-4 py-3 text-[13px] text-muted-foreground">
        <a href="/sign-in" className="text-foreground underline decoration-accent underline-offset-4">
          Sign in
        </a>{" "}
        to join the discussion.
      </div>
    );
  }

  async function handleSubmit(formData: FormData) {
    if (!value.trim()) return;
    setPending(true);
    formData.set("pollId", pollId);
    formData.set("body", value);
    if (parentId) formData.set("parentId", parentId);
    if (shareCode) formData.set("shareCode", shareCode);
    const res = await postComment(formData);
    setPending(false);
    if (!res.ok) {
      toast.error(res.error ?? "Could not post");
      return;
    }
    setValue("");
    onPosted?.();
  }

  const remaining = MAX - value.length;
  const tooLong = remaining < 0;

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-2">
      <Textarea
        name="body"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        rows={parentId ? 2 : 3}
        autoFocus={autoFocus}
        className="bg-card text-[14px]"
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            formRef.current?.requestSubmit();
          }
        }}
      />
      <div className="flex items-center justify-between gap-3">
        <span
          className={cn(
            "font-mono text-[10px] uppercase tracking-[0.12em]",
            tooLong ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {tooLong ? `${-remaining} over` : `⌘↵ to post · ${remaining} left`}
        </span>
        <Button
          type="submit"
          variant="accent"
          size="sm"
          disabled={pending || tooLong || value.trim().length === 0}
        >
          {pending ? <Loader2 className="animate-spin" /> : <Send />}
          {parentId ? "Reply" : "Post"}
        </Button>
      </div>
    </form>
  );
}
