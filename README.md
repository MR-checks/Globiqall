# Globiqall 🌍

**The pulse of the planet.** Globiqall is a global polling platform where people create and vote on the questions that matter — politics, sports, tech, lifestyle, and everything in between. Public for the world, or private with a share code.

Built as a modern, premium, real-time web app.

---

## Stack

- **Next.js 15** (App Router, React 19, Server Components)
- **TypeScript** end-to-end
- **Tailwind CSS** + custom shadcn-style design system on **Radix primitives**
- **Auth.js v5** (NextAuth) — Email magic link + Google + GitHub + Apple
- **Prisma + SQLite** locally (one-line swap to Postgres for prod)
- **Server-Sent Events** for live vote totals (no extra infra)
- **Framer Motion** for the premium feel
- **Sonner** for toasts, **Lucide** for icons

## Run it (60 seconds, zero config)

```bash
npm install --legacy-peer-deps
npx prisma db push
npm run db:seed
npm run dev
```

Open <http://localhost:3000>. You're up. No external services required.

> **Note:** `--legacy-peer-deps` is needed during the React 19 RC peer-range transition. It's the official Next.js team recommendation.

### Sign in (local dev)

Three options light up automatically:

1. **Dev quick-login** — type any name + email, click "Sign in instantly." Disabled in production.
2. **Email magic link** — submit any email; the magic link prints in the terminal.
3. **OAuth (Google/GitHub/Apple)** — set the env vars below and the buttons appear.

### Environment variables

Copy `.env.example` → `.env` and fill what you need. Everything is optional except `AUTH_SECRET` (already set for dev) and `DATABASE_URL` (SQLite by default).

```env
AUTH_GOOGLE_ID=""        # enables Google button
AUTH_GOOGLE_SECRET=""
AUTH_GITHUB_ID=""        # enables GitHub button
AUTH_GITHUB_SECRET=""
AUTH_APPLE_ID=""         # enables Apple button
AUTH_APPLE_SECRET=""
EMAIL_SERVER_HOST=""     # SMTP for real magic links (Postmark, Resend SMTP, etc.)
```

## What's in v1

- 🌐 Global trending feed with category filters
- 🆚 Versus polls (binary) + multi-option polls (3–6 choices)
- 🔒 Public, Unlisted, or Private (share-code gated) visibility
- 📡 **Live realtime** vote updates via SSE — counts animate as the world votes
- 🌗 Dark-first design with light mode toggle, premium typography (Space Grotesk + Inter)
- 🏆 Leaderboard of most-voted polls
- 🔍 Search across polls
- 🌍 Category browsing
- 🧑‍💻 Multi-provider auth + dev quick-login

## Architecture notes

- **Realtime:** in-memory pub/sub publishes vote updates; SSE endpoint at `/api/polls/[id]/stream` streams them to clients. Single-instance ready. For multi-instance prod, swap `lib/pubsub.ts` for Redis pub/sub — interface stays the same.
- **Auth:** providers conditionally registered based on env vars in `auth.ts`. JWT session strategy + Prisma adapter for verification tokens.
- **Schema:** `prisma/schema.prisma` — User, Account, Session, Poll, PollOption, Vote, Category. Vote counters denormalized on `PollOption.voteCount` + `Poll.totalVotes` for fast reads, kept in sync via transactional `castVote`.
- **Optimistic UI:** vote button updates instantly, rolls back on error.

## Going to production

1. `DATABASE_URL` → Postgres connection string (change `provider = "postgresql"` in `prisma/schema.prisma`).
2. Generate `AUTH_SECRET=$(openssl rand -base64 33)`.
3. Set `NEXT_PUBLIC_APP_URL` to your real domain.
4. Configure OAuth credentials and SMTP.
5. `npm run build && npm start` (or deploy to Vercel — works out of the box).

## Scripts

- `npm run dev` — Next.js dev server
- `npm run build` — production build (runs `prisma generate` first)
- `npm run db:push` — push schema to DB
- `npm run db:seed` — seed categories + sample polls
- `npm run db:reset` — wipe + reseed
- `npm run db:studio` — Prisma Studio (DB GUI at <http://localhost:5555>)

---

Vote anything. Settle everything. 🌍
