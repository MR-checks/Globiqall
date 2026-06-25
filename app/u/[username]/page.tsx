import Link from "next/link";
import { notFound } from "next/navigation";
import { Settings } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { avatarUrl } from "@/lib/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PollCard } from "@/components/poll-card";
import { deriveBadges } from "@/lib/reputation";
import { predictionAccuracy } from "@/lib/predictions";
import { computeAlignment } from "@/lib/tribes";
import { computeTrophyCase } from "@/lib/trophies";
import { effectiveWeeklyPoints, tierForPoints } from "@/lib/leagues";
import { TribeCard } from "@/components/tribe-card";
import { formatCount, formatRelative } from "@/lib/utils";
import type { Metadata } from "next";

type PageProps = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const user = await db.user.findUnique({ where: { username: username.toLowerCase() } });
  if (!user) return { title: "Profile" };
  return {
    title: user.name ? `${user.name} (@${user.username})` : `@${user.username}`,
    description: user.bio ?? undefined,
  };
}

export default async function ProfilePage({ params }: PageProps) {
  const { username } = await params;
  const session = await auth();
  const user = await db.user.findUnique({
    where: { username: username.toLowerCase() },
    select: {
      id: true,
      name: true,
      username: true,
      image: true,
      bio: true,
      country: true,
      reputation: true,
      streakDays: true,
      lastVoteOn: true,
      predictionsResolved: true,
      predictionsCorrect: true,
      predictionStreak: true,
      bestPredictionStreak: true,
      weeklyPoints: true,
      weekKey: true,
      createdAt: true,
    },
  });
  if (!user) notFound();

  const isMe = session?.user?.id === user.id;

  const [pollsCount, votesCount, commentsCount, topPoll, recentPolls] =
    await Promise.all([
      db.poll.count({ where: { authorId: user.id } }),
      db.vote.count({ where: { userId: user.id } }),
      db.comment.count({ where: { authorId: user.id, deletedAt: null } }),
      db.poll.findFirst({
        where: { authorId: user.id, visibility: "PUBLIC" },
        orderBy: { totalVotes: "desc" },
        select: { totalVotes: true },
      }),
      db.poll.findMany({
        where: { authorId: user.id, visibility: "PUBLIC" },
        orderBy: { createdAt: "desc" },
        take: 9,
        include: {
          category: { select: { name: true, slug: true, color: true } },
          author: { select: { name: true, username: true, image: true } },
          options: { orderBy: { position: "asc" } },
        },
      }),
    ]);

  const [alignment, trophyCase] = await Promise.all([
    computeAlignment(user.id),
    computeTrophyCase(user.id),
  ]);
  // Persist nemesis so the resolution/notification loop can reference it.
  if (alignment?.nemesisUserId) {
    db.user
      .update({ where: { id: user.id }, data: { nemesisId: alignment.nemesisUserId } })
      .catch(() => {});
  }
  const weekPoints = effectiveWeeklyPoints(user);
  const leagueTier = tierForPoints(weekPoints);

  const accountAgeDays = Math.max(
    0,
    Math.floor((Date.now() - user.createdAt.getTime()) / 86_400_000),
  );

  const badges = deriveBadges({
    pollsCount,
    votesCount,
    commentsCount,
    streakDays: user.streakDays,
    accountAgeDays,
    topPollVotes: topPoll?.totalVotes ?? 0,
    predictionsResolved: user.predictionsResolved,
    predictionsCorrect: user.predictionsCorrect,
    bestPredictionStreak: user.bestPredictionStreak,
  });

  const initial = (user.name?.[0] ?? user.username?.[0] ?? "?").toUpperCase();

  return (
    <div className="container max-w-4xl pt-10 pb-20">
      {/* Header */}
      <header className="hairline-b pb-8 mb-8">
        <div className="flex items-start gap-5">
          <Avatar className="h-20 w-20 border border-border">
            <AvatarImage src={avatarUrl({ image: user.image, seed: user.username ?? user.name })} alt={user.name ?? ""} />
            <AvatarFallback className="text-xl">{initial}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-1">
              Profile · @{user.username}
            </div>
            <h1 className="text-[28px] sm:text-[36px] leading-[1.05] font-medium tracking-tightest text-balance">
              {user.name ?? `@${user.username}`}
            </h1>
            {user.bio && (
              <p className="mt-2 text-[14px] text-muted-foreground leading-relaxed max-w-prose text-pretty">
                {user.bio}
              </p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge
                variant={
                  leagueTier.tone === "accent"
                    ? "accent"
                    : leagueTier.tone === "positive"
                      ? "positive"
                      : leagueTier.tone === "warning"
                        ? "warning"
                        : "secondary"
                }
                title={`${weekPoints} points this week`}
              >
                {leagueTier.name} league
              </Badge>
              {trophyCase.rarest && (
                <Badge variant="secondary" title="Rarest trophy earned">
                  {trophyCase.total} {trophyCase.total === 1 ? "trophy" : "trophies"}
                </Badge>
              )}
              <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                joined {formatRelative(user.createdAt)}
              </span>
            </div>
          </div>
          {isMe && (
            <Button asChild variant="outline" size="sm">
              <Link href="/settings/profile">
                <Settings /> Edit
              </Link>
            </Button>
          )}
        </div>
      </header>

      {/* Stats */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-px rounded-md overflow-hidden border border-border bg-border mb-8">
        <Stat label="Reputation" value={formatCount(user.reputation)} accent />
        <Stat label="Streak" value={`${user.streakDays}d`} positive={user.streakDays >= 7} />
        <Stat label="Polls" value={formatCount(pollsCount)} />
        <Stat label="Votes cast" value={formatCount(votesCount)} />
      </section>

      {/* Prediction track record */}
      {user.predictionsResolved > 0 && (
        <section className="mb-10">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground hairline-b pb-2 mb-4">
            Prediction track record
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px rounded-md overflow-hidden border border-border bg-border">
            <Stat
              label="Accuracy"
              value={`${predictionAccuracy(user.predictionsCorrect, user.predictionsResolved)}%`}
              accent
            />
            <Stat
              label="Correct calls"
              value={`${user.predictionsCorrect}/${user.predictionsResolved}`}
            />
            <Stat
              label="Streak"
              value={`${user.predictionStreak}`}
              positive={user.predictionStreak >= 3}
            />
            <Stat label="Best streak" value={`${user.bestPredictionStreak}`} />
          </div>
        </section>
      )}

      {/* Trophy case */}
      {trophyCase.total > 0 && (
        <section className="mb-10">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground hairline-b pb-2 mb-4 flex items-center justify-between">
            <span>Trophy case</span>
            <span className="tabular-nums">{trophyCase.total} total</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {trophyCase.byTier.map((t) => (
              <div
                key={t.key}
                className="rounded-md border border-border bg-card p-3 text-center"
              >
                <div
                  className={`font-mono tabular-nums text-[22px] font-medium tracking-tight-2 ${
                    t.tone === "accent"
                      ? "text-accent"
                      : t.tone === "positive"
                        ? "text-positive"
                        : t.tone === "warning"
                          ? "text-warning"
                          : "text-foreground"
                  }`}
                >
                  {t.count}×
                </div>
                <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground mt-1">
                  {t.name}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
            rarity scales with how hard the call was to make
          </p>
        </section>
      )}

      {/* Tribe & alignment */}
      {alignment && <TribeCard alignment={alignment} isMe={isMe} />}

      {/* Badges */}
      {badges.length > 0 && (
        <section className="mb-10">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground hairline-b pb-2 mb-3">
            Badges
          </h2>
          <div className="flex flex-wrap gap-2">
            {badges.map((b) => (
              <Badge
                key={b.slug}
                variant={
                  b.tone === "accent"
                    ? "accent"
                    : b.tone === "positive"
                      ? "positive"
                      : b.tone === "warning"
                        ? "warning"
                        : "secondary"
                }
                title={b.hint}
              >
                {b.label}
              </Badge>
            ))}
          </div>
        </section>
      )}

      {/* Polls */}
      <section>
        <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground hairline-b pb-2 mb-4 flex items-center justify-between">
          <span>Polls opened</span>
          <span className="tabular-nums">{pollsCount}</span>
        </h2>
        {recentPolls.length === 0 ? (
          <p className="text-center text-[13px] text-muted-foreground py-8">
            No polls yet.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recentPolls.map((p) => (
              <PollCard
                key={p.id}
                poll={{
                  ...p,
                  options: p.options.map((o) => ({
                    id: o.id,
                    label: o.label,
                    emoji: o.emoji,
                    voteCount: o.voteCount,
                  })),
                }}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
  positive,
}: {
  label: string;
  value: string;
  accent?: boolean;
  positive?: boolean;
}) {
  return (
    <div className="bg-card p-4">
      <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </div>
      <div
        className={`font-mono tabular-nums text-[28px] tracking-tight-2 mt-1 font-medium ${
          accent ? "text-accent" : positive ? "text-positive" : "text-foreground"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
