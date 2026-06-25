import Link from "next/link";
import { Swords, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { avatarUrl } from "@/lib/avatar";
import type { Alignment, Ally } from "@/lib/tribes";

export function TribeCard({ alignment, isMe }: { alignment: Alignment; isMe: boolean }) {
  if (alignment.tribeName === "Unformed") {
    if (!isMe) return null;
    return (
      <section className="mb-10">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground hairline-b pb-2 mb-3">
          Your tribe
        </h2>
        <p className="text-[13px] text-muted-foreground">{alignment.tribeBlurb}</p>
      </section>
    );
  }

  return (
    <section className="mb-10">
      <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground hairline-b pb-2 mb-4">
        Tribe & alignment
      </h2>

      {/* Identity banner */}
      <div className="rounded-md border border-border bg-card p-5">
        <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-accent mb-1">
          Tribe
        </div>
        <div className="text-[24px] font-medium tracking-tight-2">{alignment.tribeName}</div>
        <p className="text-[13px] text-muted-foreground mt-1 max-w-prose">
          {alignment.tribeBlurb}
        </p>

        <div className="mt-4 grid grid-cols-3 gap-px rounded-md overflow-hidden border border-border bg-border">
          <Mini label="Contrarian idx" value={`${alignment.contrarianIndex}`} />
          <Mini label="Avg agreement" value={`${alignment.avgAgreement}%`} />
          <Mini label="Compared with" value={`${alignment.sampleSize}`} />
        </div>
      </div>

      {/* Allies + nemesis */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-md border border-border bg-card p-4">
          <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-positive mb-3">
            <Users className="h-3 w-3" /> Closest allies
          </div>
          {alignment.allies.length === 0 ? (
            <p className="text-[12px] text-muted-foreground">Not enough overlap yet.</p>
          ) : (
            <ul className="space-y-2">
              {alignment.allies.map((a, i) => (
                <AllyRow key={i} ally={a} accent="positive" />
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-md border border-border bg-card p-4">
          <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-destructive mb-3">
            <Swords className="h-3 w-3" /> Nemesis
          </div>
          {alignment.nemesis ? (
            <AllyRow ally={alignment.nemesis} accent="destructive" />
          ) : (
            <p className="text-[12px] text-muted-foreground">No clear rival yet.</p>
          )}
        </div>
      </div>
    </section>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card p-3 text-center">
      <div className="font-mono tabular-nums text-[18px] font-medium tracking-tight-2">{value}</div>
      <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground mt-0.5">
        {label}
      </div>
    </div>
  );
}

function AllyRow({ ally, accent }: { ally: Ally; accent: "positive" | "destructive" }) {
  const display = ally.username ? `@${ally.username}` : ally.name ?? "someone";
  const initial = (ally.name?.[0] ?? ally.username?.[0] ?? "?").toUpperCase();
  const inner = (
    <div className="flex items-center gap-2.5">
      <Avatar className="h-7 w-7 border border-border">
        <AvatarImage src={avatarUrl({ image: ally.image, seed: ally.username ?? ally.name })} alt="" />
        <AvatarFallback className="text-[10px]">{initial}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-medium tracking-tight-2 truncate">{display}</div>
        <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
          {ally.shared} shared
        </div>
      </div>
      <div
        className={`font-mono tabular-nums text-[15px] font-medium ${
          accent === "positive" ? "text-positive" : "text-destructive"
        }`}
      >
        {ally.agreementPct}%
      </div>
    </div>
  );
  return (
    <li>
      {ally.username ? (
        <Link href={`/u/${ally.username}`} className="block hover:opacity-80 transition-opacity">
          {inner}
        </Link>
      ) : (
        inner
      )}
    </li>
  );
}
