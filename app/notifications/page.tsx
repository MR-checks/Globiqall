import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, Swords, Target, Snowflake, Trophy } from "lucide-react";
import { auth } from "@/auth";
import { listNotifications, markAllRead } from "@/lib/notifications";
import { formatRelative } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Notifications" };

function iconFor(type: string) {
  switch (type) {
    case "PREDICTION_RESOLVED":
      return <Trophy className="h-4 w-4 text-accent" />;
    case "NEMESIS":
      return <Swords className="h-4 w-4 text-destructive" />;
    case "PREDICTION_DUE":
      return <Target className="h-4 w-4 text-warning" />;
    case "STREAK_FREEZE":
      return <Snowflake className="h-4 w-4 text-accent" />;
    default:
      return <Bell className="h-4 w-4 text-muted-foreground" />;
  }
}

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in?next=/notifications");

  const items = await listNotifications(session.user.id, 50);
  // Mark read on view (after we've captured the unread highlighting).
  const unreadIds = new Set(items.filter((i) => !i.read).map((i) => i.id));
  await markAllRead(session.user.id);

  return (
    <div className="container max-w-2xl py-10 sm:py-14">
      <header className="hairline-b pb-6 mb-6">
        <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-2">
          Notifications
        </div>
        <h1 className="text-[32px] sm:text-[40px] leading-[1.05] font-medium tracking-tightest">
          Your signal.
        </h1>
      </header>

      {items.length === 0 ? (
        <div className="rounded-md border border-dashed border-border p-10 text-center">
          <h3 className="text-[15px] font-medium">Nothing yet.</h3>
          <p className="text-[13px] text-muted-foreground mt-1">
            Resolved predictions, rivalry moments, and streak alerts land here.
          </p>
        </div>
      ) : (
        <ul className="rounded-md border border-border bg-card overflow-hidden divide-y divide-border">
          {items.map((n) => {
            const wasUnread = unreadIds.has(n.id);
            const inner = (
              <div className={`flex items-start gap-3 px-4 py-3.5 ${wasUnread ? "bg-accent/5" : ""}`}>
                <span className="mt-0.5 shrink-0">{iconFor(n.type)}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] tracking-tight-2 font-medium">{n.title}</div>
                  {n.body && (
                    <div className="text-[13px] text-muted-foreground mt-0.5 text-pretty">
                      {n.body}
                    </div>
                  )}
                </div>
                <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                  {formatRelative(n.createdAt)}
                </span>
              </div>
            );
            return (
              <li key={n.id}>
                {n.href ? (
                  <Link href={n.href} className="block hover:bg-secondary/40 transition-colors">
                    {inner}
                  </Link>
                ) : (
                  inner
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
