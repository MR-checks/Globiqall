"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateProfile } from "@/app/actions/profile";

type Props = {
  defaults: { name: string; username: string; bio: string };
  email: string;
};

export function ProfileSettingsForm({ defaults, email }: Props) {
  const [name, setName] = React.useState(defaults.name);
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
