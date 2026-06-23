import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://globiqall.com";

  // Static + section routes
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, priority: 1.0, changeFrequency: "hourly" },
    { url: `${base}/explore`, priority: 0.9, changeFrequency: "hourly" },
    { url: `${base}/leaderboard`, priority: 0.7, changeFrequency: "daily" },
    { url: `${base}/about`, priority: 0.4, changeFrequency: "monthly" },
  ];

  const [categories, polls] = await Promise.all([
    db.category.findMany({ select: { slug: true } }),
    // Cap the dynamic surface, top public polls only
    db.poll.findMany({
      where: { visibility: "PUBLIC" },
      orderBy: { totalVotes: "desc" },
      take: 1000,
      select: { slug: true, updatedAt: true },
    }),
  ]);

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${base}/c/${c.slug}`,
    changeFrequency: "daily",
    priority: 0.6,
  }));

  const pollRoutes: MetadataRoute.Sitemap = polls.map((p) => ({
    url: `${base}/p/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: "hourly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...categoryRoutes, ...pollRoutes];
}
