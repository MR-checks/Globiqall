// In-memory pub/sub for realtime poll updates.
// Survives across HMR reloads in dev via globalThis. For multi-instance prod,
// swap the channel layer for Redis pub/sub, interface stays the same.

type PollUpdate = {
  pollId: string;
  totalVotes: number;
  options: { id: string; voteCount: number }[];
  ts: number;
};

type Listener = (u: PollUpdate) => void;

const g = globalThis as unknown as {
  __globiqall_pubsub?: Map<string, Set<Listener>>;
};
const channels = (g.__globiqall_pubsub ??= new Map());

export function subscribe(pollId: string, listener: Listener): () => void {
  const set = channels.get(pollId) ?? new Set<Listener>();
  set.add(listener);
  channels.set(pollId, set);
  return () => {
    set.delete(listener);
    if (set.size === 0) channels.delete(pollId);
  };
}

export function publish(pollId: string, update: Omit<PollUpdate, "pollId" | "ts">) {
  const set = channels.get(pollId);
  if (!set) return;
  const payload: PollUpdate = { ...update, pollId, ts: Date.now() };
  for (const l of set) {
    try {
      l(payload);
    } catch {
      /* ignore broken listener */
    }
  }
}

export type { PollUpdate };
