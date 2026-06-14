import Link from "next/link";
import { db } from "@/lib/db";
import { categoryDotStyle } from "@/lib/category-colors";
import { formatCount, formatRelative } from "@/lib/utils";

export const revalidate = 60;
export const metadata = { title: "Leaderboard" };

export default async function LeaderboardPage() {
  const topPolls = await db.poll.findMany({
    where: { visibility: "PUBLIC" },
    orderBy: { totalVotes: "desc" },
    take: 25,
    include: {
      category: { select: { name: true, color: true, slug: true } },
      author: { select: { name: true, username: true } },
    },
  });

  return (
    <div className="container max-w-3xl pt-10 pb-20">
      <header className="hairline-b pb-6 mb-2">
        <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-2">
          Leaderboard · Most voted
        </div>
        <h1 className="text-[32px] sm:text-[40px] leading-[1.05] font-medium tracking-tightest">
          What the world is voting on most.
        </h1>
        <p className="text-muted-foreground mt-2 text-[14px] max-w-prose">
          Ranked by total votes across all time. Updates every minute.
        </p>
      </header>

      {topPolls.length === 0 ? (
        <p className="text-center text-muted-foreground py-10 text-[14px]">
          No polls have votes yet. Be the first to ask the world a question.
        </p>
      ) : (
        <ol>
          {/* Table header */}
          <li className="hairline-b py-2 grid grid-cols-[28px_1fr_auto] gap-3 items-center font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            <span>#</span>
            <span>Poll</span>
            <span className="text-right">Votes</span>
          </li>
          {topPolls.map((p, i) => (
            <li
              key={p.id}
              className="hairline-b last:border-b-0 group"
            >
              <Link
                href={`/p/${p.slug}`}
                className="grid grid-cols-[28px_1fr_auto] gap-3 items-center py-3.5 hover:bg-secondary/40 -mx-2 px-2 rounded-sm transition-colors"
              >
                <span className="font-mono text-[13px] tabular-nums text-muted-foreground group-hover:text-foreground transition-colors">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <div className="font-medium tracking-tight-2 truncate text-[14px]">
                    {p.title}
                  </div>
                  <div className="mt-1 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                    {p.category && (
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={categoryDotStyle(p.category.color)}
                        />
                        {p.category.name}
                      </span>
                    )}
                    <span>·</span>
                    <span>{formatRelative(p.createdAt)}</span>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <div className="text-[16px] tabular-nums font-medium tracking-tight-2">
                    {formatCount(p.totalVotes)}
                  </div>
                  <div className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground mt-0.5">
                    votes
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
