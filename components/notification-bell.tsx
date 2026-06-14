import Link from "next/link";
import { Bell } from "lucide-react";
import { unreadCount } from "@/lib/notifications";

/** Server component: bell with unread badge. Links to /notifications. */
export async function NotificationBell({ userId }: { userId: string }) {
  const count = await unreadCount(userId);
  return (
    <Link
      href="/notifications"
      aria-label={count > 0 ? `${count} unread notifications` : "Notifications"}
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
    >
      <Bell className="h-4 w-4" />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 grid place-items-center rounded-full bg-accent text-accent-foreground font-mono text-[9px] font-medium tabular-nums">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
