/**
 * Free signal collectors for the Drops feed.
 * All sources are public, no API keys, no payment.
 * Each fetcher returns a flat list of RawDrop and is allowed to fail silently,
 * the orchestrator will skip a failed source and continue.
 */

export type RawDrop = {
  title: string;
  source: string;
  sourceUrl: string;
  publishedAt?: Date;
  imageUrl?: string;
};

// Real-browser-looking UA so feeds we hit don't 403 us out of the gate.
const USER_AGENT =
  "Mozilla/5.0 (compatible; globiqall-drops/0.1; +https://globiqall.com)";

async function fetchJSON<T = unknown>(url: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, {
      ...init,
      headers: { "User-Agent": USER_AGENT, Accept: "application/json", ...(init?.headers ?? {}) },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function fetchText(url: string, init?: RequestInit): Promise<string | null> {
  try {
    const res = await fetch(url, {
      ...init,
      headers: { "User-Agent": USER_AGENT, ...(init?.headers ?? {}) },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

// ---- Reddit: via .rss (their public Atom feeds are still ungated) ----
const REDDIT_SUBS = [
  "gadgets",
  "movies",
  "Music",
  "sports",
  "technology",
  "Futurology",
  "Games",
  "Android",
  "apple",
  "popculturechat",
] as const;

export async function fetchReddit(): Promise<RawDrop[]> {
  const out: RawDrop[] = [];
  await Promise.all(
    REDDIT_SUBS.map(async (sub) => {
      const xml = await fetchText(
        `https://www.reddit.com/r/${sub}/hot.rss?limit=15`,
      );
      if (!xml) return;
      const items = parseFeed(xml, `reddit/r/${sub}`);
      out.push(...items);
    }),
  );
  return out;
}

// ---- Hacker News: launch / release / announcement stories ----
type HNHits = {
  hits: Array<{
    title: string | null;
    url: string | null;
    objectID: string;
    created_at: string;
    points?: number;
  }>;
};

const HN_QUERIES = [
  "launches OR launching",
  "release OR releasing",
  "announces OR announced",
  "unveils",
  "preview",
];

export async function fetchHN(): Promise<RawDrop[]> {
  const out: RawDrop[] = [];
  await Promise.all(
    HN_QUERIES.map(async (q) => {
      const data = await fetchJSON<HNHits>(
        `https://hn.algolia.com/api/v1/search?tags=story&query=${encodeURIComponent(q)}&hitsPerPage=25&numericFilters=points>20`,
      );
      if (!data) return;
      for (const h of data.hits) {
        if (!h.title) continue;
        out.push({
          title: cleanTitle(h.title),
          source: "hn",
          sourceUrl: h.url ?? `https://news.ycombinator.com/item?id=${h.objectID}`,
          publishedAt: new Date(h.created_at),
        });
      }
    }),
  );
  return out;
}

// ---- Product Hunt: today's launches (Atom) ----
export async function fetchProductHunt(): Promise<RawDrop[]> {
  const xml = await fetchText("https://www.producthunt.com/feed");
  if (!xml) return [];
  return parseFeed(xml, "producthunt");
}

// ---- Google News RSS: anticipation queries ----
const GNEWS_QUERIES = [
  "launches",
  "release date",
  "upcoming",
  "to be announced",
  "leaked",
  "rumored",
];

export async function fetchGoogleNews(): Promise<RawDrop[]> {
  const out: RawDrop[] = [];
  await Promise.all(
    GNEWS_QUERIES.map(async (q) => {
      const url = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`;
      const xml = await fetchText(url);
      if (!xml) return;
      const items = parseFeed(xml, "gnews");
      // Google News titles include " - Source" suffixes, strip:
      for (const it of items) {
        out.push({
          ...it,
          title: it.title.replace(/\s+-\s+[^-]+$/, "").trim(),
        });
      }
    }),
  );
  return out;
}

// ---- Helpers ----

function cleanTitle(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    // Strip leading bracket tags like [OC], [Discussion]
    .replace(/^\s*(\[[^\]]+\]\s*)+/, "")
    .trim();
}

/**
 * Parser that handles both RSS 2.0 (<item>) and Atom (<entry>) feeds.
 * Extracts title, primary link, and publication date.
 * Not a full XML parser, intentionally lenient for the small feeds we read.
 */
function parseFeed(xml: string, sourceLabel: string): RawDrop[] {
  const out: RawDrop[] = [];
  const isAtom = /<feed\b[^>]*xmlns=["']http:\/\/www\.w3\.org\/2005\/Atom/i.test(xml)
    || /<entry\b/i.test(xml);

  const blockRe = isAtom ? /<entry\b[\s\S]*?<\/entry>/gi : /<item\b[\s\S]*?<\/item>/gi;

  for (const block of xml.match(blockRe) ?? []) {
    const title = pickTag(block, "title");
    const link = isAtom ? pickAtomLink(block) : pickTag(block, "link");
    if (!title || !link) continue;
    const pub =
      pickTag(block, "pubDate") ||
      pickTag(block, "published") ||
      pickTag(block, "updated");
    out.push({
      title: cleanTitle(title),
      source: sourceLabel,
      sourceUrl: link.trim(),
      publishedAt: pub ? new Date(pub) : undefined,
      imageUrl: pickImage(block) ?? sourceLogo(block),
    });
  }
  return out;
}

/**
 * Fallback image: the publisher's logo/favicon, derived from the feed's
 * `<source url="...">` element (Google News ships this on every item). Gives
 * image-less news items a real source visual with no extra request.
 */
function sourceLogo(block: string): string | undefined {
  const m = /<source[^>]+\burl=["']([^"']+)["']/i.exec(block);
  if (!m) return undefined;
  try {
    const host = new URL(m[1]).hostname.replace(/^www\./, "");
    return `https://www.google.com/s2/favicons?domain=${host}&sz=128`;
  } catch {
    return undefined;
  }
}

/**
 * Pull a thumbnail the feed already ships (media:thumbnail / media:content /
 * enclosure / an <img> in the HTML content). No extra network requests, so it
 * stays cheap. Returns undefined when the feed has no usable image.
 */
function pickImage(block: string): string | undefined {
  const patterns = [
    /<media:thumbnail[^>]*\burl=["']([^"']+)["']/i,
    /<media:content[^>]*\burl=["']([^"']+)["']/i,
    /<enclosure[^>]*\burl=["']([^"']+)["'][^>]*type=["']image/i,
    /<enclosure[^>]*type=["']image[^>]*\burl=["']([^"']+)["']/i,
    /<img[^>]+src=["']([^"']+)["']/i,
  ];
  for (const re of patterns) {
    const m = block.match(re);
    if (!m) continue;
    const url = m[1].replace(/&amp;/g, "&").trim();
    if (!/^https:\/\//i.test(url)) continue; // https only
    if (/spacer|pixel|1x1|blank\.|\.gif($|\?)/i.test(url)) continue; // skip trackers
    return url;
  }
  return undefined;
}

function pickTag(block: string, tag: string): string | null {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const m = block.match(re);
  if (!m) return null;
  return m[1].replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "").trim();
}

/**
 * Atom <link> is an attribute-bearing element:
 *   <link rel="alternate" href="..." />
 * Pick the first link with rel="alternate" (or default), prefer text/html.
 */
function pickAtomLink(block: string): string | null {
  const linkRe = /<link\b[^>]*>/gi;
  const links = block.match(linkRe) ?? [];
  let best: string | null = null;
  for (const tag of links) {
    const rel = /rel=["']([^"']+)["']/.exec(tag)?.[1];
    const href = /href=["']([^"']+)["']/.exec(tag)?.[1];
    if (!href) continue;
    if (rel === "self") continue; // skip feed self-link
    if (!rel || rel === "alternate") return href;
    if (!best) best = href;
  }
  return best;
}
