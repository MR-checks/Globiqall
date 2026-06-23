/**
 * Avatar resolution: use the user's real image (OAuth or chosen), otherwise a
 * deterministic generative avatar from DiceBear keyed on a stable seed. No
 * uploads, no storage, no moderation. The seed (username/id) keeps a person's
 * avatar stable across the app.
 */
const DICEBEAR = "https://api.dicebear.com/9.x";

export const AVATAR_STYLES = [
  "thumbs",
  "bottts",
  "fun-emoji",
  "shapes",
  "identicon",
  "notionists-neutral",
] as const;

export type AvatarStyle = (typeof AVATAR_STYLES)[number];

export function generativeAvatar(seed: string, style: AvatarStyle = "thumbs"): string {
  return `${DICEBEAR}/${style}/svg?seed=${encodeURIComponent(seed || "globiqall")}&radius=50&backgroundType=gradientLinear`;
}

/** Real image if present, else a stable generative avatar. */
export function avatarUrl(opts: {
  image?: string | null;
  seed?: string | null;
}): string {
  if (opts.image) return opts.image;
  return generativeAvatar(opts.seed || "globiqall");
}
