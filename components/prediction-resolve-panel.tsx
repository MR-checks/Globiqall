"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Gavel, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { resolvePollAction } from "@/app/actions";

type Option = { id: string; label: string; emoji: string | null };

/**
 * Author/admin-only panel to resolve a prediction: pick what actually happened,
 * cite a public source, confirm. Scores every pick into reputation.
 */
export function PredictionResolvePanel({
  pollId,
  options,
}: {
  pollId: string;
  options: Option[];
}) {
  const [open, setOpen] = React.useState(false);
  const [winner, setWinner] = React.useState<string | null>(null);
  const [source, setSource] = React.useState("");
  const [note, setNote] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const router = useRouter();

  async function handleResolve() {
    if (!winner) {
      toast.error("Pick what actually happened");
      return;
    }
    setPending(true);
    const fd = new FormData();
    fd.set("pollId", pollId);
    fd.set("winningOptionId", winner);
    fd.set("source", source);
    fd.set("note", note);
    const res = await resolvePollAction(fd);
    setPending(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(`Resolved · ${res.scored} calls scored`);
    router.refresh();
  }

  return (
    <section className="mt-8 rounded-md border border-accent/40 bg-accent/5 p-5">
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-accent mb-2">
        <Gavel className="h-3 w-3" />
        Resolve this prediction
      </div>
      <p className="text-[13px] text-muted-foreground max-w-prose">
        Mark what actually happened. Every call is scored into reputation
        instantly — correct predictors gain, confident misses lose a little.
        This can't be undone, so cite a source.
      </p>

      {!open ? (
        <Button variant="outline" className="mt-4" onClick={() => setOpen(true)}>
          Resolve now
        </Button>
      ) : (
        <div className="mt-4 space-y-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground mb-2">
              What happened?
            </div>
            <div className="grid gap-2">
              {options.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setWinner(o.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-md border px-3 py-2.5 text-left text-[14px] tracking-tight-2 transition-colors",
                    winner === o.id
                      ? "border-positive ring-1 ring-positive/40 bg-card"
                      : "border-border bg-card hover:border-foreground/40",
                  )}
                >
                  {o.emoji && <span aria-hidden>{o.emoji}</span>}
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              Source URL · required for trust
            </span>
            <Input
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="https://… link proving the outcome"
              className="mt-1.5 bg-card h-10"
            />
          </label>

          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              Note · optional
            </span>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="One line of context"
              className="mt-1.5 bg-card h-10"
              maxLength={200}
            />
          </label>

          <div className="flex items-center gap-2">
            <Button
              variant="accent"
              onClick={handleResolve}
              disabled={pending || !winner}
            >
              {pending ? <Loader2 className="animate-spin" /> : <Gavel />}
              Confirm result
            </Button>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
