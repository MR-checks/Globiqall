import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { listDrops } from "@/lib/drops/queries";
import { categoryDotStyle } from "@/lib/category-colors";
import { cn, formatRelative } from "@/lib/utils";

export async function DropsStrip() {
  const drops = await listDrops({ limit: 12 });
  if (drops.length === 0) return null;

  return (
    <section className="hairline-b">
      <div className="container py-6">
        <div className="flex items-baseline justify-between gap-4 mb-4">
          <div className="inline-flex items-baseline gap-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            <Sparkles className="h-3 w-3 text-accent" />
            <span>Drops · coming up</span>
            <span className="text-muted-foreground/60">·</span>
            <span className="tabular-nums">{drops.length}</span>
          </div>
          <Link
            href="/drops"
            className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground hover:text-foreground"
          >
            all drops <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="-mx-5 px-5 sm:mx-0 sm:px-0 overflow-x-auto scrollbar-none">
          <ul className="flex items-stretch gap-3 min-w-max">
            {drops.map((d) => (
              <li key={d.id} className="w-[260px] sm:w-[300px] shrink-0">
                <DropCard drop={d} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function DropCard({
  drop,
}: {
  drop: {
    id: string;
    title: string;
    source: string;
    sourceUrl: string;
    category: string | null;
    fetchedAt: Date;
  };
}) {
  // Build prefill URL for /new
  const params = new URLSearchParams();
  params.set("title", drop.title);
  if (drop.category) params.set("category", drop.category);
  params.set("dropId", drop.id);

  return (
    <article className="group h-full flex flex-col rounded-md border border-border bg-card hover:border-foreground/40 transition-colors overflow-hidden">
      <div className="px-3.5 pt-3 pb-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
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
        <span className="shrink-0 ml-2">{formatRelative(drop.fetchedAt)}</span>
      </div>

      <a
        href={drop.sourceUrl}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="block px-3.5 pb-3 flex-1 hover:text-foreground"
        title={drop.title}
      >
        <p className="text-[13px] leading-snug tracking-tight-2 line-clamp-3 text-balance">
          {drop.title}
        </p>
      </a>

      <Link
        href={`/new?${params.toString()}`}
        className={cn(
          "border-t border-border px-3.5 py-2 inline-flex items-center justify-between gap-2",
          "text-[11px] font-mono uppercase tracking-[0.12em] text-accent",
          "hover:bg-accent hover:text-accent-foreground transition-colors",
        )}
      >
        Open a poll <ArrowUpRight className="h-3 w-3" />
      </Link>
    </article>
  );
}
