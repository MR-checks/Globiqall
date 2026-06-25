import { cn } from "@/lib/utils";

const MEDAL_SRC: Record<string, string> = {
  bronze: "/medals/bronze.png",
  silver: "/medals/silver.png",
  gold: "/medals/gold.png",
  platinum: "/medals/platinum.png",
  diamond: "/medals/diamond.png",
};

/**
 * Rendered 3D tier medal (Bronze to Diamond). Plain img so it never touches the
 * Vercel image-optimization quota; height-driven, width auto-keeps the aspect.
 */
export function Medal({
  tier,
  size = 48,
  className,
}: {
  tier: string;
  size?: number;
  className?: string;
}) {
  const src = MEDAL_SRC[tier.toLowerCase()] ?? MEDAL_SRC.bronze;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={`${tier} medal`}
      loading="lazy"
      style={{ height: size, width: "auto" }}
      className={cn("inline-block select-none drop-shadow-sm", className)}
    />
  );
}
