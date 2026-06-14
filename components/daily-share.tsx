"use client";

import * as React from "react";
import { Flame, Share2, Snowflake } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/**
 * Wordle-style daily share. Shows the participation streak and copies a
 * spoiler-free brag block (never reveals your pick — just that you played).
 */
export function DailyShare({
  dateLabel,
  streak,
  freezes = 0,
  played,
}: {
  dateLabel: string;
  streak: number;
  freezes?: number;
  played: boolean;
}) {
  const appUrl =
    typeof window !== "undefined" ? `${window.location.origin}/daily` : "globiqall.app/daily";

  const shareText = `Globiqall Daily · ${dateLabel}\nI made today's call 🔵\nStreak: ${streak} ${streak === 1 ? "day" : "days"} 🔥\n${appUrl}`;

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ text: shareText });
      } else {
        await navigator.clipboard.writeText(shareText);
        toast.success("Copied — go flex your streak");
      }
    } catch {
      /* cancelled */
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-card px-4 py-3">
      <div className="inline-flex items-center gap-3">
        <span className="inline-flex items-center gap-2">
          <Flame className={streak > 0 ? "h-4 w-4 text-accent" : "h-4 w-4 text-muted-foreground"} />
          <span className="font-mono text-[12px] uppercase tracking-[0.1em] text-muted-foreground">
            Daily streak
          </span>
          <span className="font-mono tabular-nums text-[18px] font-medium">{streak}</span>
        </span>
        {freezes > 0 && (
          <span
            className="inline-flex items-center gap-1 font-mono text-[11px] tabular-nums text-accent"
            title="Streak freezes — protect your streak if you miss a day"
          >
            <Snowflake className="h-3.5 w-3.5" />
            {freezes}
          </span>
        )}
      </div>
      {played && (
        <Button variant="outline" size="sm" onClick={share}>
          <Share2 /> Share streak
        </Button>
      )}
    </div>
  );
}
