import Link from "next/link";
import { ArrowDownWideNarrow } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A compact "sort by" segmented control. Server-friendly — each option is a
 * link, so it works without client JS and preserves other query params via the
 * pre-built hrefs the caller passes in.
 */
export function SortTabs({
  items,
  label = true,
}: {
  items: { label: string; href: string; active: boolean }[];
  label?: boolean;
}) {
  return (
    <div className="inline-flex items-center gap-2">
      {label && (
        <span className="hidden sm:inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
          <ArrowDownWideNarrow className="h-3 w-3" />
          sort
        </span>
      )}
      <div className="inline-flex items-center gap-0.5 rounded-md border border-border bg-card p-0.5">
        {items.map((it) => (
          <Link
            key={it.label}
            href={it.href}
            scroll={false}
            className={cn(
              "rounded-[5px] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em] transition-colors",
              it.active
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary",
            )}
          >
            {it.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
