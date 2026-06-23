/**
 * In-memory sliding-window rate limiter, keyed by (action + key).
 * Survives HMR via globalThis. For multi-instance prod, swap implementation
 * with Redis/Upstash, the surface API is intentionally minimal.
 */

type Bucket = { times: number[] };

const g = globalThis as unknown as {
  __globiqall_rl?: Map<string, Bucket>;
};
const buckets = (g.__globiqall_rl ??= new Map());

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterSec: number;
};

export function rateLimit(
  action: string,
  key: string,
  opts: { max: number; windowSec: number },
): RateLimitResult {
  const now = Date.now();
  const windowMs = opts.windowSec * 1000;
  const id = `${action}:${key}`;
  const b = buckets.get(id) ?? { times: [] };
  // Drop entries outside the window
  b.times = b.times.filter((t: number) => now - t < windowMs);
  if (b.times.length >= opts.max) {
    const oldest = b.times[0];
    const retryAfterMs = windowMs - (now - oldest);
    buckets.set(id, b);
    return {
      ok: false,
      remaining: 0,
      retryAfterSec: Math.max(1, Math.ceil(retryAfterMs / 1000)),
    };
  }
  b.times.push(now);
  buckets.set(id, b);
  return { ok: true, remaining: opts.max - b.times.length, retryAfterSec: 0 };
}

// Action defaults, adjust freely.
export const LIMITS = {
  vote: { max: 20, windowSec: 60 },           // 20 votes per minute per user
  createPoll: { max: 5, windowSec: 3600 },    // 5 polls per hour per user
  postComment: { max: 15, windowSec: 60 },    // 15 comments per minute per user
  updateProfile: { max: 5, windowSec: 300 },  // 5 profile saves per 5 minutes
  magicLink: { max: 5, windowSec: 3600 },     // 5 magic-link sends per hour per email
  signIn: { max: 30, windowSec: 600 },        // 30 sign-in attempts per 10 minutes
} as const;

export type ActionKey = keyof typeof LIMITS;

export function checkLimit(action: ActionKey, key: string): RateLimitResult {
  return rateLimit(action, key, LIMITS[action]);
}

export function tooFastMessage(action: ActionKey, retryAfterSec: number): string {
  const verb =
    action === "vote"
      ? "Voting too fast"
      : action === "createPoll"
        ? "Slow down, too many polls"
        : action === "postComment"
          ? "Whoa, slow your comments"
          : action === "magicLink"
            ? "Too many sign-in links sent"
            : action === "signIn"
              ? "Too many sign-in attempts"
              : "Too many updates";
  const wait =
    retryAfterSec < 60
      ? `${retryAfterSec}s`
      : `${Math.ceil(retryAfterSec / 60)}m`;
  return `${verb}. Try again in ${wait}.`;
}
