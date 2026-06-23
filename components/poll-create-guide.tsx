"use client";

import * as React from "react";
import { X } from "lucide-react";
import { QUESTION_STARTERS } from "@/lib/poll-presets";

const STORAGE_KEY = "globiqall:guide:create:dismissed";

type Props = {
  /** If true, the guide is force-hidden (e.g. user has created polls before). */
  forceHidden?: boolean;
};

const STEPS = [
  {
    n: "01",
    title: "Ask one clear question",
    body: "Short, specific, alive in the moment. Predictions, debates, opinions, all fair game.",
  },
  {
    n: "02",
    title: "Set the sides",
    body: "Versus for two camps · Multi for 3–6 options. Use a quick-fill template, or write your own.",
  },
  {
    n: "03",
    title: "Open it to the world",
    body: "Public goes on the feed · Unlisted is link-only · Private uses a share code. Live updates either way.",
  },
];

export function PollCreateGuide({ forceHidden = false }: Props) {
  const [hidden, setHidden] = React.useState(true);

  React.useEffect(() => {
    if (forceHidden) {
      setHidden(true);
      return;
    }
    try {
      const dismissed = window.localStorage.getItem(STORAGE_KEY) === "1";
      setHidden(dismissed);
    } catch {
      setHidden(false);
    }
  }, [forceHidden]);

  const dismiss = () => {
    setHidden(true);
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  if (hidden) return null;

  return (
    <aside
      role="region"
      aria-label="How it works"
      className="relative rounded-md border border-border bg-card mb-7 animate-fade-in"
    >
      <button
        type="button"
        onClick={dismiss}
        className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        aria-label="Dismiss guide"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      <div className="p-5 sm:p-6">
        <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-4">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
          How it works
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="space-y-1.5">
              <div className="font-mono text-[11px] tabular-nums tracking-tight-2 text-accent">
                {s.n}
              </div>
              <div className="text-[14px] font-medium tracking-tight-2">
                {s.title}
              </div>
              <div className="text-[12px] text-muted-foreground leading-relaxed">
                {s.body}
              </div>
            </div>
          ))}
        </div>

        <div className="hairline-t mt-5 pt-4 flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground mr-1">
            Stuck? try
          </span>
          {QUESTION_STARTERS.map((q) => (
            <span
              key={q}
              className="font-mono text-[11px] text-foreground/70 bg-secondary/60 border border-border rounded-sm px-1.5 py-0.5"
            >
              {q}
            </span>
          ))}
        </div>
      </div>
    </aside>
  );
}
