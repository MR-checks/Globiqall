import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ProfileSettingsForm } from "@/components/profile-settings-form";

export const metadata = { title: "Profile settings" };

export default async function ProfileSettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in?next=/settings/profile");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, username: true, bio: true, email: true, image: true },
  });
  if (!user) redirect("/sign-in");

  return (
    <div className="container max-w-xl py-12 sm:py-16">
      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-2">
        Settings · Profile
      </div>
      <h1 className="text-[32px] sm:text-[40px] leading-[1.05] font-medium tracking-tightest">
        Your public face.
      </h1>
      <p className="text-muted-foreground mt-2 text-[14px]">
        Pick a username, add a bio. This is how you'll show up on GlobiQall.
      </p>

      <div className="mt-8">
        <ProfileSettingsForm
          defaults={{
            name: user.name ?? "",
            username: user.username ?? "",
            bio: user.bio ?? "",
            image: user.image,
          }}
          seed={user.username || user.id}
          email={user.email ?? ""}
        />
      </div>
    </div>
  );
}
