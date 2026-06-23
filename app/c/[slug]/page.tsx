import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import { db } from "@/lib/db";
import { listPollsByCategory } from "@/lib/polls";
import { CategoryPills } from "@/components/category-pills";
import { PollCard } from "@/components/poll-card";
import { Button } from "@/components/ui/button";
import { categoryDotStyle } from "@/lib/category-colors";
import type { Metadata } from "next";

type PageProps = { params: Promise<{ slug: string }> };

export const revalidate = 30;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const cat = await db.category.findUnique({ where: { slug } });
  if (!cat) return { title: "Category" };
  return { title: `${cat.name}`, description: cat.description ?? undefined };
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const cat = await db.category.findUnique({ where: { slug } });
  if (!cat) notFound();
  const polls = await listPollsByCategory(slug, 36);
  const count = polls.length;

  return (
    <div className="container pt-8 pb-20">
      <div className="mb-7">
        <CategoryPills active={slug} />
      </div>

      <header className="hairline-b pb-6 mb-7 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-2 inline-flex items-center gap-2">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={categoryDotStyle(cat.color)}
            />
            Category
          </div>
          <h1 className="text-[32px] sm:text-[40px] leading-[1.05] font-medium tracking-tightest">
            {cat.name}
          </h1>
          {cat.description && (
            <p className="text-muted-foreground mt-2 max-w-prose text-[14px]">
              {cat.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground tabular-nums">
            {count} {count === 1 ? "poll" : "polls"}
          </span>
          <Button asChild variant="accent">
            <Link href={`/new`}>
              <Plus /> Open a poll
            </Link>
          </Button>
        </div>
      </header>

      {polls.length === 0 ? (
        <div className="rounded-md border border-dashed border-border p-10 text-center">
          <h3 className="text-[15px] font-medium">Nothing here yet.</h3>
          <p className="text-[13px] text-muted-foreground mt-1">
            Kick off the first {cat.name.toLowerCase()} debate.
          </p>
          <Button asChild className="mt-4" variant="accent">
            <Link href="/new">
              <Plus /> Open a poll
            </Link>
          </Button>
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
    </div>
  );
}
