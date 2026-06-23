import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { PollVote } from "@/components/poll-vote";
import { DailyShare } from "@/components/daily-share";
import { getTodaysDaily } from "@/lib/daily";
import { getUserVote } from "@/lib/polls";
import { computePredictionState } from "@/lib/predictions";
import { categoryAccentStyle, categoryDotStyle } from "@/lib/category-colors";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "The Daily Call",
  description: "One global prediction. Every day. Keep your streak alive.",
};

export default async function DailyPage() {
  const [session, poll] = await Promise.all([auth(), getTodaysDaily()]);
  const dateLabel = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });

  const me = session?.user?.id
    ? await db.user.findUnique({
        where: { id: session.user.id },
        select: { dailyStreak: true, username: true, streakFreezes: true },
      })
    : null;

  return (
    <div className="container max-w-2xl py-12 sm:py-16">
      <div className="text-center mb-8">
        <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-accent mb-2 inline-flex items-center gap-2">
          <CalendarDays className="h-3 w-3" />
          The Daily Call · {dateLabel}
        </div>
        <h1 className="text-[30px] sm:text-[40px] leading-[1.05] font-medium tracking-tightest">
          One call. Every day.
        </h1>
        <p className="text-muted-foreground mt-2 text-[14px]">
          Everyone gets the same prediction. Make your call, keep your streak,
          come back tomorrow.
        </p>
      </div>

      {!poll ? (
        <div className="rounded-md border border-dashed border-border p-10 text-center">
          <h3 className="text-[15px] font-medium">No Daily Call yet today.</h3>
          <p className="text-[13px] text-muted-foreground mt-1">
            Check back soon, a fresh one drops every day.
          </p>
          <Button asChild className="mt-4" variant="accent">
            <Link href="/predictions">Browse predictions</Link>
          </Button>
        </div>
      ) : (
        <DailyBody poll={poll} session={session} me={me} dateLabel={dateLabel} />
      )}
    </div>
  );
}

async function DailyBody({
  poll,
  session,
  me,
  dateLabel,
}: {
  poll: NonNullable<Awaited<ReturnType<typeof getTodaysDaily>>>;
  session: { user?: { id?: string | null } } | null;
  me: { dailyStreak: number; username: string | null; streakFreezes: number } | null;
  dateLabel: string;
}) {
  const userVote = await getUserVote(poll.id, session?.user?.id ?? undefined);
  const predictionState = computePredictionState(poll);
  const played = Boolean(userVote);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const shareUrl = `${baseUrl}/daily`;

  return (
    <div className="space-y-5">
      <DailyShare
        dateLabel={dateLabel}
        streak={me?.dailyStreak ?? 0}
        freezes={me?.streakFreezes ?? 0}
        played={played}
      />

      <div className="rounded-md border border-border bg-card overflow-hidden">
        <div
          className="h-[3px] w-full"
          style={categoryAccentStyle(poll.category.color)}
          aria-hidden
        />
        <div className="p-5 sm:p-7">
          <div className="mb-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full" style={categoryDotStyle(poll.category.color)} />
            {poll.category.name}
          </div>
          <h2 className="text-[20px] sm:text-[26px] leading-tight tracking-tight-2 font-medium text-balance mb-5">
            {poll.title}
          </h2>
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
            closed={false}
            shareUrl={shareUrl}
            predictionState={predictionState === "NOT_PREDICTION" ? undefined : predictionState}
            lockAt={poll.lockAt ? poll.lockAt.toISOString() : null}
            resolvedOptionId={poll.resolvedOptionId ?? null}
            userCorrect={userVote?.correct ?? null}
            userRepAwarded={userVote?.repAwarded ?? null}
            slug={poll.slug}
            viewerUsername={me?.username ?? null}
          />
        </div>
      </div>

      <p className="text-center font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
        <Link href={`/p/${poll.slug}`} className="hover:text-foreground">
          open full prediction →
        </Link>
      </p>
    </div>
  );
}
