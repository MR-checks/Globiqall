import { cn } from "@/lib/utils";

/**
 * Globiqall mark: a single pulse waveform — one upward signal in a flat line.
 * Renders in currentColor so it inherits theme naturally.
 * The period after the wordmark is the only colored element (accent amber).
 */
export function BrandLogo({
  className,
  size = 22,
  withWordmark = true,
}: {
  className?: string;
  size?: number;
  withWordmark?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-sans select-none",
        className,
      )}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 28 28"
        fill="none"
        aria-hidden
        className="shrink-0"
      >
        <path
          d="M1 14 H8 L11 6 L14 22 L17 9 L20 14 H27"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="square"
          strokeLinejoin="miter"
        />
      </svg>
      {withWordmark && (
        <span className="text-[15px] font-semibold tracking-tight-2 leading-none">
          globiqall<span className="text-accent">.</span>
        </span>
      )}
    </span>
  );
}
