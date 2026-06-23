/**
 * A single leading icon for a poll, a small chip on cards that gives the feed
 * visual rhythm. Topic keywords win; otherwise we fall back to the poll's
 * category emoji. Intentionally one icon per card, not emoji spam.
 */
export function pollIcon(poll: {
  title: string;
  category?: { emoji?: string | null } | null;
}): string {
  const t = poll.title.toLowerCase();
  const rules: [RegExp, string][] = [
    [/\bbitcoin\b|\bbtc\b|\bethereum\b|\beth\b|crypto/, "₿"],
    [/world cup|golden boot|\bfifa\b|champions league|premier league|world series|\bnba\b|\bnfl\b|\bnhl\b|playoff|\bgoat\b|olympic/, "🏆"],
    [/election|midterm|senate|\bhouse\b|president|parliament|congress|referendum/, "🗳️"],
    [/apple|iphone|\bios\b|\bmac\b/, "🍎"],
    [/\bai\b|\bgpt\b|openai|anthropic|\bllm\b|chatbot|\bmodel\b/, "🤖"],
    [/\bwar\b|peace|treaty|ceasefire|nuclear|hostage/, "🕊️"],
    [/stock|\bfed\b|interest rate|inflation|earnings|\bgdp\b|recession/, "📈"],
    [/spacex|rocket|\bnasa\b|launch|mars|satellite/, "🚀"],
  ];
  for (const [re, icon] of rules) if (re.test(t)) return icon;
  return poll.category?.emoji || "🎯";
}
