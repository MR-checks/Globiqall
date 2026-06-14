import Link from "next/link";
import { Suspense } from "react";
import { ArrowUpRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryPills } from "@/components/category-pills";
import { DropsStrip } from "@/components/drops-strip";
import { PollCard } from "@/components/poll-card";
import { listTrendingPolls } from "@/lib/trending";
import { db } from "@/lib/db";
import { categoryAccentStyle, categoryDotStyle } from "@/lib/category-colors";
import { formatCount, formatRelative, pct } from "@/lib/utils";

export const revalidate = 30;

export default async function HomePage() {
  return (
    <div>
      <Hero />
      <Ticker />
      <Suspense>
        <DropsStrip />
      </Suspense>
      <section className="container pb-20 pt-10">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Suspense>
            <CategoryPills />
          </Suspense>
          <Link
            href="/explore"
            className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-[0.12em] text-muted-foreground hover:text-foreground"
          >
            All polls <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="hairline-b pb-3 mb-5 flex items-baseline justify-between">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            Trending · Last 24h
          </h2>
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            updated live
          </span>
        </div>

        <Suspense fallback={<FeedSkeleton />}>
          <Feed />
        </Suspense>
      </section>
    </div>
  );
}

async function Hero() {
  const [headlinePoll, stats] = await Promise.all([
    db.poll.findFirst({
      where: { visibility: "PUBLIC" },
      orderBy: [{ totalVotes: "desc" }, { createdAt: "desc" }],
      include: {
        category: true,
        options: { orderBy: { position: "asc" } },
      },
    }),
    db.$transaction([
      db.poll.count({ where: { visibility: "PUBLIC" } }),
      db.vote.count(),
      db.user.count(),
    ]),
  ]);
  const [polls, votes, users] = stats;

  const sortedOptions = headlinePoll
    ? [...headlinePoll.options].sort((a, b) => b.voteCount - a.voteCount)
    : [];
  const lead = sortedOptions[0];
  const runner = sortedOptions[1];
  const total = headlinePoll?.totalVotes ?? 0;
  const leadPct = lead ? pct(lead.voteCount, total) : 0;

  return (
    <section className="hairline-b">
      <div className="container py-10 sm:py-14">
        {/* Global ticker label */}
        <div className="flex items-center justify-between mb-8">
          <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            <span>Globiqall · Signal · Now</span>
          </div>
          <div className="hidden sm:flex items-center gap-6 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            <Stat label="polls" value={formatCount(polls)} />
            <Stat label="votes" value={formatCount(votes)} />
            <Stat label="voters" value={formatCount(users)} />
          </div>
        </div>

        {/* Main headline */}
        <h1 className="font-sans text-[36px] sm:text-[56px] leading-[1.02] tracking-tightest font-medium text-balance max-w-4xl">
          The world is voting.{" "}
          <span className="text-muted-foreground">
            Where do you stand?
          </span>
        </h1>

        {/* Featured headline poll */}
        {headlinePoll && lead && (
          <Link
            href={`/p/${headlinePoll.slug}`}
            className="group mt-10 sm:mt-14 block rounded-md border border-border bg-card hover:border-foreground/40 transition-colors overflow-hidden"
          >
            <div
              className="h-[3px] w-full"
              style={categoryAccentStyle(headlinePoll.category.color)}
              aria-hidden
            />
            <div className="p-5 sm:p-7">
              <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground mb-6">
                <span className="inline-flex items-center gap-2">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={categoryDotStyle(headlinePoll.category.color)}
                  />
                  Headline · {headlinePoll.category.name}
                </span>
                <span>{formatRelative(headlinePoll.createdAt)}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-end gap-6 sm:gap-10">
                <div className="font-mono tabular-nums leading-none shrink-0">
                  <div className="flex items-baseline">
                    <span className="text-[72px] sm:text-[96px] font-medium tracking-tightest">
                      {leadPct.toFixed(1)}
                    </span>
                    <span className="text-[32px] text-muted-foreground ml-1">%</span>
                  </div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground mt-2">
                    {lead.label} · leading
                  </div>
                </div>

                <div className="min-w-0 flex-1 pb-1">
                  <h2 className="text-[20px] sm:text-[24px] leading-tight tracking-tight-2 font-medium text-balance">
                    {headlinePoll.title}
                  </h2>
                  <div className="mt-4 grid gap-2">
                    {sortedOptions.slice(0, 3).map((o) => {
                      const p = pct(o.voteCount, total);
                      return (
                        <div key={o.id} className="font-mono text-[12px]">
                          <div className="flex items-center justify-between mb-1">
                            <span className="truncate normal-case tracking-tight-2 text-foreground/90 font-sans">
                              {o.label}
                            </span>
                            <span className="tabular-nums shrink-0 ml-2">
                              {p.toFixed(1)}%
                            </span>
                          </div>
                          <div className="h-px w-full bg-border relative overflow-hidden">
                            <div
                              className="absolute inset-y-0 left-0 bg-foreground transition-[width] duration-700"
                              style={{ width: `${p}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-5 flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.12em] text-muted-foreground">
                    <span className="tabular-nums">
                      {formatCount(total)} {total === 1 ? "vote" : "votes"}
                      {runner && total > 0 ? (
                        <>
                          {" "}· margin {(leadPct - pct(runner.voteCount, total)).toFixed(1)}pt
                        </>
                      ) : null}
                    </span>
                    <span className="inline-flex items-center gap-1 text-accent">
                      cast your vote
                      <ArrowUpRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* CTAs */}
        <div className="mt-8 flex flex-wrap items-center gap-2">
          <Button asChild variant="accent" size="lg">
            <Link href="/new">
              <Plus /> Open a poll
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/explore">Explore signals</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-foreground font-medium tabular-nums">{value}</span>
      <span>{label}</span>
    </div>
  );
}

async function Ticker() {
  const recent = await db.poll.findMany({
    where: { visibility: "PUBLIC" },
    orderBy: { createdAt: "desc" },
    take: 16,
    select: { id: true, slug: true, title: true, totalVotes: true },
  });
  if (recent.length === 0) return null;
  // Duplicate for seamless loop
  const stream = [...recent, ...recent];
  return (
    <div className="hairline-b overflow-hidden">
      <div className="container relative">
        <div className="flex items-center gap-3 py-2.5 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
          <span className="text-accent shrink-0 inline-flex items-center gap-1.5">
            <span className="h-1 w-1 rounded-full bg-accent animate-blink" />
            Live
          </span>
          <div className="ticker-mask overflow-hidden flex-1">
            <div className="flex gap-8 whitespace-nowrap animate-marquee w-max">
              {stream.map((p, i) => (
                <Link
                  key={`${p.id}-${i}`}
                  href={`/p/${p.slug}`}
                  className="inline-flex items-center gap-2 hover:text-foreground"
                >
                  <span className="text-foreground/80 normal-case tracking-tight-2 font-sans">
                    {p.title}
                  </span>
                  <span className="tabular-nums text-accent">
                    {formatCount(p.totalVotes)}
                  </span>
                  <span className="text-muted-foreground/40">·</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

async function Feed() {
  const polls = await listTrendingPolls(12);
  if (polls.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border p-10 text-center">
        <h3 className="text-[15px] font-medium">No polls yet — be the first.</h3>
        <p className="text-[13px] text-muted-foreground mt-1">
          Open a poll. Watch the planet respond.
        </p>
        <Button asChild className="mt-4" variant="accent">
          <Link href="/new">
            <Plus /> Open a poll
          </Link>
        </Button>
      </div>
    );
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {polls.map((p) => (
        <PollCard
          key={p.id}
          poll={{
            ...p,
            rising: p.rising,
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
  );
}

function FeedSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-48 rounded-md border border-border bg-card"
        />
      ))}
    </div>
  );
}
