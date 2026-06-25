"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { checkLimit, tooFastMessage } from "@/lib/rate-limit";
import { moderate } from "@/lib/moderation";

const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Min 3 characters")
  .max(24, "Max 24 characters")
  .regex(/^[a-z0-9_]+$/, "Lowercase letters, numbers, underscore only");

const bioSchema = z.string().trim().max(160).optional().or(z.literal(""));
const nameSchema = z.string().trim().max(60).optional().or(z.literal(""));

export async function updateProfile(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in?next=/settings/profile");

  const rl = checkLimit("updateProfile", session.user.id);
  if (!rl.ok) {
    return { ok: false as const, error: tooFastMessage("updateProfile", rl.retryAfterSec) };
  }

  const username = String(formData.get("username") ?? "");
  const bio = String(formData.get("bio") ?? "");
  const name = String(formData.get("name") ?? "");
  const image = String(formData.get("image") ?? "").trim();

  const u = usernameSchema.safeParse(username);
  if (!u.success) {
    return { ok: false as const, error: u.error.issues[0]?.message ?? "Invalid username" };
  }
  const b = bioSchema.safeParse(bio);
  if (!b.success) return { ok: false as const, error: "Bio too long" };
  const n = nameSchema.safeParse(name);
  if (!n.success) return { ok: false as const, error: "Name too long" };

  // Content guard on bio + name
  if (bio) {
    const bGuard = moderate(bio, "description");
    if (!bGuard.ok) return { ok: false as const, error: bGuard.error };
  }
  if (name) {
    const nGuard = moderate(name, "title");
    if (!nGuard.ok) return { ok: false as const, error: nGuard.error };
  }
  const uGuard = moderate(u.data, "title");
  if (!uGuard.ok) return { ok: false as const, error: "Pick a different username." };

  // Uniqueness check (only if changed)
  const me = await db.user.findUnique({
    where: { id: session.user.id },
    select: { username: true, image: true },
  });

  // Only accept a generative (DiceBear) avatar or the user's existing photo.
  // No arbitrary image URLs, so there is nothing to moderate or store.
  const isGenerative = /^https:\/\/api\.dicebear\.com\//.test(image);
  const finalImage = !image
    ? null
    : isGenerative || image === me?.image
      ? image
      : me?.image ?? null;
  if (me?.username !== u.data) {
    const taken = await db.user.findUnique({ where: { username: u.data } });
    if (taken) return { ok: false as const, error: "That username is taken" };
  }

  await db.user.update({
    where: { id: session.user.id },
    data: {
      username: u.data,
      bio: b.data || null,
      name: n.data || null,
      image: finalImage,
    },
  });
  revalidatePath(`/u/${u.data}`);
  revalidatePath("/settings/profile");
  return { ok: true as const, username: u.data };
}
