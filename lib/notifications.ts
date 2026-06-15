import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";

export type NotificationType =
  | "PREDICTION_RESOLVED"
  | "NEMESIS"
  | "PREDICTION_DUE"
  | "STREAK_FREEZE"
  | "GENERIC";

type NotifyInput = {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  href?: string;
  pollId?: string;
  actorId?: string;
  /** Also send an email if the user opted in and SMTP is configured. */
  email?: boolean;
};

/** Create an in-app notification (and optionally email). Best-effort. */
export async function notify(input: NotifyInput): Promise<void> {
  try {
    await db.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body ?? null,
        href: input.href ?? null,
        pollId: input.pollId ?? null,
        actorId: input.actorId ?? null,
      },
    });
  } catch {
    /* never block the triggering action on notification failure */
  }

  if (input.email) {
    try {
      const user = await db.user.findUnique({
        where: { id: input.userId },
        select: { email: true, emailNotifications: true },
      });
      if (user?.email && user.emailNotifications) {
        const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://globiqall.com";
        const link = input.href ? `${base}${input.href}` : base;
        await sendEmail({
          to: user.email,
          subject: input.title,
          text: `${input.body ?? input.title}\n\n${link}`,
          html: `<p>${input.body ?? input.title}</p><p><a href="${link}">Open GlobiQall</a></p>`,
        });
      }
    } catch {
      /* ignore email failures */
    }
  }
}

export async function unreadCount(userId: string): Promise<number> {
  return db.notification.count({ where: { userId, read: false } });
}

export async function listNotifications(userId: string, limit = 40) {
  return db.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function markAllRead(userId: string): Promise<void> {
  await db.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
}
