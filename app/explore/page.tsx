import Link from "next/link";
import { Search } from "lucide-react";
import { db } from "@/lib/db";
import { listFeaturedPolls, searchPolls } from "@/lib/polls";
import { CategoryPills } from "@/components/category-pills";
import { PollCard } from "@/components/poll-card";
import { Input } from "@/components/ui/input";
import { categoryDotStyle } from "@/lib/category-colors";

type SearchParams = Promise<{ q?: string }>;

export const metadata = { title: "Explore" };

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  const polls = query ? await searchPolls(query, 60) : await listFeaturedPolls(60);

  const categories = await db.category.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { polls: true } } },
  });

  return (
    <div className="container pt-8 pb-20">
      <div className="mb-7">
        <CategoryPills />
      </div>

      <header className="mb-8">
        <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-2">
          Explore
        </div>
        <h1 className="text-[32px] sm:text-[44px] leading-[1.02] font-medium tracking-tightest">
          Find a signal worth your vote.
        </h1>
        <form method="GET" action="/explore" className="mt-6 relative max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={query}
            placeholder="Search polls, AI, election, GOAT, climate…"
            className="pl-9 h-11 text-[14px] bg-card"
          />
        </form>
      </header>

      {!query && (
        <section className="mb-12">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground hairline-b pb-2 mb-4">
            Categories
          </h2>
          <div className="grid gap-px bg-border rounded-md overflow-hidden border border-border sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/c/${c.slug}`}
                className="flex items-center justify-between bg-card px-4 py-3.5 hover:bg-secondary/50 transition-colors"
              >
                <span className="inline-flex items-center gap-3 min-w-0">
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={categoryDotStyle(c.color)}
                  />
                  <span className="font-medium tracking-tight-2 truncate">{c.name}</span>
                </span>
                <span className="font-mono text-[11px] tabular-nums uppercase tracking-[0.08em] text-muted-foreground shrink-0 ml-3">
                  {c._count.polls}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground hairline-b pb-2 mb-4">
          {query ? `Results · ${query}` : "Featured"}
        </h2>
        {polls.length === 0 ? (
          <div className="rounded-md border border-dashed border-border p-10 text-center">
            <h3 className="text-[15px] font-medium">No matches.</h3>
            <p className="text-[13px] text-muted-foreground mt-1">
              Try another keyword or browse a category above.
            </p>
          </div>
        ) : (
          <div className="grid gap-x-3 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
            {polls.map((p) => (
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
