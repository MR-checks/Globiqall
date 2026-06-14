"use client";

import * as React from "react";
import { formatCountdown } from "@/lib/utils";

/**
 * Live-ticking countdown to a target time. Updates every 30s (cheap, plenty
 * granular for lock deadlines). Calls onReached once when it hits zero.
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
  const [, force] = React.useReducer((x) => x + 1, 0);
  const reached = React.useRef(false);

  React.useEffect(() => {
    const id = setInterval(() => {
      force();
      const t = typeof target === "string" ? new Date(target) : target;
      if (!reached.current && t.getTime() <= Date.now()) {
        reached.current = true;
        onReached?.();
      }
    }, 30_000);
    return () => clearInterval(id);
  }, [target, onReached]);

  return (
    <span className={className}>
      {prefix}
      {formatCountdown(target)}
    </span>
  );
}
