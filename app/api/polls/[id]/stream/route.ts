import { auth } from "@/auth";
import { db } from "@/lib/db";
import { subscribe, type PollUpdate } from "@/lib/pubsub";
import { pollAccessCheck } from "@/lib/access";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const url = new URL(req.url);
  const shareCode = url.searchParams.get("k");
  const session = await auth();

  const access = await pollAccessCheck({
    pollId: id,
    viewerId: session?.user?.id,
    shareCode,
  });
  if (!access) {
    return new Response("Not found", { status: 404 });
  }

  const poll = await db.poll.findUnique({
    where: { id },
    select: {
      id: true,
      totalVotes: true,
      options: { select: { id: true, voteCount: true } },
    },
  });
  if (!poll) return new Response("Not found", { status: 404 });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const send = (u: PollUpdate) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(u)}\n\n`));
        } catch {
          /* closed */
        }
      };

      // Initial snapshot
      send({
        pollId: poll.id,
        totalVotes: poll.totalVotes,
        options: poll.options,
        ts: Date.now(),
      });

      const unsub = subscribe(poll.id, send);

      // Heartbeat every 25s
      const hb = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          /* closed */
        }
      }, 25_000);

      const close = () => {
        unsub();
        clearInterval(hb);
        try {
          controller.close();
        } catch {}
      };
      // @ts-expect-error – attach for cancel handler
      controller._close = close;
    },
    cancel() {
      // @ts-expect-error – read closer
      this._close?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
