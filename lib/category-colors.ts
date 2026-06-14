/**
 * Maps Category.color (a hue name) to a concrete HSL value used for the
 * indicator dot and accent bar. Single source of truth for category visuals.
 */
const DOT_HSL: Record<string, string> = {
  rose: "351 83% 61%",
  emerald: "152 78% 43%",
  violet: "262 83% 68%",
  fuchsia: "292 91% 65%",
  sky: "199 89% 60%",
  amber: "38 95% 55%",
  cyan: "190 95% 50%",
  pink: "330 82% 65%",
  indigo: "239 84% 67%",
  slate: "215 16% 55%",
};

export function categoryDot(color: string | null | undefined): string {
  if (!color) return DOT_HSL.slate;
  return DOT_HSL[color] ?? DOT_HSL.slate;
}

export function categoryDotStyle(color: string | null | undefined) {
  return { backgroundColor: `hsl(${categoryDot(color)})` };
}

export function categoryAccentStyle(color: string | null | undefined) {
  return {
    backgroundImage: `linear-gradient(90deg, hsl(${categoryDot(color)}) 0%, hsl(${categoryDot(color)} / 0.4) 100%)`,
  };
}
