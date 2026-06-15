import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * GlobiQall mark: the brand "G" icon, theme-switched (light icon on light
 * surfaces, navy icon on dark), next to the wordmark. The period after the
 * wordmark is the only colored element (accent).
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
      <Image
        src="/favicon-64-light.png"
        alt="GlobiQall"
        width={size}
        height={size}
        priority
        className="shrink-0 rounded-[5px] block dark:hidden"
      />
      <Image
        src="/favicon-64-dark.png"
        alt=""
        aria-hidden
        width={size}
        height={size}
        priority
        className="shrink-0 rounded-[5px] hidden dark:block"
      />
      {withWordmark && (
        <span className="text-[15px] font-semibold tracking-tight-2 leading-none">
          GlobiQall<span className="text-accent">.</span>
        </span>
      )}
    </span>
  );
}
