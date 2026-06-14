/**
 * Anticipation filter — pure rules, no LLM, no cost.
 * Goal: keep items that suggest something is about to happen or just dropped.
 * Reject items that are tragedies, breaking-now, or other non-pollable noise.
 */

const ANTICIPATION = [
  /\blaunch(?:es|ing|ed)?\b/i,
  /\brelease(?:s|d|ing)?\b/i,
  /\bdrop(?:s|ping|ped)?\b/i,
  /\bannounce(?:s|d|ment|ments)?\b/i,
  /\bunveil(?:s|ed|ing)?\b/i,
  /\bcoming\s+(?:soon|to|in|this|next)\b/i,
  /\bset\s+to\b/i,
  /\bto\s+(?:debut|launch|release|unveil|reveal|hit|drop|arrive|come|premiere)\b/i,
  /\bdebut(?:s|ed|ing)?\b/i,
  /\bleaked?\b/i,
  /\brumou?red\b/i,
  /\breportedly\b/i,
  /\bsources\s+say\b/i,
  /\bexpected\b/i,
  /\banticipated\b/i,
  /\bcountdown\b/i,
  /\bdays?\s+away\b/i,
  /\bnext\s+(?:week|month|year|season)\b/i,
  /\bthis\s+(?:weekend|week|month|year)\b/i,
  /\bhands-?on\b/i,
  /\bpreview\b/i,
  /\bpremiere(?:s|d)?\b/i,
  /\bfirst\s+look\b/i,
  /\btrailer\b/i,
  /\bteaser\b/i,
  /\bbeta\s+(?:launch|access|release)\b/i,
  /\bearly\s+access\b/i,
  /\bcall\s+of\s+duty|gta|grand\s+theft\s+auto/i, // strong specific drops
];

const DATE_HINT = [
  /\bon\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+\d{1,2}/i,
  /\b(?:tomorrow|tonight|this\s+weekend)\b/i,
  /\bq[1-4]\s+20\d{2}\b/i,
  /\b20(?:2[6-9]|3\d)\b/, // future year mention (>= 2026 — current year is 2026)
];

const NEGATIVE = [
  /\b(?:dies?|died|dead|killed|kill(?:ed|ing)|tragedy|disaster|funeral|murder(?:ed)?|assault(?:ed)?|shot|stabbed|fatal)\b/i,
  /\b(?:arrest(?:ed|s)?|indict(?:ed|ment|ments)?|charge(?:d|s)?|sentenced?|guilty|verdict|lawsuit|sued|conviction)\b/i,
  /\b(?:war|attacked?|invasion|bombing|airstrike|hostages?|terror(?:ist)?)\b/i,
  /\b(?:earthquake|hurricane|wildfire|flood(?:s|ing|ed)?|tsunami)\b/i,
  /\b(?:breaking|just\s+in)\s*:?\s*/i, // breaking news framing
  /\bporn\b|\bnsfw\b/i,
  /\b(?:racist|nazi|slur|sexual\s+assault|rape)\b/i,
];

/**
 * Returns a score. Anything < 2 should be rejected.
 * +2 per anticipation keyword (cap at +6)
 * +1 per date hint (cap at +2)
 * -5 if any negative pattern matches
 */
export function anticipationScore(title: string): number {
  const t = title || "";
  let antiHits = 0;
  for (const re of ANTICIPATION) if (re.test(t)) antiHits++;
  let dateHits = 0;
  for (const re of DATE_HINT) if (re.test(t)) dateHits++;

  let score = Math.min(antiHits, 3) * 2 + Math.min(dateHits, 2);

  for (const re of NEGATIVE) {
    if (re.test(t)) {
      score -= 5;
      break;
    }
  }
  return score;
}

// ---- Category guesser ----

const CATEGORY_KEYWORDS: Record<string, RegExp[]> = {
  gaming: [
    /\b(?:game|gaming|xbox|playstation|ps5|ps6|nintendo|switch|steam|gta|cod|call\s+of\s+duty|esports?)\b/i,
  ],
  tech: [
    /\b(?:ai|llm|gpt|claude|gemini|chatbot|iphone|android|google|meta|apple|samsung|chip|cpu|gpu|m\d\s+chip|gadget|app|saas|api|cloud|software|hardware|robot|robotics|laptop|macbook)\b/i,
  ],
  entertainment: [
    /\b(?:movie|film|netflix|disney|marvel|dc|hbo|show|series|season\s+\d|episode|album|tour|concert|trailer|teaser|streaming|premiere|oscars?|grammys?|cinema)\b/i,
  ],
  sports: [
    /\b(?:nfl|nba|nhl|mlb|fifa|uefa|champions\s+league|premier\s+league|la\s+liga|serie\s+a|olympic|world\s+cup|super\s+bowl|playoffs?|finals?|season\s+opener|f1|formula\s+1|wimbledon|us\s+open)\b/i,
  ],
  business: [
    /\b(?:ipo|merger|acquisition|earnings|stock|shares|crypto|bitcoin|btc|ethereum|eth|fed|interest\s+rates?|nasdaq|s&p|spx|dow|tesla|nvidia|inflation)\b/i,
  ],
  science: [
    /\b(?:nasa|spacex|mars|moon|launch\s+vehicle|rocket|satellite|telescope|climate|fusion|nuclear|biotech|crispr|vaccine|exoplanet|astronaut)\b/i,
  ],
  politics: [
    /\b(?:election|primary|caucus|president(?:ial)?|senate|congress|parliament|prime\s+minister|chancellor|vote\s+(?:on|for))\b/i,
  ],
  world: [
    /\b(?:g7|g20|un\s+(?:summit|general\s+assembly|security\s+council)|nato|eu\s+summit|davos)\b/i,
  ],
  lifestyle: [
    /\b(?:fashion|sneaker|drop|tour|festival|brand\s+launch|collab(?:oration)?|menu|recipe)\b/i,
  ],
};

export function guessCategory(title: string): string | null {
  for (const [slug, patterns] of Object.entries(CATEGORY_KEYWORDS)) {
    if (patterns.some((re) => re.test(title))) return slug;
  }
  return null;
}

// ---- Fingerprint (dedup) ----

/**
 * Cheap title fingerprint for dedupe. Lowercase, alpha-numeric only, first 64 chars.
 * Two titles that map to the same fingerprint are treated as duplicates.
 * Not a real simhash, but good enough for cluster-of-identical headlines.
 */
export function fingerprint(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 64);
}
