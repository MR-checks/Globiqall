"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import { Plus, Trash2, Globe2, Link2, Lock, Swords, Layers, Loader2, MessageSquare, Target } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { categoryDotStyle } from "@/lib/category-colors";
import { cn } from "@/lib/utils";
import { createPoll } from "@/app/actions";
import { PollCreateGuide } from "@/components/poll-create-guide";
import { PollPresetChips } from "@/components/poll-preset-chips";
import { BINARY_PRESETS, MULTI_PRESETS, type Preset } from "@/lib/poll-presets";

type Category = { id: string; name: string; color: string; slug: string };

type Option = { id: string; label: string; emoji: string };

const blank = (): Option => ({
  id: Math.random().toString(36).slice(2),
  label: "",
  emoji: "",
});

export function CreatePollForm({
  categories,
  defaultType,
  defaultVisibility,
  prefill,
}: {
  categories: Category[];
  defaultType: "BINARY" | "MULTI";
  defaultVisibility: "PUBLIC" | "UNLISTED" | "PRIVATE";
  prefill?: {
    title?: string;
    categoryId?: string;
    dropId?: string;
  };
}) {
  const [title, setTitle] = React.useState(prefill?.title ?? "");
  const [mode, setMode] = React.useState<"DEBATE" | "PREDICTION">("DEBATE");
  const [type, setType] = React.useState<"BINARY" | "MULTI">(defaultType);
  const [visibility, setVisibility] = React.useState<"PUBLIC" | "UNLISTED" | "PRIVATE">(
    defaultVisibility,
  );
  const [categoryId, setCategoryId] = React.useState(
    prefill?.categoryId ?? categories[0]?.id ?? "",
  );
  const [options, setOptions] = React.useState<Option[]>(
    defaultType === "BINARY"
      ? [blank(), blank()]
      : [blank(), blank(), blank()],
  );

  React.useEffect(() => {
    if (type === "BINARY" && options.length !== 2) {
      setOptions((prev) => {
        const next = prev.slice(0, 2);
        while (next.length < 2) next.push(blank());
        return next;
      });
    }
  }, [type, options.length]);

  const addOption = () => {
    if (options.length >= 6) return;
    setOptions((prev) => [...prev, blank()]);
  };
  const removeOption = (id: string) => {
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((o) => o.id !== id));
  };
  const updateOption = (id: string, patch: Partial<Option>) =>
    setOptions((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)));

  const applyPreset = (preset: Preset) => {
    setOptions(
      preset.options.map((o) => ({
        id: Math.random().toString(36).slice(2),
        label: o.label,
        emoji: o.emoji ?? "",
      })),
    );
  };

  // Mark this preset active if current options exactly match it
  const activePresetId = React.useMemo(() => {
    const pool = type === "BINARY" ? BINARY_PRESETS : MULTI_PRESETS;
    for (const p of pool) {
      if (p.options.length !== options.length) continue;
      const allMatch = p.options.every(
        (po, i) =>
          po.label === options[i].label.trim() &&
          (po.emoji ?? "") === options[i].emoji.trim(),
      );
      if (allMatch) return p.id;
    }
    return null;
  }, [type, options]);

  async function handleSubmit(formData: FormData) {
    formData.set("type", type);
    formData.set("mode", mode);
    formData.set("visibility", visibility);
    formData.set("categoryId", categoryId);
    options.forEach((o, i) => {
      formData.set(`option_${i}`, o.label);
      if (o.emoji) formData.set(`emoji_${i}`, o.emoji);
    });
    if (prefill?.dropId) formData.set("dropId", prefill.dropId);
    // First-poll milestone: dismiss the guide for next visit
    try {
      window.localStorage.setItem("globiqall:guide:create:dismissed", "1");
    } catch { /* ignore */ }
    const res = await createPoll(formData);
    if (res && !res.ok) toast.error(res.error);
  }

  return (
    <>
    <PollCreateGuide />
    <form action={handleSubmit} className="space-y-7">
      <Field label="Question">
        <Input
          name="title"
          required
          maxLength={140}
          placeholder="Will AI write the majority of code by 2030?"
          className="text-[15px] h-11 bg-card"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </Field>

      <Field label="Context" hint="optional · sets the vibe">
        <Textarea
          name="description"
          maxLength={500}
          placeholder="A sentence or two — just curious where the planet stands."
          className="bg-card"
        />
      </Field>

      <Field
        label="Mode"
        hint={mode === "PREDICTION" ? "scored against reality" : "pure opinion"}
      >
        <div className="grid grid-cols-2 gap-2">
          <Toggle
            active={mode === "DEBATE"}
            icon={<MessageSquare className="h-3.5 w-3.5" />}
            title="Debate"
            subtitle="Take a side"
            onClick={() => setMode("DEBATE")}
          />
          <Toggle
            active={mode === "PREDICTION"}
            icon={<Target className="h-3.5 w-3.5" />}
            title="Prediction"
            subtitle="Call the outcome"
            onClick={() => setMode("PREDICTION")}
          />
        </div>
        {mode === "PREDICTION" && (
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground leading-relaxed">
            Picks lock at the deadline · resolved against what actually happens ·
            correct calls earn reputation
          </p>
        )}
      </Field>

      <div className="grid sm:grid-cols-2 gap-5">
        <Field label="Category">
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger className="bg-card">
              <SelectValue placeholder="Pick a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={categoryDotStyle(c.color)}
                    />
                    {c.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Type">
          <div className="grid grid-cols-2 gap-2">
            <Toggle
              active={type === "MULTI"}
              icon={<Layers className="h-3.5 w-3.5" />}
              title="Multi"
              subtitle="3–6 options"
              onClick={() => setType("MULTI")}
            />
            <Toggle
              active={type === "BINARY"}
              icon={<Swords className="h-3.5 w-3.5" />}
              title="Versus"
              subtitle="2 sides"
              onClick={() => setType("BINARY")}
            />
          </div>
        </Field>
      </div>

      <Field
        label="Options"
        hint={
          type === "BINARY"
            ? "the two sides"
            : "2–6 · emoji optional"
        }
      >
        <div className="mb-3">
          <PollPresetChips
            type={type}
            activeId={activePresetId}
            onApply={applyPreset}
          />
        </div>
        <div className="space-y-2">
          {options.map((o, i) => (
            <div key={o.id} className="flex items-stretch gap-2">
              <Input
                value={o.emoji}
                onChange={(e) => updateOption(o.id, { emoji: e.target.value })}
                maxLength={4}
                placeholder="🎯"
                className="w-12 text-center text-base bg-card"
                aria-label={`Option ${i + 1} emoji`}
              />
              <Input
                value={o.label}
                onChange={(e) => updateOption(o.id, { label: e.target.value })}
                required
                maxLength={80}
                placeholder={`Option ${i + 1}`}
                className="flex-1 bg-card"
              />
              {options.length > 2 && type === "MULTI" && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeOption(o.id)}
                  aria-label="Remove option"
                >
                  <Trash2 className="text-muted-foreground" />
                </Button>
              )}
            </div>
          ))}
          {type === "MULTI" && options.length < 6 && (
            <Button
              type="button"
              variant="outline"
              onClick={addOption}
              className="w-full border-dashed"
            >
              <Plus /> Add option
            </Button>
          )}
        </div>
      </Field>

      <div className="grid sm:grid-cols-2 gap-5">
        <Field label="Visibility">
          <div className="grid grid-cols-3 gap-2">
            <Toggle
              active={visibility === "PUBLIC"}
              icon={<Globe2 className="h-3.5 w-3.5" />}
              title="Public"
              subtitle="On feed"
              onClick={() => setVisibility("PUBLIC")}
            />
            <Toggle
              active={visibility === "UNLISTED"}
              icon={<Link2 className="h-3.5 w-3.5" />}
              title="Unlisted"
              subtitle="Link"
              onClick={() => setVisibility("UNLISTED")}
            />
            <Toggle
              active={visibility === "PRIVATE"}
              icon={<Lock className="h-3.5 w-3.5" />}
              title="Private"
              subtitle="Code"
              onClick={() => setVisibility("PRIVATE")}
            />
          </div>
        </Field>

        {mode === "DEBATE" ? (
          <Field label="Closes" hint="optional">
            <Input
              type="datetime-local"
              name="closesAt"
              className="h-11 bg-card"
            />
          </Field>
        ) : (
          <Field label="Locks at" hint="required">
            <Input
              type="datetime-local"
              name="lockAt"
              required
              className="h-11 bg-card"
            />
          </Field>
        )}
      </div>

      {mode === "PREDICTION" && (
        <Field label="Resolves around" hint="optional · when the result is known">
          <Input
            type="datetime-local"
            name="resolvesAt"
            className="h-11 bg-card"
          />
        </Field>
      )}

      <div className="flex items-center justify-between pt-3 hairline-t">
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
          {mode === "PREDICTION"
            ? "One call per person · final once it locks"
            : "One vote per person · changeable any time"}
        </p>
        <SubmitButton mode={mode} />
      </div>
    </form>
    </>
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

function Toggle({
  active,
  icon,
  title,
  subtitle,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-start gap-1 rounded-md border p-2.5 text-left transition-colors h-[64px]",
        active
          ? "border-foreground bg-card"
          : "border-border bg-card hover:border-foreground/40",
      )}
    >
      <span className="inline-flex items-center gap-1.5 text-[13px] font-medium tracking-tight-2">
        {icon}
        {title}
      </span>
      <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
        {subtitle}
      </span>
    </button>
  );
}

function SubmitButton({ mode }: { mode: "DEBATE" | "PREDICTION" }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="accent" size="lg" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="animate-spin" /> Opening
        </>
      ) : mode === "PREDICTION" ? (
        <>Open prediction</>
      ) : (
        <>Open poll</>
      )}
    </Button>
  );
}
