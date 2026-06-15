import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { listDrops, type DropSort } from "@/lib/drops/queries";
import { db } from "@/lib/db";
import { categoryDotStyle } from "@/lib/category-colors";
import { SortTabs } from "@/components/sort-tabs";
import { cn, formatRelative } from "@/lib/utils";

export const metadata = {
  title: "Drops · coming up",
  description: "Things about to drop — vote on them as they happen.",
};

export const revalidate = 300; // 5 min cache for the page

type PageProps = { searchParams: Promise<{ c?: string; sort?: string }> };

const DROP_SORTS: { value: DropSort; label: string }[] = [
  { value: "latest", label: "Latest" },
  { value: "top", label: "Top" },
  { value: "expiring", label: "Expiring" },
];

export default async function DropsPage({ searchParams }: PageProps) {
  const { c, sort: sortParam } = await searchParams;
  const category = c?.trim() || null;
  const sort: DropSort =
    sortParam === "top" || sortParam === "expiring" ? sortParam : "latest";

  const [drops, allCats] = await Promise.all([
    listDrops({ category, limit: 60, sort }),
    db.category.findMany({ orderBy: { order: "asc" } }),
  ]);

  const sortItems = DROP_SORTS.map((s) => {
    const p = new URLSearchParams();
    if (category) p.set("c", category);
    if (s.value !== "latest") p.set("sort", s.value);
    const qs = p.toString();
    return { label: s.label, href: qs ? `/drops?${qs}` : "/drops", active: sort === s.value };
  });

  // Count per category for the filter chips (just over the active set)
  const counts = await db.drop.groupBy({
    by: ["category"],
    where: { expiresAt: { gt: new Date() } },
    _count: { _all: true },
  });
  const countMap = new Map<string | null, number>();
  for (const r of counts) countMap.set(r.category, r._count._all);

  return (
    <div className="container pt-10 pb-20">
      <header className="hairline-b pb-6 mb-6">
        <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-2 inline-flex items-center gap-2">
          <Sparkles className="h-3 w-3 text-accent" />
          Drops
        </div>
        <h1 className="text-[32px] sm:text-[44px] leading-[1.05] font-medium tracking-tightest">
          What's about to happen.
        </h1>
        <p className="text-muted-foreground mt-2 text-[14px] max-w-prose">
          Live signals from the open web — product drops, launches, leaks,
          upcoming matches. Tap to open a poll about any of them.
        </p>
      </header>

      <CategoryFilter active={category} cats={allCats} counts={countMap} />

      <div className="mt-5 flex items-center justify-between gap-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
          {drops.length} {drops.length === 1 ? "drop" : "drops"}
        </span>
        <SortTabs items={sortItems} />
      </div>

      {drops.length === 0 ? (
        <p className="text-center text-[13px] text-muted-foreground py-12">
          No drops in this view right now. Check back soon.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mt-6">
          {drops.map((d) => (
            <li key={d.id}>
              <DropTile drop={d} />
            </li>
          ))}
        </ul>
      )}

      <p className="mt-10 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground text-center">
        sources · reddit · hacker news · product hunt · google news
      </p>
    </div>
  );
}

function CategoryFilter({
  active,
  cats,
  counts,
}: {
  active: string | null;
  cats: { id: string; slug: string; name: string; color: string }[];
  counts: Map<string | null, number>;
}) {
  const total = Array.from(counts.values()).reduce((a, b) => a + b, 0);
  const base =
    "inline-flex items-center gap-2 rounded-sm border px-2.5 py-1 text-xs tracking-tight-2 transition-colors whitespace-nowrap";
  const idle =
    "border-border bg-transparent text-muted-foreground hover:text-foreground hover:bg-secondary";
  const on = "border-foreground bg-foreground text-background";

  return (
    <div className="-mx-5 px-5 sm:mx-0 sm:px-0 overflow-x-auto scrollbar-none">
      <div className="flex items-center gap-1.5 min-w-max">
        <Link href="/drops" className={cn(base, !active ? on : idle)}>
          <span className="font-mono text-[10px] uppercase tracking-[0.08em]">All</span>
          <span className="font-mono tabular-nums text-[10px] opacity-70">{total}</span>
        </Link>
        {cats.map((c) => {
          const isActive = active === c.slug;
          const n = counts.get(c.slug) ?? 0;
          if (n === 0 && !isActive) return null;
          return (
            <Link
              key={c.id}
              href={`/drops?c=${c.slug}`}
              className={cn(base, isActive ? on : idle)}
            >
              <span
                className="h-1.5 w-1.5 rounded-full shrink-0"
                style={categoryDotStyle(c.color)}
                aria-hidden
              />
              {c.name}
              <span className="font-mono tabular-nums text-[10px] opacity-70">{n}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function DropTile({
  drop,
}: {
  drop: {
    id: string;
    title: string;
    source: string;
    sourceUrl: string;
    category: string | null;
    score: number;
    fetchedAt: Date;
  };
}) {
  const params = new URLSearchParams();
  params.set("title", drop.title);
  if (drop.category) params.set("category", drop.category);
  params.set("dropId", drop.id);

  return (
    <article className="flex flex-col rounded-md border border-border bg-card hover:border-foreground/40 transition-colors overflow-hidden">
      <div className="px-4 pt-3 pb-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5 min-w-0 truncate">
          {drop.category && (
            <span
              className="h-1.5 w-1.5 rounded-full shrink-0"
              style={categoryDotStyle(drop.category)}
              aria-hidden
            />
          )}
          <span className="truncate">{drop.source}</span>
        </span>
        <span className="shrink-0 ml-2 inline-flex items-center gap-2">
          <span className="text-accent tabular-nums">·{drop.score}</span>
          <span>{formatRelative(drop.fetchedAt)}</span>
        </span>
      </div>
      <a
        href={drop.sourceUrl}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="block px-4 pb-3 flex-1 hover:text-foreground"
        title={drop.title}
      >
        <p className="text-[14px] leading-snug tracking-tight-2 line-clamp-4 text-balance">
          {drop.title}
        </p>
      </a>
      <Link
        href={`/new?${params.toString()}`}
        className="border-t border-border px-4 py-2 inline-flex items-center justify-between gap-2 text-[11px] font-mono uppercase tracking-[0.12em] text-accent hover:bg-accent hover:text-accent-foreground transition-colors"
      >
        Open a poll <ArrowUpRight className="h-3 w-3" />
      </Link>
    </article>
  );
}
