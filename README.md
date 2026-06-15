# GlobiQall

**The world's free arena for taking sides and calling outcomes** — where the only currency is a public track record of being right, never money.

🔗 **Live:** [globiqall.vercel.app](https://globiqall.vercel.app)

---

GlobiQall turns the things humans can't resist — predicting, debating, and being proven right — into a free, global, reputation-only game. No gambling, no KYC, no real money. Two engines feed one reputation spine:

- **Debate** — subjective polls that never resolve. Pick a side, back it with conviction, watch the world split.
- **Prediction** — objective calls that lock at a deadline and resolve against reality. Get it right early, against the crowd, and your reputation compounds.

One number. One trophy case. A track record that's yours.

## What's inside

- **Prediction engine** — conviction-weighted calls, deadline locks, author/admin resolution with a public source, crowd-difficulty scoring.
- **The Daily Call** — one global prediction a day, Wordle-style streaks + streak freezes.
- **Arenas** — time-boxed event hubs (elections, finals, awards) with their own leaderboards.
- **Leagues** — weekly points, Bronze → Diamond tiers.
- **Trophies & Tribes** — earned hardware for correct calls; emergent identity from who you vote like (and against).
- **The Receipt** — a verifiable "I called it" share card.
- **Drops** — a live feed of what the world's about to argue about, pulled from open web signals.
- **Realtime** — live vote bars and world splits over SSE, plus a per-poll country heatmap.

## Stack

- **Next.js 15** (App Router, React 19, Server Components & Actions) · TypeScript
- **Prisma + Postgres** (Supabase in production)
- **Auth.js v5** — email magic links + GitHub / Google / Apple
- **Tailwind CSS** + shadcn-style primitives on Radix · the "Pulse" data-terminal design language
- **Server-Sent Events** for realtime · **next/og** for share cards
- **Sentry** + **PostHog** (both no-op without keys)

## Run it locally

```bash
npm install --legacy-peer-deps
npx prisma db push   # sync schema to your database
npm run dev
```

Needs a Postgres `DATABASE_URL` in `.env` (see [`.env.example`](.env.example)) — point it at a local Postgres or a Supabase instance. Auth, analytics, and error tracking are all optional and light up automatically when their env vars are set; without SMTP, magic links print to the terminal.

---

_Reputation-only by design. No real-money wagering — that boundary is enforced in the code, not just the docs._
