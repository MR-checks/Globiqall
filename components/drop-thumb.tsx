"use client";

import * as React from "react";
import { pollIcon } from "@/lib/poll-visuals";
import { cn } from "@/lib/utils";

/**
 * Small square thumbnail for a drop / news item. Shows the feed-provided image
 * when present, and falls back to a topic-emoji gradient tile when there is no
 * image or it fails to load (hotlinked images can 404). Plain <img>, lazy, so
 * it never touches the Vercel image-optimization quota.
 */
export function DropThumb({
  imageUrl,
  title,
  fallback,
  className,
}: {
  imageUrl?: string | null;
  title: string;
  fallback?: string;
  className?: string;
}) {
  const [failed, setFailed] = React.useState(false);
  const ref = React.useRef<HTMLImageElement>(null);
  const base = cn("h-12 w-12 shrink-0 rounded-md border border-border", className);

  // Catch images that errored before hydration (onError won't fire for those).
  React.useEffect(() => {
    const el = ref.current;
    if (el && el.complete && el.naturalWidth === 0) setFailed(true);
  }, [imageUrl]);

  if (imageUrl && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        ref={ref}
        src={imageUrl}
        alt=""
        loading="lazy"
        onError={() => setFailed(true)}
        className={cn(base, "object-cover bg-secondary")}
      />
    );
  }
  return (
    <span
      className={cn(base, "grid place-items-center bg-gradient-to-br from-secondary to-card text-lg")}
      aria-hidden
    >
      {fallback ?? pollIcon({ title })}
    </span>
  );
}
