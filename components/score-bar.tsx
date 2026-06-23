import { cn } from "@/lib/utils";

type Opt = { id: string; label: string; voteCount: number };

/**
 * Context-aware result bar. The shape changes with the poll:
 *  - Resolved: a single emerald fill for the winning option.
 *  - Binary versus: a two-sided split (leader vs runner), leader tinted accent
 *    for live predictions, foreground for debates.
 *  - Multi: stacked, graduated segments for the top options.
 */
export function ScoreBar({
  options,
  total,
  type,
  resolvedOptionId,
  state,
  className,
}: {
  options: Opt[];
  total: number;
  type: string;
  resolvedOptionId?: string | null;
  state?: "OPEN" | "LOCKED" | "RESOLVED" | null;
  className?: string;
}) {
  const sorted = [...options].sort((a, b) => b.voteCount - a.voteCount);
  const denom = total || sorted.reduce((s, o) => s + o.voteCount, 0) || 1;
  const track = cn(
    "flex h-1.5 w-full items-stretch gap-px overflow-hidden rounded-full bg-border",
    className,
  );
  const w = (n: number) => `${(n / denom) * 100}%`;

  if (resolvedOptionId) {
    const winner = options.find((o) => o.id === resolvedOptionId);
    return (
      <div className={track}>
        <div
          className="bg-emerald-500 transition-[width] duration-700"
          style={{ width: w(winner?.voteCount ?? 0) }}
        />
      </div>
    );
  }

  if (type === "BINARY" && sorted.length >= 2) {
    return (
      <div className={track}>
        <div
          className={cn("transition-[width] duration-700", state ? "bg-accent" : "bg-foreground")}
          style={{ width: w(sorted[0].voteCount) }}
        />
        <div className="bg-muted-foreground/35" style={{ width: w(sorted[1].voteCount) }} />
      </div>
    );
  }

  const shades = ["bg-foreground", "bg-foreground/60", "bg-foreground/35"];
  return (
    <div className={track}>
      {sorted.slice(0, 3).map((o, i) => (
        <div
          key={o.id}
          className={cn("transition-[width] duration-700", shades[i] ?? "bg-foreground/25")}
          style={{ width: w(o.voteCount) }}
        />
      ))}
    </div>
  );
}
