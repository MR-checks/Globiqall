import { db } from "@/lib/db";

export type DropRow = Awaited<ReturnType<typeof listDrops>>[number];

export async function listDrops({
  category,
  limit = 30,
}: {
  category?: string | null;
  limit?: number;
} = {}) {
  return db.drop.findMany({
    where: {
      expiresAt: { gt: new Date() },
      ...(category ? { category } : {}),
    },
    orderBy: [{ score: "desc" }, { fetchedAt: "desc" }],
    take: limit,
  });
}

export async function countDrops(): Promise<number> {
  return db.drop.count({ where: { expiresAt: { gt: new Date() } } });
}
