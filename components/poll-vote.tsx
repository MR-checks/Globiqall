"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Check, Loader2, Lock, Share2, Target, Trophy, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LiveCounter } from "@/components/live-counter";
import { Countdown } from "@/components/countdown";
import { ReceiptLinkButton } from "@/components/receipt-share-button";
import { cn, formatCount, pct } from "@/lib/utils";
import { voteAction } from "@/app/actions";

type PollOption = {
  id: string;
  label: string;
  emoji: string | null;
  position: number;
  voteCount: number;
};

type PredictionState = "OPEN" | "LOCKED" | "RESOLVED";

type Props = {
  pollId: string;
  type: "BINARY" | "MULTI" | string;
  mode: "DEBATE" | "PREDICTION" | string;
  options: PollOption[];
  initialTotalVotes: number;
  initialUserOptionId: string | null;
  initialConviction?: number;
  isSignedIn: boolean;
  closed: boolean;
  shareUrl: string;
  shareCode?: string | null;
  // Prediction-only
  predictionState?: PredictionState;
  lockAt?: string | null;
  resolvedOptionId?: string | null;
  userCorrect?: boolean | null;
  userRepAwarded?: number | null;
  userTrophyTier?: string | null;
  slug?: string;
  viewerUsername?: string | null;
};

const CONVICTION_LABELS = ["", "Low", "Medium", "High"] as const;

export function PollVote({
  pollId,
  type,
  mode,
  options,
  initialTotalVotes,
  initialUserOptionId,
  initialConviction = 1,
  isSignedIn,
  closed,
  shareUrl,
  shareCode,
  predictionState = "OPEN",
  lockAt,
  resolvedOptionId,
  userCorrect,
  userRepAwarded,
  userTrophyTier,
  slug,
  viewerUsername,
}: Props) {
  const isPrediction = mode === "PREDICTION";
  const [counts, setCounts] = React.useState<Record<string, number>>(() =>
    Object.fromEntries(options.map((o) => [o.id, o.voteCount])),
  );
  const [total, setTotal] = React.useState(initialTotalVotes);
  const [chosen, setChosen] = React.useState<string | null>(initialUserOptionId);
  const [conviction, setConviction] = React.useState<number>(
    Math.min(3, Math.max(1, initialConviction)),
  );
  const [pending, setPending] = React.useState<string | null>(null);
  // Client-side lock flip when the deadline passes mid-session.
  const [clientLocked, setClientLocked] = React.useState(false);

  const effectiveState: PredictionState =
    isPrediction && predictionState === "OPEN" && clientLocked
      ? "LOCKED"
      : predictionState;

  // Voting disabled when: debate-closed, or prediction not OPEN.
  const disabled = isPrediction ? effectiveState !== "OPEN" : closed;
  const resolved = isPrediction && effectiveState === "RESOLVED";

  React.useEffect(() => {
    const streamUrl = shareCode
      ? `/api/polls/${pollId}/stream?k=${encodeURIComponent(shareCode)}`
      : `/api/polls/${pollId}/stream`;
    const es = new EventSource(streamUrl);
    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data) as {
          totalVotes: number;
          options: { id: string; voteCount: number }[];
        };
        setTotal(data.totalVotes);
        setCounts((prev) => {
          const next = { ...prev };
          for (const o of data.options) next[o.id] = o.voteCount;
          return next;
        });
      } catch {
        /* ignore */
      }
    };
    return () => es.close();
  }, [pollId, shareCode]);

  const persist = async (optionId: string, conv: number) => {
    const fd = new FormData();
    fd.set("pollId", pollId);
    fd.set("optionId", optionId);
    fd.set("conviction", String(conv));
    if (shareCode) fd.set("shareCode", shareCode);
    return voteAction(fd);
  };

  const handleVote = async (optionId: string, conv = conviction) => {
    if (disabled) return;
    if (!isSignedIn) {
      const params = new URLSearchParams({ next: window.location.pathname });
      window.location.href = `/sign-in?${params.toString()}`;
      return;
    }
    if (chosen === optionId && conv === conviction) return;

    setPending(optionId);
    const prevChosen = chosen;
    const prevCounts = counts;
    const prevTotal = total;
    const prevConv = conviction;

    setChosen(optionId);
    setConviction(conv);
    setCounts((c) => {
      const next = { ...c, [optionId]: (c[optionId] ?? 0) + (prevChosen === optionId ? 0 : 1) };
      if (prevChosen && prevChosen !== optionId)
        next[prevChosen] = Math.max(0, (c[prevChosen] ?? 0) - 1);
      return next;
    });
    if (!prevChosen) setTotal((t) => t + 1);

    const res = await persist(optionId, conv);
    setPending(null);
    if (!res.ok) {
      setChosen(prevChosen);
      setConviction(prevConv);
      setCounts(prevCounts);
      setTotal(prevTotal);
      toast.error(res.error ?? "Could not record your pick");
    } else {
      toast.success(
        isPrediction
          ? prevChosen
            ? "Call updated"
            : "Call locked in"
          : prevChosen
            ? "Vote changed"
            : "Vote recorded",
      );
    }
  };

  const sorted = [...options].sort((a, b) => a.position - b.position);
  const leadId = chosen
    ? sorted.reduce((best, o) => ((counts[o.id] ?? 0) > (counts[best.id] ?? 0) ? o : best)).id
    : null;
  const revealSplit = chosen !== null || disabled; // show crowd bars once you've picked or it's closed

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: document.title, url: shareUrl });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Link copied");
      }
    } catch {
      /* user cancelled */
    }
  };

  const unit = isPrediction ? "call" : "vote";

  return (
    <div className="space-y-5">
      {/* Header: live total */}
      <div className="flex items-baseline justify-between hairline-b pb-3">
        <div className="flex items-baseline gap-3">
          <LiveCounter
            value={total}
            className="font-mono text-[40px] sm:text-[48px] font-medium tracking-tight-2 leading-none"
          />
          <div className="flex flex-col leading-tight">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              {total === 1 ? unit : `${unit}s`}
            </span>
            <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-positive">
              <span className="h-1.5 w-1.5 rounded-full bg-positive" />
              live
            </span>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={handleShare}>
          <Share2 /> Share
        </Button>
      </div>

      {/* State banners */}
      {isPrediction && effectiveState === "OPEN" && lockAt && (
        <div className="flex items-center gap-2 rounded-md border border-accent/30 bg-accent/10 px-3 py-2 text-xs text-accent font-mono uppercase tracking-[0.08em]">
          <Target className="h-3.5 w-3.5" />
          Prediction · locks in{" "}
          <Countdown target={lockAt} onReached={() => setClientLocked(true)} />
        </div>
      )}
      {isPrediction && effectiveState === "LOCKED" && (
        <div className="flex items-center gap-2 rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning font-mono uppercase tracking-[0.08em]">
          <Lock className="h-3.5 w-3.5" /> Locked · awaiting the result
        </div>
      )}
      {!isPrediction && closed && (
        <div className="flex items-center gap-2 rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning font-mono uppercase tracking-[0.08em]">
          <Lock className="h-3.5 w-3.5" /> Closed · voting disabled
        </div>
      )}

      {/* Resolved result summary */}
      {resolved && chosen && (
        <div
          className={cn(
            "rounded-md border px-3.5 py-3",
            userCorrect
              ? "border-positive/40 bg-positive/10"
              : "border-destructive/40 bg-destructive/10",
          )}
        >
          <div className="flex items-center justify-between">
            <span
              className={cn(
                "inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em]",
                userCorrect ? "text-positive" : "text-destructive",
              )}
            >
              {userCorrect ? <Trophy className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
              {userCorrect
                ? userTrophyTier
                  ? `${userTrophyTier} call`
                  : "You called it"
                : "You missed this one"}
            </span>
            {typeof userRepAwarded === "number" && (
              <span
                className={cn(
                  "font-mono tabular-nums text-[14px] font-medium",
                  userRepAwarded >= 0 ? "text-positive" : "text-destructive",
                )}
              >
                {userRepAwarded >= 0 ? "+" : ""}
                {userRepAwarded} rep
              </span>
            )}
          </div>
          {userCorrect && slug && viewerUsername && (
            <div className="mt-3">
              <ReceiptLinkButton slug={slug} username={viewerUsername} />
            </div>
          )}
        </div>
      )}

      {/* Conviction selector (prediction, open, picking) */}
      {isPrediction && effectiveState === "OPEN" && isSignedIn && (
        <div className="flex items-center justify-between gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            Conviction
          </span>
          <div className="inline-flex rounded-md border border-border overflow-hidden">
            {[1, 2, 3].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setConviction(c);
                  if (chosen) handleVote(chosen, c);
                }}
                className={cn(
                  "px-3 py-1.5 text-[12px] tracking-tight-2 transition-colors border-r border-border last:border-r-0",
                  conviction === c
                    ? "bg-foreground text-background"
                    : "bg-card text-muted-foreground hover:text-foreground hover:bg-secondary/50",
                )}
                aria-pressed={conviction === c}
              >
                {CONVICTION_LABELS[c]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Options */}
      <div
        className={cn(
          "grid gap-2",
          type === "BINARY" ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1",
        )}
      >
        {sorted.map((o) => {
          const count = counts[o.id] ?? 0;
          const p = pct(count, total);
          const isChosen = chosen === o.id;
          const isLead = leadId === o.id && revealSplit && p > 0 && !resolved;
          const isWinner = resolved && resolvedOptionId === o.id;
          const isLoserChosen = resolved && isChosen && resolvedOptionId !== o.id;
          const isPending = pending === o.id;

          return (
            <button
              key={o.id}
              type="button"
              disabled={disabled || isPending}
              onClick={() => handleVote(o.id)}
              className={cn(
                "group relative overflow-hidden rounded-md border text-left transition-colors",
                "px-3.5 py-3 min-h-[68px]",
                isWinner
                  ? "border-positive ring-1 ring-positive/40 bg-card"
                  : isLoserChosen
                    ? "border-destructive/50 bg-card"
                    : isChosen
                      ? "border-foreground bg-card"
                      : "border-border bg-card hover:border-foreground/40 hover:bg-secondary/50",
                disabled && "cursor-default",
              )}
            >
              {/* Bar */}
              <motion.div
                aria-hidden
                className={cn(
                  "absolute inset-y-0 left-0",
                  isWinner ? "bg-positive/15" : isChosen ? "bg-accent/15" : "bg-secondary",
                )}
                animate={{ width: `${revealSplit ? p : 0}%` }}
                transition={{ type: "spring", stiffness: 140, damping: 24 }}
                style={{ width: revealSplit ? `${p}%` : 0 }}
              />

              <div className="relative z-10 flex items-center gap-3">
                {/* Percentage block — only shown once split is revealed */}
                <div className="w-[64px] shrink-0 font-mono tabular-nums leading-none">
                  {revealSplit ? (
                    <>
                      <div className="text-[20px] font-medium tracking-tight-2">
                        {p.toFixed(1)}
                        <span className="text-muted-foreground text-[12px] ml-0.5">%</span>
                      </div>
                      <div className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground mt-1">
                        {formatCount(count)}
                      </div>
                    </>
                  ) : (
                    <div className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                      {unit}
                    </div>
                  )}
                </div>

                <div className="hairline -my-1 self-stretch w-px bg-border" />

                {/* Label */}
                <div className="min-w-0 flex-1 flex items-center gap-2">
                  {o.emoji && (
                    <span className="text-base leading-none shrink-0" aria-hidden>
                      {o.emoji}
                    </span>
                  )}
                  <span className="text-[14px] truncate tracking-tight-2 font-medium text-foreground/90">
                    {o.label}
                  </span>
                  {isWinner && (
                    <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-positive shrink-0">
                      · happened
                    </span>
                  )}
                  {isLead && (
                    <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-accent shrink-0">
                      · lead
                    </span>
                  )}
                  {isChosen && !resolved && (
                    <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground shrink-0">
                      · your {unit}
                      {isPrediction && ` · ${CONVICTION_LABELS[conviction].toLowerCase()}`}
                    </span>
                  )}
                </div>

                {/* Trailing status */}
                <div className="shrink-0 w-6 grid place-items-center">
                  {isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                  ) : isWinner ? (
                    <Check className="h-3.5 w-3.5 text-positive" />
                  ) : isLoserChosen ? (
                    <X className="h-3.5 w-3.5 text-destructive" />
                  ) : isChosen ? (
                    <Check className="h-3.5 w-3.5 text-accent" />
                  ) : !disabled ? (
                    <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/0 group-hover:text-muted-foreground transition-colors" />
                  ) : null}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground text-center">
        {resolved
          ? "Resolved · reputation awarded"
          : isPrediction
            ? effectiveState === "LOCKED"
              ? "Calls are locked · result pending"
              : chosen
                ? "Call is in · change it any time before lock"
                : "Pick a side and lock your call"
            : chosen
              ? "Vote locked in · tap another option to change"
              : closed
                ? "Polling closed"
                : "Tap an option to cast your vote"}
      </p>
    </div>
  );
}
