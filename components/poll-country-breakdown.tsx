import { db } from "@/lib/db";
import { countryFlag, countryName } from "@/lib/countries";
import { WorldHeatmap } from "@/components/world-heatmap";

export async function PollCountryBreakdown({ pollId }: { pollId: string }) {
  // Aggregate votes by country
  const rows = await db.vote.groupBy({
    by: ["countryCode"],
    where: { pollId },
    _count: { _all: true },
  });

  const named = rows
    .filter((r) => r.countryCode && /^[A-Z]{2}$/.test(r.countryCode))
    .map((r) => ({ code: r.countryCode as string, count: r._count._all }))
    .sort((a, b) => b.count - a.count);

  const total = named.reduce((a, b) => a + b.count, 0);
  const unknown = rows
    .filter((r) => !r.countryCode || !/^[A-Z]{2}$/.test(r.countryCode))
    .reduce((a, b) => a + b._count._all, 0);

  if (total === 0) {
    return (
      <section className="mt-12">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground hairline-b pb-2 mb-3 flex items-center justify-between">
          <span>Global signal</span>
          <span>{unknown ? `${unknown} unattributed` : "no data yet"}</span>
        </h2>
        <p className="text-center text-[13px] text-muted-foreground py-6">
          Country breakdown appears once geographically-attributed votes come in.
        </p>
      </section>
    );
  }

  const top = named.slice(0, 10);
  const maxCount = top[0]?.count ?? 1;

  return (
    <section className="mt-12">
      <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground hairline-b pb-2 mb-4 flex items-center justify-between">
        <span>Global signal</span>
        <span className="tabular-nums">
          {named.length} {named.length === 1 ? "country" : "countries"}
        </span>
      </h2>

      <div className="grid gap-6 lg:grid-cols-[1fr,300px]">
        <WorldHeatmap data={named} />

        <ol className="rounded-md border border-border bg-card overflow-hidden divide-y divide-border">
          {top.map((c, i) => {
            const p = (c.count / total) * 100;
            const w = (c.count / maxCount) * 100;
            return (
              <li
                key={c.code}
                className="relative px-3 py-2.5 flex items-center gap-3"
              >
                <div
                  className="absolute inset-y-0 left-0 bg-accent/10"
                  style={{ width: `${w}%` }}
                  aria-hidden
                />
                <span className="relative z-10 font-mono text-[10px] tabular-nums text-muted-foreground w-5 shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="relative z-10 text-base leading-none shrink-0" aria-hidden>
                  {countryFlag(c.code)}
                </span>
                <span className="relative z-10 min-w-0 flex-1 text-[13px] tracking-tight-2 truncate">
                  {countryName(c.code)}
                </span>
                <span className="relative z-10 font-mono text-[11px] tabular-nums text-muted-foreground shrink-0">
                  {p.toFixed(1)}%
                </span>
              </li>
            );
          })}
          {unknown > 0 && (
            <li className="px-3 py-2.5 flex items-center gap-3 text-muted-foreground">
              <span className="font-mono text-[10px] tabular-nums w-5 shrink-0">—</span>
              <span className="text-base shrink-0" aria-hidden>🏳️</span>
              <span className="min-w-0 flex-1 text-[13px] tracking-tight-2 truncate">
                Unattributed
              </span>
              <span className="font-mono text-[11px] tabular-nums shrink-0">
                {((unknown / (total + unknown)) * 100).toFixed(1)}%
              </span>
            </li>
          )}
        </ol>
      </div>
    </section>
  );
}
