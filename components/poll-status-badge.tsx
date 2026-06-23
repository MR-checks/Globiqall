import { cn } from "@/lib/utils";

export type PollState = "OPEN" | "LOCKED" | "RESOLVED" | null;

/**
 * The status ribbon shown at the top-right of a poll card / box.
 * LIVE (red) for open calls, LOCKED (amber), RESOLVED (green), NEW (accent)
 * for a freshly opened poll that isn't a prediction.
 */
export function PollStatusBadge({
  state,
  isNew,
  className,
}: {
  state: PollState;
  isNew?: boolean;
  className?: string;
}) {
  let label: string | null = null;
  let tone = "";
  let live = false;

  if (state === "OPEN") {
    label = "Live";
    tone = "bg-red-600 text-white";
    live = true;
  } else if (state === "LOCKED") {
    label = "Locked";
    tone = "bg-amber-500 text-black";
  } else if (state === "RESOLVED") {
    label = "Resolved";
    tone = "bg-emerald-600 text-white";
  } else if (isNew) {
    label = "New";
    tone = "bg-accent text-accent-foreground";
  }

  if (!label) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-mono font-semibold uppercase tracking-[0.14em] shadow-sm",
        tone,
        className,
      )}
    >
      {live && (
        <span className="h-1.5 w-1.5 rounded-full bg-white animate-blink" aria-hidden />
      )}
      {label}
    </span>
  );
}
