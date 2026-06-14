import Link from "next/link";
import { Swords, ArrowUpRight } from "lucide-react";
import { listArenas } from "@/lib/arenas";
import { arenaStatusLabel } from "@/lib/arenas";
import { categoryAccentStyle, categoryDotStyle } from "@/lib/category-colors";
import { formatCountdown, formatRelative } from "@/lib/utils";

export const revalidate = 30;
export const metadata = {
  title: "Arenas",
  description: "Time-boxed prediction events around what the world is watching.",
};

export default async function ArenasPage() {
  const arenas = await listArenas();

  return (
    <div className="container pt-10 pb-20">
      <header className="hairline-b pb-6 mb-7">
        <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-accent mb-2 inline-flex items-center gap-2">
          <Swords className="h-3 w-3" />
          Arenas
        </div>
        <h1 className="text-[32px] sm:text-[44px] leading-[1.05] font-medium tracking-tightest">
          The world is watching. Call it live.
        </h1>
        <p className="text-muted-foreground mt-2 text-[14px] max-w-prose">
          Big moments — tournaments, elections, awards, launches — become live
          arenas. Stack predictions, climb the arena board, earn the rarest
          trophies on the platform.
        </p>
      </header>

      {arenas.length === 0 ? (
        <div className="rounded-md border border-dashed border-border p-10 text-center">
          <h3 className="text-[15px] font-medium">No arenas live right now.</h3>
          <p className="text-[13px] text-muted-foreground mt-1">
            They spin up around major events. Check back soon.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {arenas.map((a) => (
            <Link
              key={a.id}
              href={`/arena/${a.slug}`}
              className="group rounded-md border border-border bg-card overflow-hidden hover:border-foreground/40 transition-colors"
            >
              <div className="h-[3px] w-full" style={categoryAccentStyle(a.color)} aria-hidden />
              <div className="p-5">
                <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground mb-3">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full" style={categoryDotStyle(a.color)} />
                    {arenaStatusLabel(a.status)}
                  </span>
                  <span className="tabular-nums">
                    {a.endsAt && a.status === "LIVE"
                      ? `ends ${formatCountdown(a.endsAt)}`
                      : a.endsAt
                        ? `ended ${formatRelative(a.endsAt)}`
                        : ""}
                  </span>
                </div>
                <h2 className="text-[20px] font-medium tracking-tight-2 group-hover:text-foreground">
                  {a.emoji ? `${a.emoji} ` : ""}
                  {a.title}
                </h2>
                {a.description && (
                  <p className="text-[13px] text-muted-foreground mt-1 line-clamp-2">
                    {a.description}
                  </p>
                )}
                <div className="mt-4 flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                  <span className="tabular-nums">{a._count.polls} predictions</span>
                  <span className="inline-flex items-center gap-1 text-accent">
                    enter <ArrowUpRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
