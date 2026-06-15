"use client";

import * as React from "react";
import { formatCountdown } from "@/lib/utils";

const DAY_MS = 86_400_000;

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

/** HH:MM:SS for the final stretch (< 24h). */
function clock(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}

/**
 * Live-ticking countdown to a target time. Within 24h it ticks every second as a
 * HH:MM:SS clock for urgency; further out it shows "Xd Yh" and updates every 30s.
 * Calls onReached once when it hits zero.
 */
export function Countdown({
  target,
  className,
  prefix,
  onReached,
}: {
  target: string | Date;
  className?: string;
  prefix?: string;
  onReached?: () => void;
}) {
  const targetMs = React.useMemo(
    () => (typeof target === "string" ? new Date(target).getTime() : target.getTime()),
    [target],
  );
  const [now, setNow] = React.useState(() => Date.now());
  const reached = React.useRef(false);

  const remaining = targetMs - now;
  const urgent = remaining > 0 && remaining < DAY_MS;

  React.useEffect(() => {
    const tick = () => {
      setNow(Date.now());
      if (!reached.current && targetMs <= Date.now()) {
        reached.current = true;
        onReached?.();
      }
    };
    // Sub-24h: tick every second for a live clock; otherwise every 30s.
    const id = setInterval(tick, urgent ? 1000 : 30_000);
    return () => clearInterval(id);
  }, [targetMs, onReached, urgent]);

  return (
    <span className={className} suppressHydrationWarning>
      {prefix}
      {urgent ? clock(remaining) : formatCountdown(target)}
    </span>
  );
}
