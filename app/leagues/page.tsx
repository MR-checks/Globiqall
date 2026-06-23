import Link from "next/link";
import { Trophy } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  LEAGUE_TIERS,
  currentWeekKey,
  effectiveWeeklyPoints,
  nextTier,
  tierForPoints,
  weeklyLeaderboard,
} from "@/lib/leagues";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Leagues",
  description: "Earn points every week. Climb Bronze to Diamond. Resets every Monday.",
};

const TONE: Record<string, string> = {
  default: "text-foreground/80",
  warning: "text-warning",
  accent: "text-accent",
  positive: "text-positive",
};

export default async function LeaguesPage() {
  const [session, board] = await Promise.all([auth(), weeklyLeaderboard(50)]);

  const me = session?.user?.id
    ? await db.user.findUnique({
        where: { id: session.user.id },
        select: { username: true, weeklyPoints: true, weekKey: true },
      })
    : null;
  const myPoints = me ? effectiveWeeklyPoints(me) : 0;
  const myTier = tierForPoints(myPoints);
  const up = nextTier(myPoints);

  return (
    <div className="container max-w-3xl pt-10 pb-20">
      <header className="hairline-b pb-6 mb-7">
        <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-accent mb-2 inline-flex items-center gap-2">
          <Trophy className="h-3 w-3" />
          Leagues · {currentWeekKey()}
        </div>
        <h1 className="text-[32px] sm:text-[44px] leading-[1.05] font-medium tracking-tightest">
          Climb the week.
        </h1>
        <p className="text-muted-foreground mt-2 text-[14px] max-w-prose">
          Every point you earn, voting, opening polls, and especially nailing
          predictions, counts toward this week's league. Reach the next tier
          before the week resets.
        </p>
      </header>

      {/* Your standing */}
      {me && (
        <section className="mb-8 rounded-md border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground mb-1">
                Your league this week
              </div>
              <div className={`text-[26px] font-medium tracking-tight-2 ${TONE[myTier.tone]}`}>
                {myTier.name}
              </div>
            </div>
            <div className="text-right font-mono">
              <div className="text-[28px] tabular-nums font-medium tracking-tight-2">{myPoints}</div>
              <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">points</div>
            </div>
          </div>
          {up && (
            <div className="mt-4">
              <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground mb-1.5">
                <span>{myTier.name}</span>
                <span>
                  {Math.max(0, up.min - myPoints)} to {up.name}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full bg-accent transition-[width]"
                  style={{
                    width: `${Math.min(100, Math.round((myPoints / up.min) * 100))}%`,
                  }}
                />
              </div>
            </div>
          )}
        </section>
      )}

      {/* Tier ladder */}
      <section className="mb-8">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground hairline-b pb-2 mb-3">
          Tiers
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {LEAGUE_TIERS.map((t) => (
            <div
              key={t.key}
              className="rounded-md border border-border bg-card p-3 text-center"
            >
              <div className={`text-[14px] font-medium tracking-tight-2 ${TONE[t.tone]}`}>
                {t.name}
              </div>
              <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground mt-1">
                {t.min}+ pts
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Weekly table */}
      <section>
        <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground hairline-b pb-2 mb-3">
          This week's table
        </h2>
        {board.length === 0 ? (
          <p className="text-center text-[13px] text-muted-foreground py-8">
            No points earned this week yet. Be the first to climb.
          </p>
        ) : (
          <ol className="rounded-md border border-border bg-card overflow-hidden divide-y divide-border">
            {board.map((e, i) => {
              const isMe = me?.username && e.username === me.username;
              return (
                <li
                  key={i}
                  className={`flex items-center gap-3 px-3 py-2.5 ${isMe ? "bg-accent/5" : ""}`}
                >
                  <span className="font-mono text-[12px] tabular-nums text-muted-foreground w-6">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <Avatar className="h-7 w-7 border border-border">
                    {e.image && <AvatarImage src={e.image} alt="" />}
                    <AvatarFallback className="text-[10px]">
                      {(e.name?.[0] ?? e.username?.[0] ?? "?").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 flex-1 text-[13px] tracking-tight-2 truncate">
                    {e.username ? (
                      <Link href={`/u/${e.username}`} className="hover:underline decoration-accent underline-offset-4">
                        @{e.username}
                      </Link>
                    ) : (
                      e.name ?? "anon"
                    )}
                  </span>
                  <Badge
                    variant={
                      e.tier.tone === "accent"
                        ? "accent"
                        : e.tier.tone === "positive"
                          ? "positive"
                          : e.tier.tone === "warning"
                            ? "warning"
                            : "secondary"
                    }
                  >
                    {e.tier.name}
                  </Badge>
                  <span className="font-mono tabular-nums text-[14px] font-medium w-12 text-right">
                    {e.points}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </div>
  );
}
