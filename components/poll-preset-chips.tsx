"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import { BINARY_PRESETS, MULTI_PRESETS, type Preset } from "@/lib/poll-presets";
import { cn } from "@/lib/utils";

type Props = {
  type: "BINARY" | "MULTI";
  /** When the form options exactly match a preset, that preset highlights as active. */
  activeId?: string | null;
  onApply: (preset: Preset) => void;
};

export function PollPresetChips({ type, activeId, onApply }: Props) {
  const presets = type === "BINARY" ? BINARY_PRESETS : MULTI_PRESETS;

  return (
    <div className="-mx-1 px-1 overflow-x-auto scrollbar-none">
      <div className="flex items-center gap-2 min-w-max py-0.5">
        <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground shrink-0">
          <Sparkles className="h-3 w-3" />
          Quick fill
        </span>
        {presets.map((p) => {
          const isActive = activeId === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onApply(p)}
              className={cn(
                "group inline-flex items-center gap-2 rounded-sm border px-2.5 py-1 text-[12px] tracking-tight-2 transition-colors whitespace-nowrap shrink-0",
                isActive
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-card hover:border-foreground/40 hover:bg-secondary/50 text-foreground/85",
              )}
              aria-pressed={isActive}
              title={p.options.map((o) => o.label).join(" · ")}
            >
              <span className="inline-flex items-center gap-0.5 text-[13px] leading-none" aria-hidden>
                {p.options.slice(0, 4).map((o, i) => (
                  <span key={i}>{o.emoji ?? ""}</span>
                ))}
              </span>
              <span>{p.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
