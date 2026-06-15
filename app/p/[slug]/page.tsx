import { notFound } from "next/navigation";
import Link from "next/link";
import { Calendar, ExternalLink, Globe2, Lock, Target } from "lucide-react";
import { auth } from "@/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PollVote } from "@/components/poll-vote";
import { PollComments } from "@/components/poll-comments";
import { PollCountryBreakdown } from "@/components/poll-country-breakdown";
import { PredictionResolvePanel } from "@/components/prediction-resolve-panel";
import { db } from "@/lib/db";
import { getPollBySlug, getUserVote } from "@/lib/polls";
import { computePredictionState, predictionStateLabel } from "@/lib/predictions";
import { trophyTierForRep } from "@/lib/trophies";
import { categoryAccentStyle, categoryDotStyle } from "@/lib/category-colors";
import { formatRelative } from "@/lib/utils";
import type { Metadata } from "next";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ k?: string; new?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const poll = await getPollBySlug(slug);
  if (!poll) return { title: "Poll not found" };
  return {
    title: poll.title,
    description: poll.description ?? "Cast your vote on GlobiQall.",
    openGraph: {
      title: poll.title,
      description: poll.description ?? "Cast your vote on GlobiQall.",
    },
  };
}

export default async function PollDetailPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { k, new: isNew } = await searchParams;
  const poll = await getPollBySlug(slug);
  if (!poll) notFound();

  const session = await auth();

  if (poll.visibility === "PRIVATE" && poll.shareCode !== k) {
    if (poll.authorId !== session?.user?.id) {
      return <PrivateGate />;
    }
  }

  const userVote = await getUserVote(poll.id, session?.user?.id);

  const closed =
    Boolean(poll.resolvedAt) ||
    (poll.closesAt ? poll.closesAt < new Date() : false);

  const predictionState = computePredictionState(poll);
  const isPrediction = poll.mode === "PREDICTION";
  const isAuthor = poll.authorId === session?.user?.id;
  const canResolve =
    isPrediction && predictionState === "LOCKED" && isAuthor && session?.user?.id;
  const resolvedWinner =
    poll.resolvedOptionId
      ? poll.options.find((o) => o.id === poll.resolvedOptionId)
      : null;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const shareUrl =
    poll.visibility === "PRIVATE" && poll.shareCode
      ? `${baseUrl}/p/${poll.slug}?k=${poll.shareCode}`
      : `${baseUrl}/p/${poll.slug}`;

  const relatedPromise = db.poll.findMany({
    where: {
      id: { not: poll.id },
      visibility: "PUBLIC",
      categoryId: poll.categoryId,
    },
    orderBy: { createdAt: "desc" },
    take: 4,
    select: { id: true, slug: true, title: true, totalVotes: true },
  });

  return (
    <div className="container max-w-3xl py-10 sm:py-14">
      {/* Top meta strip */}
      <div className="flex items-center justify-between hairline-b pb-3 mb-6 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={`/c/${poll.category.slug}`}
            className="inline-flex items-center gap-2 hover:text-foreground"
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={categoryDotStyle(poll.category.color)}
            />
            {poll.category.name}
          </Link>
          {poll.arena && (
            <Link
              href={`/arena/${poll.arena.slug}`}
              className="inline-flex items-center gap-1 text-foreground hover:text-accent"
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={categoryDotStyle(poll.arena.color)}
              />
              {poll.arena.emoji ? `${poll.arena.emoji} ` : ""}
              {poll.arena.title}
            </Link>
          )}
          {isPrediction && (
            <span className="text-accent inline-flex items-center gap-1">
              <Target className="h-3 w-3" />
              {predictionStateLabel(predictionState)}
            </span>
          )}
          {!isPrediction && poll.type === "BINARY" && <span>· versus</span>}
          {poll.visibility !== "PUBLIC" && (
            <span className="text-warning inline-flex items-center gap-1">
              <Lock className="h-3 w-3" />
              {poll.visibility === "PRIVATE" ? "private" : "unlisted"}
            </span>
          )}
          {isNew && <span className="text-positive">· just opened</span>}
        </div>
        <span className="tabular-nums">{formatRelative(poll.createdAt)}</span>
      </div>

      <h1 className="font-sans text-[28px] sm:text-[40px] leading-[1.05] tracking-tightest font-medium text-balance">
        {poll.title}
      </h1>
      {poll.description && (
        <p className="mt-4 text-[16px] leading-relaxed text-muted-foreground text-pretty max-w-prose">
          {poll.description}
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <Avatar className="h-5 w-5">
            {poll.author.image && (
              <AvatarImage src={poll.author.image} alt={poll.author.name ?? ""} />
            )}
            <AvatarFallback className="text-[9px]">
              {(poll.author.name ?? "G")[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-foreground/80 tracking-tight-2">
            {poll.author.username
              ? `@${poll.author.username}`
              : poll.author.name ?? "globiqall"}
          </span>
        </span>
        <span className="inline-flex items-center gap-1.5 font-mono uppercase tracking-[0.08em] text-[11px]">
          <Calendar className="h-3 w-3" />
          {formatRelative(poll.createdAt)}
        </span>
        {!isPrediction && poll.closesAt && (
          <span className="inline-flex items-center gap-1.5 font-mono uppercase tracking-[0.08em] text-[11px]">
            <Globe2 className="h-3 w-3" />
            closes {formatRelative(poll.closesAt)}
          </span>
        )}
        {isPrediction && poll.lockAt && (
          <span className="inline-flex items-center gap-1.5 font-mono uppercase tracking-[0.08em] text-[11px]">
            <Lock className="h-3 w-3" />
            {predictionState === "OPEN" ? "locks" : "locked"}{" "}
            {formatRelative(poll.lockAt)}
          </span>
        )}
        {isPrediction && resolvedWinner && (
          <span className="inline-flex items-center gap-1.5 font-mono uppercase tracking-[0.08em] text-[11px] text-positive">
            <Target className="h-3 w-3" />
            result · {resolvedWinner.label}
          </span>
        )}
      </div>

      {/* Accent strip + vote panel */}
      <div className="mt-8 rounded-md border border-border bg-card overflow-hidden">
        <div
          className="h-[3px] w-full"
          style={categoryAccentStyle(poll.category.color)}
          aria-hidden
        />
        <div className="p-5 sm:p-7">
          <PollVote
            pollId={poll.id}
            type={poll.type}
            mode={poll.mode}
            options={poll.options.map((o) => ({
              id: o.id,
              label: o.label,
              emoji: o.emoji,
              position: o.position,
              voteCount: o.voteCount,
            }))}
            initialTotalVotes={poll.totalVotes}
            initialUserOptionId={userVote?.optionId ?? null}
            initialConviction={userVote?.conviction ?? 1}
            isSignedIn={Boolean(session?.user?.id)}
            closed={closed}
            shareUrl={shareUrl}
            shareCode={poll.visibility === "PRIVATE" ? (k ?? null) : null}
            predictionState={predictionState === "NOT_PREDICTION" ? undefined : predictionState}
            lockAt={poll.lockAt ? poll.lockAt.toISOString() : null}
            resolvedOptionId={poll.resolvedOptionId ?? null}
            userCorrect={userVote?.correct ?? null}
            userRepAwarded={userVote?.repAwarded ?? null}
            userTrophyTier={
              userVote?.correct && typeof userVote.repAwarded === "number"
                ? trophyTierForRep(userVote.repAwarded).name
                : null
            }
            slug={poll.slug}
            viewerUsername={(session?.user as { username?: string } | undefined)?.username ?? null}
          />
        </div>
      </div>

      {/* Resolution source (after resolved) */}
      {isPrediction && poll.resolvedAt && poll.resolutionSource && (
        <div className="mt-4 flex items-start gap-2 rounded-md border border-border bg-card px-4 py-3 text-[13px]">
          <ExternalLink className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              Resolved via
            </span>
            <a
              href={poll.resolutionSource}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="block truncate text-accent hover:underline underline-offset-4"
            >
              {poll.resolutionSource}
            </a>
            {poll.resolutionNote && (
              <p className="text-muted-foreground mt-1">{poll.resolutionNote}</p>
            )}
          </div>
        </div>
      )}

      {/* Author resolve panel */}
      {canResolve && (
        <PredictionResolvePanel
          pollId={poll.id}
          options={poll.options.map((o) => ({
            id: o.id,
            label: o.label,
            emoji: o.emoji,
          }))}
        />
      )}

      <PollCountryBreakdown pollId={poll.id} />

      <PollComments
        pollId={poll.id}
        shareCode={poll.visibility === "PRIVATE" ? (k ?? null) : null}
      />

      <Related promise={relatedPromise} />
    </div>
  );
}

async function Related({
  promise,
}: {
  promise: Promise<{ id: string; slug: string; title: string; totalVotes: number }[]>;
}) {
  const related = await promise;
  if (related.length === 0) return null;
  return (
    <div className="mt-12">
      <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground hairline-b pb-2 mb-3">
        More in this category
      </h2>
      <ul className="grid gap-px bg-border rounded-md overflow-hidden border border-border">
        {related.map((r) => (
          <li key={r.id} className="bg-card">
            <Link
              href={`/p/${r.slug}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-secondary/50 transition-colors"
            >
              <span className="font-medium truncate pr-3 text-[14px] tracking-tight-2">
                {r.title}
              </span>
              <span className="font-mono text-[11px] tabular-nums uppercase tracking-[0.08em] text-muted-foreground shrink-0">
                {r.totalVotes} votes
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PrivateGate() {
  return (
    <div className="container max-w-md py-20 text-center">
      <div className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-md border border-border">
        <Lock className="h-5 w-5" />
      </div>
      <h1 className="text-[24px] font-medium tracking-tight-2">Private poll</h1>
      <p className="mt-2 text-muted-foreground text-[14px]">
        You need an invite link to view and vote on this poll.
      </p>
      <Link
        href="/"
        className="inline-block mt-6 text-sm underline decoration-accent underline-offset-4"
      >
        ← Back to trending
      </Link>
    </div>
  );
}
