import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const categories = [
  { slug: "politics", name: "Politics", emoji: "🏛️", color: "rose", description: "Elections, policy, world leaders.", order: 1 },
  { slug: "sports", name: "Sports", emoji: "⚽", color: "emerald", description: "Matches, championships, GOAT debates.", order: 2 },
  { slug: "tech", name: "Tech", emoji: "💻", color: "violet", description: "AI, gadgets, the next big thing.", order: 3 },
  { slug: "entertainment", name: "Entertainment", emoji: "🎬", color: "fuchsia", description: "Movies, music, celebs, awards.", order: 4 },
  { slug: "world", name: "World", emoji: "🌍", color: "sky", description: "Global events, culture, society.", order: 5 },
  { slug: "business", name: "Business", emoji: "📈", color: "amber", description: "Markets, crypto, startups, deals.", order: 6 },
  { slug: "science", name: "Science", emoji: "🔬", color: "cyan", description: "Discoveries, climate, space.", order: 7 },
  { slug: "lifestyle", name: "Lifestyle", emoji: "✨", color: "pink", description: "Food, travel, fashion, fun debates.", order: 8 },
  { slug: "gaming", name: "Gaming", emoji: "🎮", color: "indigo", description: "Esports, releases, console wars.", order: 9 },
  { slug: "other", name: "Other", emoji: "🌀", color: "slate", description: "Everything else.", order: 99 },
];

async function slug(title: string) {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  return `${base}-${Math.random().toString(36).slice(2, 6)}`;
}

async function main() {
  console.log("🌱 Seeding categories…");
  for (const c of categories) {
    await db.category.upsert({
      where: { slug: c.slug },
      update: c,
      create: c,
    });
  }

  // System author for seed polls
  const system = await db.user.upsert({
    where: { email: "system@globiqall.app" },
    update: {},
    create: {
      email: "system@globiqall.app",
      name: "Globiqall",
      username: "globiqall",
      image: null,
    },
  });

  const samplePolls = [
    {
      catSlug: "tech",
      title: "Will AI write the majority of production code by 2030?",
      description: "Vote your honest take on the trajectory of AI-assisted software.",
      type: "BINARY",
      options: [
        { label: "Yes, it'll dominate", emoji: "🤖" },
        { label: "No, humans still ship", emoji: "🧑‍💻" },
      ],
    },
    {
      catSlug: "sports",
      title: "GOAT of football",
      description: "The eternal debate. Pick your side.",
      type: "MULTI",
      options: [
        { label: "Messi", emoji: "🐐" },
        { label: "Ronaldo", emoji: "🚀" },
        { label: "Pelé", emoji: "👑" },
        { label: "Maradona", emoji: "🇦🇷" },
      ],
    },
    {
      catSlug: "entertainment",
      title: "Best Marvel phase so far?",
      type: "MULTI",
      options: [
        { label: "Phase 1", emoji: "💥" },
        { label: "Phase 2", emoji: "🛡️" },
        { label: "Phase 3", emoji: "♾️" },
        { label: "Phase 4+", emoji: "🌌" },
      ],
    },
    {
      catSlug: "business",
      title: "Bitcoin above $200k by end of next year?",
      description: "Pure vibes vote. Not financial advice.",
      type: "BINARY",
      options: [
        { label: "Bullish", emoji: "🚀" },
        { label: "Bearish", emoji: "🐻" },
      ],
    },
    {
      catSlug: "lifestyle",
      title: "Pineapple on pizza?",
      type: "BINARY",
      options: [
        { label: "Absolutely", emoji: "🍍" },
        { label: "Crime against humanity", emoji: "🙅" },
      ],
    },
    {
      catSlug: "world",
      title: "Most influential country of this decade?",
      type: "MULTI",
      options: [
        { label: "USA", emoji: "🇺🇸" },
        { label: "China", emoji: "🇨🇳" },
        { label: "India", emoji: "🇮🇳" },
        { label: "EU", emoji: "🇪🇺" },
      ],
    },
    {
      catSlug: "gaming",
      title: "Best gaming platform right now?",
      type: "MULTI",
      options: [
        { label: "PC", emoji: "🖥️" },
        { label: "PlayStation", emoji: "🎮" },
        { label: "Xbox", emoji: "🟩" },
        { label: "Switch", emoji: "🕹️" },
      ],
    },
    {
      catSlug: "science",
      title: "Humans on Mars before 2040?",
      type: "BINARY",
      options: [
        { label: "Yes — boots on Mars", emoji: "🚀" },
        { label: "Not happening", emoji: "🌑" },
      ],
    },
  ];

  console.log("🌱 Seeding sample polls…");
  for (const p of samplePolls) {
    const category = await db.category.findUnique({ where: { slug: p.catSlug } });
    if (!category) continue;
    const pollSlug = await slug(p.title);
    const exists = await db.poll.findFirst({ where: { title: p.title } });
    if (exists) continue;
    await db.poll.create({
      data: {
        slug: pollSlug,
        title: p.title,
        description: p.description ?? null,
        type: p.type,
        visibility: "PUBLIC",
        featured: true,
        categoryId: category.id,
        authorId: system.id,
        options: {
          create: p.options.map((o, i) => ({
            label: o.label,
            emoji: o.emoji,
            position: i,
          })),
        },
      },
    });
  }

  console.log("✅ Seed complete");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
