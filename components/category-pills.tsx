import Link from "next/link";
import { db } from "@/lib/db";
import { categoryDotStyle } from "@/lib/category-colors";
import { cn } from "@/lib/utils";

export async function CategoryPills({ active }: { active?: string }) {
  const categories = await db.category.findMany({
    orderBy: { order: "asc" },
  });

  const itemBase =
    "inline-flex items-center gap-2 rounded-sm border px-2.5 py-1 text-xs tracking-tight-2 transition-colors whitespace-nowrap";
  const itemIdle =
    "border-border bg-transparent text-muted-foreground hover:text-foreground hover:bg-secondary";
  const itemActive =
    "border-foreground bg-foreground text-background";

  return (
    <div className="-mx-5 px-5 sm:mx-0 sm:px-0 overflow-x-auto scrollbar-none">
      <div className="flex items-center gap-1.5 min-w-max">
        <Link
          href="/"
          className={cn(itemBase, !active ? itemActive : itemIdle)}
        >
          <span className="text-[10px] uppercase tracking-[0.08em]">All</span>
        </Link>
        {categories.map((c) => {
          const isActive = active === c.slug;
          return (
            <Link
              key={c.id}
              href={`/c/${c.slug}`}
              className={cn(itemBase, isActive ? itemActive : itemIdle)}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={categoryDotStyle(c.color)}
                aria-hidden
              />
              {c.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
