"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateProfile } from "@/app/actions/profile";
import { generativeAvatar, AVATAR_STYLES } from "@/lib/avatar";
import { cn } from "@/lib/utils";

type Props = {
  defaults: { name: string; username: string; bio: string; image: string | null };
  email: string;
  seed: string;
};

export function ProfileSettingsForm({ defaults, email, seed }: Props) {
  const [name, setName] = React.useState(defaults.name);
  const hasPhoto = Boolean(defaults.image && !defaults.image.includes("dicebear"));
  const [avatar, setAvatar] = React.useState<string>(
    defaults.image || generativeAvatar(seed, "thumbs"),
  );
  const [username, setUsername] = React.useState(defaults.username);
  const [bio, setBio] = React.useState(defaults.bio);
  const [pending, setPending] = React.useState(false);
  const router = useRouter();

  const usernamePreview = username.toLowerCase().replace(/[^a-z0-9_]/g, "");
  const usernameValid = /^[a-z0-9_]{3,24}$/.test(usernamePreview);

  async function handleSubmit(formData: FormData) {
    formData.set("name", name);
    formData.set("username", usernamePreview);
    formData.set("bio", bio);
    formData.set("image", avatar);
    setPending(true);
    const res = await updateProfile(formData);
    setPending(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Profile saved");
    router.push(`/u/${res.username}`);
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <Field label="Avatar" hint="pick a style or keep your photo">
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={avatar}
            alt="Selected avatar"
            className="h-16 w-16 shrink-0 rounded-full border border-border bg-card"
          />
          <div className="flex flex-wrap gap-2">
            {hasPhoto && (
              <button
                type="button"
                onClick={() => setAvatar(defaults.image as string)}
                title="Your account photo"
                className={cn(
                  "rounded-full ring-2 ring-offset-2 ring-offset-background transition",
                  avatar === defaults.image ? "ring-accent" : "ring-transparent",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={defaults.image as string} alt="" className="h-9 w-9 rounded-full" />
              </button>
            )}
            {AVATAR_STYLES.map((style) => {
              const url = generativeAvatar(seed, style);
              return (
                <button
                  type="button"
                  key={style}
                  onClick={() => setAvatar(url)}
                  title={style}
                  className={cn(
                    "rounded-full ring-2 ring-offset-2 ring-offset-background transition",
                    avatar === url ? "ring-accent" : "ring-transparent",
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={style} className="h-9 w-9 rounded-full border border-border" />
                </button>
              );
            })}
          </div>
        </div>
      </Field>

      <Field label="Display name" hint="optional">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          placeholder="What people call you"
          className="bg-card h-11"
        />
      </Field>

      <Field
        label="Username"
        hint="3–24 chars · letters, numbers, underscore"
      >
        <div className="flex items-stretch rounded-md border border-input bg-card overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1 focus-within:ring-offset-background transition-shadow">
          <span className="grid place-items-center px-3 font-mono text-[12px] uppercase tracking-[0.08em] text-muted-foreground border-r border-border bg-secondary/50">
            globiqall.com/u/
          </span>
          <input
            value={usernamePreview}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={24}
            placeholder="yourname"
            className="flex-1 bg-transparent px-3 py-2 text-[14px] tracking-tight-2 outline-none placeholder:text-muted-foreground"
          />
          {usernamePreview.length >= 3 && (
            <span className="grid place-items-center px-3">
              {usernameValid ? (
                <Check className="h-4 w-4 text-positive" />
              ) : (
                <span className="font-mono text-[10px] uppercase text-destructive">bad</span>
              )}
            </span>
          )}
        </div>
      </Field>

      <Field label="Bio" hint={`${160 - bio.length} left`}>
        <Textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={160}
          rows={3}
          placeholder="One line about you."
          className="bg-card"
        />
      </Field>

      <Field label="Email" hint="locked">
        <Input value={email} disabled className="bg-secondary/30 h-11" />
      </Field>

      <div className="flex items-center justify-between pt-3 hairline-t">
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
          Public · visible to everyone
        </p>
        <Button type="submit" variant="accent" size="lg" disabled={pending || !usernameValid}>
          {pending ? <Loader2 className="animate-spin" /> : null}
          Save profile
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between font-mono text-[10px] uppercase tracking-[0.12em]">
        <span className="text-muted-foreground">{label}</span>
        {hint && <span className="text-muted-foreground/70">{hint}</span>}
      </div>
      {children}
    </div>
  );
}
