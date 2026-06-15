import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export type DropRow = Awaited<ReturnType<typeof listDrops>>[number];
export type DropSort = "latest" | "top" | "expiring";

export async function listDrops({
  category,
  limit = 30,
  sort = "latest",
}: {
  category?: string | null;
  limit?: number;
  sort?: DropSort;
} = {}) {
  const orderBy: Prisma.DropOrderByWithRelationInput[] =
    sort === "top"
      ? [{ score: "desc" }, { fetchedAt: "desc" }]
      : sort === "expiring"
        ? [{ expiresAt: "asc" }]
        : [{ fetchedAt: "desc" }, { score: "desc" }]; // latest (default)
  return db.drop.findMany({
    where: {
      expiresAt: { gt: new Date() },
      ...(category ? { category } : {}),
    },
    orderBy,
    take: limit,
  });
}

export async function countDrops(): Promise<number> {
  return db.drop.count({ where: { expiresAt: { gt: new Date() } } });
}
