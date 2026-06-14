"use client";

import * as React from "react";

export function LiveCounter({
  value,
  className,
  format = (n) => n.toLocaleString("en-US"),
}: {
  value: number;
  className?: string;
  format?: (n: number) => string;
}) {
  const [display, setDisplay] = React.useState(value);
  const prev = React.useRef(value);
  const [flash, setFlash] = React.useState(false);

  React.useEffect(() => {
    if (value === prev.current) return;
    const from = prev.current;
    const to = value;
    const start = performance.now();
    const dur = 600;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
      else prev.current = to;
    };
    setFlash(true);
    const flashTimer = setTimeout(() => setFlash(false), 700);
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(flashTimer);
    };
  }, [value]);

  return (
    <span
      className={`tabular-nums transition-colors duration-500 ${
        flash ? "text-accent" : ""
      } ${className ?? ""}`}
    >
      {format(display)}
    </span>
  );
}
