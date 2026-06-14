import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { PollCard } from "@/components/poll-card";
import { Button } from "@/components/ui/button";

export const metadata = { title: "My polls" };

export default async function MyPollsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in?next=/my-polls");

  const polls = await db.poll.findMany({
    where: { authorId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      category: { select: { name: true, slug: true, emoji: true, color: true } },
      author: { select: { name: true, username: true, image: true } },
      options: { orderBy: { position: "asc" } },
    },
  });

  return (
    <div className="container pt-8 pb-20">
      <header className="hairline-b pb-6 mb-7 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-2">
            My polls
          </div>
          <h1 className="text-[32px] sm:text-[40px] leading-[1.05] font-medium tracking-tightest">
            Everything you've put to the world.
          </h1>
        </div>
        <Button asChild variant="accent">
          <Link href="/new">
            <Plus /> Open a poll
          </Link>
        </Button>
      </header>

      {polls.length === 0 ? (
        <div className="rounded-md border border-dashed border-border p-10 text-center">
          <h3 className="text-[15px] font-medium">No polls yet — your turn.</h3>
          <p className="text-[13px] text-muted-foreground mt-1">
            Ask the planet anything. Takes 30 seconds.
          </p>
          <Button asChild className="mt-4" variant="accent">
            <Link href="/new">
              <Plus /> Open your first poll
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
