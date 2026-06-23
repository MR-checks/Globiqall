import { cn } from "@/lib/utils";

export type PollState = "OPEN" | "LOCKED" | "RESOLVED" | null;

/**
 * Status ribbon for the top-left corner of a poll card. A small banner with a
 * sloped right edge (clip-path) carrying the poll's state.
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
    label = "open call";
    tone = "bg-red-600 text-white";
    live = true;
  } else if (state === "LOCKED") {
    label = "locked";
    tone = "bg-amber-500 text-black";
  } else if (state === "RESOLVED") {
    label = "resolved";
    tone = "bg-emerald-600 text-white";
  } else if (isNew) {
    label = "new";
    tone = "bg-accent text-accent-foreground";
  }

  if (!label) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 py-1 pl-2.5 pr-4 text-[9px] font-mono font-semibold uppercase tracking-[0.14em] shadow-sm",
        tone,
        className,
      )}
      style={{ clipPath: "polygon(0 0, 100% 0, calc(100% - 10px) 100%, 0 100%)" }}
    >
      {live && (
        <span className="h-1.5 w-1.5 rounded-full bg-white animate-blink" aria-hidden />
      )}
      {label}
    </span>
  );
}
