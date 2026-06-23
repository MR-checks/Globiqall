/**
 * Lightweight content guard for poll titles, descriptions, and comments.
 *
 * Goals:
 *  - Hard-block the most obvious slurs and severe profanity.
 *  - Catch common bypasses (leet-speak, spaces, simple symbol substitutions).
 *  - Catch link spam (too many URLs in one short field).
 *  - Catch screaming (ALL-CAPS over a threshold).
 *  - Keep false positives near zero, the wordlist is intentionally narrow.
 *
 * This is a starter guard, not a complete moderation system. For production,
 * pair with a hosted classifier (e.g. Anthropic Claude moderation, Perspective)
 * for nuanced cases.
 */

// Narrow, well-known severe terms. Intentionally short.
// (Censored in source for repo hygiene, actual letters in the regex chars.)
const BLOCK_PATTERNS: RegExp[] = [
  /\bn[\W_0o]*?i[\W_0o]*?g[\W_0o]*?g?[\W_0o]*?[ae3]r?\b/i,   // n-word
  /\bf[\W_0o]*?a[\W_0o]*?g[\W_0o]*?g?[\W_0o]*?o[\W_0o]*?t\b/i,  // f-slur
  /\bk[\W_0o]*?i[\W_0o]*?k[\W_0o]*?e\b/i,                       // ethnic slur
  /\bc[\W_0o]*?h[\W_0o]*?i[\W_0o]*?n[\W_0o]*?k\b/i,             // ethnic slur
  /\bt[\W_0o]*?r[\W_0o]*?a[\W_0o]*?n[\W_0o]*?n[\W_0o]*?[iy]e?\b/i, // transphobic slur
  // Sexual exploitation of minors (zero-tolerance)
  /\b(?:cp|child[\s-]*p[o0]rn|pedo(?:phil[ei]a?)?)\b/i,
];

// Soft-warn list (won't block, but you could surface a warning in UI).
const SOFT_PATTERNS: RegExp[] = [
  /\b(?:k[i1]ll y[o0]urs?elf|kys)\b/i,
  /\b(?:scam|phishing|free\s+(?:btc|nft|gift))\b/i,
];

const URL_RE = /\bhttps?:\/\/\S+/gi;

export type GuardField = "title" | "description" | "comment";

export type GuardResult =
  | { ok: true; warnings: string[] }
  | { ok: false; error: string };

const MAX_URLS: Record<GuardField, number> = {
  title: 0,
  description: 2,
  comment: 3,
};

export function moderate(text: string, field: GuardField): GuardResult {
  const trimmed = (text ?? "").trim();
  if (!trimmed) return { ok: true, warnings: [] };

  for (const re of BLOCK_PATTERNS) {
    if (re.test(trimmed)) {
      return { ok: false, error: "Contains language we don't allow on GlobiQall." };
    }
  }

  // Link spam guard
  const urls = trimmed.match(URL_RE) ?? [];
  if (urls.length > MAX_URLS[field]) {
    return {
      ok: false,
      error:
        field === "title"
          ? "Links don't belong in the question itself."
          : `Too many links (${urls.length}). Keep it to ${MAX_URLS[field]}.`,
    };
  }

  // Caps lock screaming check (only for titles/comments, and only for longer text)
  if (field !== "description" && trimmed.length >= 16) {
    const letters = trimmed.replace(/[^a-zA-Z]/g, "");
    if (letters.length >= 12) {
      const upperRatio = (letters.match(/[A-Z]/g)?.length ?? 0) / letters.length;
      if (upperRatio > 0.8) {
        return {
          ok: false,
          error: "Easy on the caps, write it normally.",
        };
      }
    }
  }

  // Repeated character spam (e.g., "aaaaaaaaa")
  if (/(.)\1{6,}/i.test(trimmed)) {
    return { ok: false, error: "Looks like spammy repeated characters." };
  }

  // Soft warnings (currently informational only)
  const warnings: string[] = [];
  for (const re of SOFT_PATTERNS) {
    if (re.test(trimmed)) warnings.push("Heads up: this might get flagged by the community.");
  }

  return { ok: true, warnings };
}
