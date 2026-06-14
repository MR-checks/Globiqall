"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { markAllRead } from "@/lib/notifications";

export async function markNotificationsRead() {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const };
  await markAllRead(session.user.id);
  revalidatePath("/notifications");
  revalidatePath("/", "layout");
  return { ok: true as const };
}

export async function setEmailNotifications(enabled: boolean) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const };
  await db.user.update({
    where: { id: session.user.id },
    data: { emailNotifications: enabled },
  });
  revalidatePath("/settings/account");
  return { ok: true as const, enabled };
}
