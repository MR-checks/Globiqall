import Link from "next/link";
import { notFound } from "next/navigation";
import { Crown, Swords } from "lucide-react";
import { db } from "@/lib/db";
import { getArenaBySlug, arenaLeaderboard, arenaStatusLabel } from "@/lib/arenas";
import { PollCard } from "@/components/poll-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { avatarUrl } from "@/lib/avatar";
import { categoryAccentStyle, categoryDotStyle } from "@/lib/category-colors";
import { formatCountdown, formatRelative } from "@/lib/utils";
import type { Metadata } from "next";

type PageProps = { params: Promise<{ slug: string }> };

export const revalidate = 20;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const arena = await db.arena.findUnique({ where: { slug }, select: { title: true, description: true } });
  if (!arena) return { title: "Arena" };
  return { title: arena.title, description: arena.description ?? undefined };
}

export default async function ArenaPage({ params }: PageProps) {
  const { slug } = await params;
  const arena = await getArenaBySlug(slug);
  if (!arena) notFound();
  const leaders = await arenaLeaderboard(arena.id, 15);

  const open = arena.polls.filter((p) => !p.resolvedAt);
  const resolved = arena.polls.filter((p) => p.resolvedAt);

  return (
    <div className="container pt-10 pb-20">
      <Link
        href="/arenas"
        className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground hover:text-foreground"
      >
        ← all arenas
      </Link>

      {/* Header */}
      <header className="mt-3 rounded-md border border-border bg-card overflow-hidden">
        <div className="h-[3px] w-full" style={categoryAccentStyle(arena.color)} aria-hidden />
        <div className="p-5 sm:p-7">
          <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground mb-3">
            <span className="inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full" style={categoryDotStyle(arena.color)} />
              Arena · {arenaStatusLabel(arena.status)}
            </span>
            <span className="tabular-nums">
              {arena.endsAt && arena.status === "LIVE"
                ? `ends ${formatCountdown(arena.endsAt)}`
                : arena.endsAt
                  ? `ended ${formatRelative(arena.endsAt)}`
                  : ""}
            </span>
          </div>
          <h1 className="text-[28px] sm:text-[40px] leading-[1.05] font-medium tracking-tightest text-balance">
            {arena.emoji ? `${arena.emoji} ` : ""}
            {arena.title}
          </h1>
          {arena.description && (
            <p className="text-[15px] text-muted-foreground mt-2 max-w-prose">
              {arena.description}
            </p>
          )}
        </div>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr,300px]">
        {/* Predictions */}
        <div>
          {open.length > 0 && (
            <section className="mb-8">
              <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground hairline-b pb-2 mb-4">
                Open to call
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {open.map((p) => (
                  <PollCard key={p.id} poll={toCard(p)} />
                ))}
              </div>
            </section>
          )}
          {resolved.length > 0 && (
            <section>
              <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground hairline-b pb-2 mb-4">
                Resolved
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {resolved.map((p) => (
                  <PollCard key={p.id} poll={toCard(p)} />
                ))}
              </div>
            </section>
          )}
          {arena.polls.length === 0 && (
            <p className="text-center text-[13px] text-muted-foreground py-8">
              No predictions in this arena yet.
            </p>
          )}
        </div>

        {/* Arena leaderboard */}
        <aside>
          <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground hairline-b pb-2 mb-3 inline-flex items-center gap-2">
            <Crown className="h-3 w-3 text-warning" /> Arena board
          </h2>
          {leaders.length === 0 ? (
            <p className="text-[12px] text-muted-foreground">
              No scores yet, be the first to call one right.
            </p>
          ) : (
            <ol className="rounded-md border border-border bg-card overflow-hidden divide-y divide-border">
              {leaders.map((l, i) => (
                <li key={i} className="flex items-center gap-3 px-3 py-2.5">
                  <span className="font-mono text-[11px] tabular-nums text-muted-foreground w-5">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <Avatar className="h-6 w-6 border border-border">
                    <AvatarImage src={avatarUrl({ image: l.image, seed: l.username ?? l.name })} alt="" />
                    <AvatarFallback className="text-[9px]">
                      {(l.name?.[0] ?? l.username?.[0] ?? "?").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 flex-1 text-[13px] tracking-tight-2 truncate">
                    {l.username ? (
                      <Link href={`/u/${l.username}`} className="hover:underline decoration-accent underline-offset-4">
                        @{l.username}
                      </Link>
                    ) : (
                      l.name ?? "anon"
                    )}
                  </span>
                  <span className="font-mono tabular-nums text-[13px] font-medium text-accent">
                    {l.rep > 0 ? "+" : ""}
                    {l.rep}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </aside>
      </div>
    </div>
  );
}

function toCard(p: NonNullable<Awaited<ReturnType<typeof getArenaBySlug>>>["polls"][number]) {
  return {
    ...p,
    options: p.options.map((o) => ({
      id: o.id,
      label: o.label,
      emoji: o.emoji,
      voteCount: o.voteCount,
    })),
  };
}
