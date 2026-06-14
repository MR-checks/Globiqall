import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { AccountDangerZone } from "@/components/account-danger-zone";
import { ExportDataButton } from "@/components/export-data-button";
import { EmailPrefToggle } from "@/components/email-pref-toggle";

export const metadata = { title: "Account settings" };

export default async function AccountSettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in?next=/settings/account");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      username: true,
      email: true,
      emailNotifications: true,
      _count: {
        select: { polls: true, votes: true, comments: { where: { deletedAt: null } } },
      },
    },
  });
  if (!user) redirect("/sign-in");

  return (
    <div className="container max-w-xl py-12 sm:py-16">
      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-2">
        Settings · Account
      </div>
      <h1 className="text-[32px] sm:text-[40px] leading-[1.05] font-medium tracking-tightest">
        Your account.
      </h1>
      <p className="text-muted-foreground mt-2 text-[14px]">
        Export everything we hold on you. Delete it all at any time.
      </p>

      {/* Footprint */}
      <section className="mt-8 rounded-md border border-border bg-card p-4">
        <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground mb-3">
          Your data footprint
        </div>
        <ul className="grid grid-cols-3 gap-px bg-border rounded-md overflow-hidden border border-border">
          <Stat label="Polls" value={user._count.polls} />
          <Stat label="Votes" value={user._count.votes} />
          <Stat label="Comments" value={user._count.comments} />
        </ul>
        <p className="mt-3 text-[12px] text-muted-foreground">
          Signed in as <span className="font-mono text-foreground/90">{user.email}</span>
        </p>
      </section>

      {/* Notifications */}
      <section className="mt-8 rounded-md border border-border bg-card p-5">
        <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground mb-3">
          Notifications
        </div>
        <EmailPrefToggle initial={user.emailNotifications} />
      </section>

      {/* Export */}
      <section className="mt-8 rounded-md border border-border bg-card p-5">
        <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground mb-2">
          Export
        </div>
        <h2 className="text-[18px] font-medium tracking-tight-2">Download your data</h2>
        <p className="text-[13px] text-muted-foreground mt-1 max-w-prose">
          We'll generate a JSON file with your profile, every poll you opened,
          every vote you cast, and every comment you posted. No fees, no
          waiting list.
        </p>
        <div className="mt-4">
          <ExportDataButton />
        </div>
      </section>

      {/* Danger zone */}
      <AccountDangerZone username={user.username} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <li className="bg-card p-3 text-center">
      <div className="font-mono tabular-nums text-[22px] tracking-tight-2 font-medium">
        {value}
      </div>
      <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground mt-0.5">
        {label}
      </div>
    </li>
  );
}
