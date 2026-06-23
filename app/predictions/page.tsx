import Link from "next/link";
import { Plus, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PollCard } from "@/components/poll-card";
import {
  listLockedPredictions,
  listOpenPredictions,
  listResolvedPredictions,
} from "@/lib/predictions";

export const revalidate = 30;
export const metadata = {
  title: "Predictions",
  description: "Call what happens next. Lock it in. Be proven right.",
};

function toCard(p: Awaited<ReturnType<typeof listOpenPredictions>>[number]) {
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

export default async function PredictionsPage() {
  const [open, locked, resolved] = await Promise.all([
    listOpenPredictions(30),
    listLockedPredictions(12),
    listResolvedPredictions(12),
  ]);

  return (
    <div className="container pt-10 pb-20">
      <header className="hairline-b pb-6 mb-7 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-2 inline-flex items-center gap-2">
            <Target className="h-3 w-3 text-accent" />
            Predictions
          </div>
          <h1 className="text-[32px] sm:text-[44px] leading-[1.05] font-medium tracking-tightest">
            Call it before it happens.
          </h1>
          <p className="text-muted-foreground mt-2 text-[14px] max-w-prose">
            Lock a call before the deadline. When reality lands, correct
            predictors earn reputation, confident misses pay for it. Build a
            track record the world can see.
          </p>
        </div>
        <Button asChild variant="accent">
          <Link href="/new?mode=prediction">
            <Plus /> Open a prediction
          </Link>
        </Button>
      </header>

      <Section
        title="Open to call"
        hint="locks soonest first"
        empty="No open predictions yet. Be the first to open one."
        polls={open.map(toCard)}
      />

      {locked.length > 0 && (
        <Section
          title="Locked · awaiting result"
          hint="calls are final"
          polls={locked.map(toCard)}
        />
      )}

      {resolved.length > 0 && (
        <Section
          title="Recently resolved"
          hint="see who called it"
          polls={resolved.map(toCard)}
        />
      )}
    </div>
  );
}

function Section({
  title,
  hint,
  empty,
  polls,
}: {
  title: string;
  hint: string;
  empty?: string;
  polls: Parameters<typeof PollCard>[0]["poll"][];
}) {
  return (
    <section className="mb-10">
      <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground hairline-b pb-2 mb-4 flex items-center justify-between">
        <span>{title}</span>
        <span className="text-muted-foreground/70">{hint}</span>
      </h2>
      {polls.length === 0 ? (
        <p className="text-center text-[13px] text-muted-foreground py-8">{empty}</p>
      ) : (
        <div className="grid gap-x-3 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
          {polls.map((p) => (
            <PollCard key={p.id} poll={p} />
          ))}
        </div>
      )}
    </section>
  );
}
