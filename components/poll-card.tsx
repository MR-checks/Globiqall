import Link from "next/link";
import { TrendingUp } from "lucide-react";
import { categoryAccentStyle, categoryDotStyle } from "@/lib/category-colors";
import { pollIcon } from "@/lib/poll-visuals";
import { PollStatusBadge } from "@/components/poll-status-badge";
import { avatarUrl } from "@/lib/avatar";
import { cn, formatCount, formatCountdown, formatRelative, pct } from "@/lib/utils";

type PollCardData = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  type: string;
  visibility: string;
  totalVotes: number;
  createdAt: Date;
  featured: boolean;
  rising?: boolean;
  mode?: string;
  lockAt?: Date | null;
  resolvedAt?: Date | null;
  resolvedOptionId?: string | null;
  category?: {
    name: string;
    slug: string;
    color: string;
    emoji?: string; // kept in type for compatibility, intentionally NOT rendered
  } | null;
  author?: {
    name: string | null;
    username: string | null;
    image: string | null;
  } | null;
  options: { id: string; label: string; emoji: string | null; voteCount: number }[];
};

export function PollCard({ poll }: { poll: PollCardData }) {
  const total =
    poll.totalVotes || poll.options.reduce((a, o) => a + o.voteCount, 0);
  const isPrediction = poll.mode === "PREDICTION";
  const predState: "OPEN" | "LOCKED" | "RESOLVED" | null = isPrediction
    ? poll.resolvedAt
      ? "RESOLVED"
      : poll.lockAt && poll.lockAt <= new Date()
        ? "LOCKED"
        : "OPEN"
    : null;
  // For resolved predictions, surface the actual winning option as the headline.
  const resolvedWinner =
    poll.resolvedOptionId
      ? poll.options.find((o) => o.id === poll.resolvedOptionId)
      : null;
  const sorted = [...poll.options].sort((a, b) => b.voteCount - a.voteCount);
  const lead = resolvedWinner ?? sorted[0];
  const runner = sorted.find((o) => o.id !== lead?.id) ?? sorted[1];
  const leadPct = lead ? pct(lead.voteCount, total) : 0;
  const icon = pollIcon(poll);
  const isNew = Date.now() - poll.createdAt.getTime() < 12 * 3_600_000;

  return (
    <Link
      href={`/p/${poll.slug}`}
      className="group relative flex flex-col rounded-md border border-border bg-card transition-colors hover:border-foreground/30"
    >
      {/* Accent bar tied to category */}
      <div
        className="h-[3px] w-full rounded-t-md"
        style={categoryAccentStyle(poll.category?.color)}
        aria-hidden
      />

      {/* Status ribbon, top-right */}
      <PollStatusBadge
        state={predState}
        isNew={isNew && !isPrediction}
        className="absolute top-2.5 right-2.5 z-10"
      />

      {/* Meta row */}
      <div className="flex items-center justify-between px-4 pt-3 pr-20 text-[10px] font-mono uppercase tracking-[0.08em] text-muted-foreground">
        <div className="flex items-center gap-3 min-w-0">
          {poll.category && (
            <span className="inline-flex items-center gap-1.5 min-w-0">
              <span
                className="h-1.5 w-1.5 rounded-full shrink-0"
                style={categoryDotStyle(poll.category.color)}
                aria-hidden
              />
              <span className="truncate">{poll.category.name}</span>
            </span>
          )}
          {!isPrediction && poll.type === "BINARY" && <span>· vs</span>}
          {poll.visibility === "PRIVATE" && (
            <span className="text-warning">· private</span>
          )}
          {poll.rising && !isPrediction && (
            <span className="inline-flex items-center gap-1 text-accent">
              <TrendingUp className="h-3 w-3" /> rising
            </span>
          )}
        </div>
        <span className="shrink-0">
          {predState === "OPEN" && poll.lockAt
            ? `🔓 locks ${formatCountdown(poll.lockAt)}`
            : formatRelative(poll.createdAt)}
        </span>
      </div>

      {/* Body */}
      <div className="px-4 pt-3 pb-4 flex-1 flex flex-col">
        <div className="flex items-start gap-2.5">
          <span
            className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-md border border-border bg-secondary/40 text-[15px] leading-none"
            aria-hidden
          >
            {icon}
          </span>
          <h3 className="text-[15px] font-medium leading-snug text-balance tracking-tight-2 group-hover:text-foreground transition-colors">
            {poll.title}
          </h3>
        </div>

        {/* Result strip */}
        <div className="mt-5 flex items-end gap-4">
          <div className="font-mono tabular-nums leading-none">
            <span className="text-[34px] font-medium tracking-tight-2">
              {Number.isFinite(leadPct) ? leadPct.toFixed(1) : "0.0"}
            </span>
            <span className="text-[20px] text-muted-foreground ml-0.5">%</span>
          </div>
          <div className="min-w-0 flex-1 pb-1">
            <div className="truncate text-[13px] font-medium">
              {lead ? (
                <>
                  {lead.emoji && <span className="mr-1.5" aria-hidden>{lead.emoji}</span>}
                  {lead.label}
                </>
              ) : (
                "-"
              )}
            </div>
            {runner && (
              <div className="truncate text-[11px] text-muted-foreground mt-0.5">
                {runner.emoji && <span className="mr-1" aria-hidden>{runner.emoji}</span>}
                {runner.label}
                <span className="font-mono ml-1 tabular-nums">
                  {pct(runner.voteCount, total).toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Thin progress underline */}
        <div className="mt-3 h-px w-full bg-border relative overflow-hidden">
          <div
            className={cn(
              "absolute inset-y-0 left-0 transition-[width] duration-700",
              "bg-foreground",
            )}
            style={{ width: `${leadPct}%` }}
          />
        </div>

        {/* Footer */}
        <div className="mt-3 flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.08em] text-muted-foreground">
          <span className="tabular-nums">
            {formatCount(total)} {total === 1 ? "vote" : "votes"}
          </span>
          <span className="truncate ml-2 inline-flex items-center gap-1.5">
            {poll.author?.name ? (
              <>
                <span className="text-muted-foreground/70">by</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={avatarUrl({
                    image: poll.author.image,
                    seed: poll.author.username || poll.author.name,
                  })}
                  alt=""
                  aria-hidden
                  className="h-4 w-4 rounded-full bg-secondary object-cover shrink-0"
                />
                <span className="text-foreground/80 normal-case tracking-tight-2 truncate">
                  {poll.author.username
                    ? `@${poll.author.username}`
                    : poll.author.name}
                </span>
              </>
            ) : (
              <span>GlobiQall</span>
            )}
          </span>
        </div>
      </div>
    </Link>
  );
}
