import { COUNTRIES, countryFlag, countryName } from "@/lib/countries";

type Datum = { code: string; count: number };

/**
 * Pulse-style minimal world heatmap. Dot scatter on an equirectangular
 * projection — restraint over realism. Country shapes are implied by the
 * dots themselves; no coastline outlines.
 *
 * Sizes scale 6→18px by count. Amber accent.
 */
export function WorldHeatmap({ data }: { data: Datum[] }) {
  const W = 720;
  const H = 360;
  const maxCount = data.reduce((m, d) => Math.max(m, d.count), 0) || 1;

  const project = (lat: number, lng: number) => {
    const x = ((lng + 180) / 360) * W;
    const y = ((90 - lat) / 180) * H;
    return { x, y };
  };

  // All reference centroids = idle dot layer
  const idle = Object.entries(COUNTRIES).map(([code, c]) => ({ code, ...c }));

  return (
    <div className="relative rounded-md border border-border bg-card overflow-hidden">
      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full h-auto" aria-label="World participation">
        {/* Grid */}
        <g stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.6">
          {[0, 1, 2, 3].map((i) => {
            const y = (i / 3) * H;
            return <line key={`h${i}`} x1={0} y1={y} x2={W} y2={y} />;
          })}
          {[0, 1, 2, 3, 4, 5, 6].map((i) => {
            const x = (i / 6) * W;
            return <line key={`v${i}`} x1={x} y1={0} x2={x} y2={H} />;
          })}
        </g>

        {/* Idle dots — every country we know about */}
        <g fill="hsl(var(--muted-foreground))" opacity="0.18">
          {idle.map((c) => {
            const { x, y } = project(c.lat, c.lng);
            return <circle key={`i-${c.code}`} cx={x} cy={y} r={2} />;
          })}
        </g>

        {/* Active dots — countries that voted */}
        <g>
          {data.map((d) => {
            const info = COUNTRIES[d.code];
            if (!info) return null;
            const { x, y } = project(info.lat, info.lng);
            const intensity = d.count / maxCount;
            const r = 4 + intensity * 14;
            return (
              <g key={d.code}>
                <circle
                  cx={x}
                  cy={y}
                  r={r}
                  fill="hsl(var(--accent))"
                  fillOpacity={0.18}
                />
                <circle cx={x} cy={y} r={Math.max(2.5, r * 0.45)} fill="hsl(var(--accent))" />
                <title>{`${countryFlag(d.code)} ${countryName(d.code)} · ${d.count}`}</title>
              </g>
            );
          })}
        </g>
      </svg>
      <div className="absolute bottom-2 right-3 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
        equirectangular · {data.length} countries
      </div>
    </div>
  );
}
