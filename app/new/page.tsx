import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { CreatePollForm } from "@/components/create-poll-form";

type SearchParams = Promise<{
  type?: string;
  visibility?: string;
  mode?: string;
  title?: string;
  category?: string;
  dropId?: string;
}>;

export const metadata = { title: "Open a poll" };

export default async function NewPollPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in?next=/new");
  }
  const params = await searchParams;
  const categories = await db.category.findMany({ orderBy: { order: "asc" } });

  const defaultType =
    params.type === "BINARY" || params.type === "MULTI" ? params.type : "MULTI";
  const defaultVisibility =
    params.visibility === "PRIVATE" ||
    params.visibility === "UNLISTED" ||
    params.visibility === "PUBLIC"
      ? params.visibility
      : "PUBLIC";
  const defaultMode =
    params.mode?.toUpperCase() === "PREDICTION" ? "PREDICTION" : "DEBATE";

  // Match prefilled category slug → real Category.id (graceful if unknown slug)
  const prefillCategoryId =
    params.category && categories.find((c) => c.slug === params.category)?.id;

  // If this came from a drop, look up the source for attribution
  const fromDrop =
    params.dropId
      ? await db.drop.findUnique({
          where: { id: params.dropId },
          select: { id: true, source: true, sourceUrl: true, title: true },
        })
      : null;

  return (
    <div className="container max-w-2xl py-12 sm:py-16">
      <div className="mb-8">
        <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-2">
          New poll
        </div>
        <h1 className="text-[32px] sm:text-[40px] leading-[1.05] font-medium tracking-tightest">
          Ask the world.
        </h1>
        <p className="text-muted-foreground mt-2 text-[14px]">
          A great question takes 30 seconds. Make it count.
        </p>
      </div>

      {fromDrop && (
        <aside className="mb-6 rounded-md border border-border bg-card px-4 py-3 flex items-start gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-accent mt-0.5 shrink-0">
            From drop
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] tracking-tight-2 truncate">{fromDrop.title}</p>
            <a
              href={fromDrop.sourceUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="mt-0.5 inline-block font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground hover:text-foreground"
            >
              {fromDrop.source} ↗
            </a>
          </div>
        </aside>
      )}

      <CreatePollForm
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          color: c.color,
          slug: c.slug,
        }))}
        defaultType={defaultType}
        defaultVisibility={defaultVisibility}
        defaultMode={defaultMode}
        prefill={{
          title: params.title?.slice(0, 140) ?? "",
          categoryId: prefillCategoryId || undefined,
          dropId: params.dropId,
        }}
      />
    </div>
  );
}
