# Globiqall — Project Handoff

> Single source of truth for picking this project back up in a fresh session.
> Read this first, then skim the code — most things are derivable, but the
> deployment coordinates, decisions, and "what's left" below are not in the code.

Last updated: 2026-06-15 · Status: **LIVE in production**

---

## 1. What this is & the goal

**Globiqall is the world's free arena for taking sides and calling outcomes — where the currency is a public track record of being right, never money.**

It started as a generic polling site and pivoted into a **social prediction + debate game**. The north star: be fun, addictive, identity-driven, and global — the thing humans can't resist (predicting + being proven right + status), but free and legal (no gambling, no KYC, no real money).

The market thesis (validated by research during the build): prediction markets are exploding (Kalshi/Polymarket did hundreds of $B in 2025) but they're all real-money, finance-coded, regulated, and narrow. Nobody owns the **free, global, about-everything, reputation-only** version. That's the white space Globiqall targets.

**Two engines, one reputation spine:**
- **Debate mode** — subjective polls, never resolve, scored by conviction-weighted backers ("which side are you on?").
- **Prediction mode** — objective, locks at a deadline, resolves against reality, correct calls compound reputation.

Both feed one **Reputation** number + a trophy case. That's what makes it legal (no money), addictive (status), and defensible (your track record can't be ported elsewhere).

**Locked principles:**
- **Reputation-only, money-separable.** No real-money wagering. `lib/predictions.ts` carries an explicit boundary comment: a future regulated money mode must live in a PARALLEL module and never import/mutate prediction logic. Do NOT add money plumbing.
- **Depth-first.** Make each loop genuinely satisfying before layering the next.

---

## 2. Current status — LIVE

- **Production:** https://globiqall.vercel.app
- **Repo:** https://github.com/MR-checks/Globiqall (default branch `main`; pushing to `main` auto-deploys via the connected Vercel integration)
- **DB:** Supabase Postgres, project `globiqall` (ref `xnctluyexmovckjyhbdf`, us-east-1). Schema + 10 categories + system user are seeded.
- Smoke-tested live: `/api/health` returns `{ok:true}` (DB reachable), homepage + all routes 200, security headers enforced, Drops feed populated with ~200 real items.

---

## 3. Tech stack

- **Next.js 15** (App Router, React 19, Server Components, Server Actions), TypeScript
- **Prisma + Postgres** (Supabase in prod). NOTE: schema is `provider = "postgresql"` with `directUrl`. Local dev now also needs a Postgres `DATABASE_URL` (use the Supabase one or a local PG).
- **Auth.js v5** (NextAuth) — email magic link + Google/GitHub/Apple, conditionally enabled by env. Dev quick-login disabled in prod.
- **Tailwind** + custom shadcn-style primitives on Radix
- **SSE** for realtime vote/result updates (in-memory pub/sub — `lib/pubsub.ts`)
- **Sentry** (error tracking), **PostHog** (consent-gated analytics) — both no-op without env keys
- **next/og** for the dynamic share-card image
- Design language: **"Pulse"** — data-terminal aesthetic, Geist + Geist Mono, big mono numerals, deep-blue accent (`--accent`), hairline borders, subtle dark-mode blue gradient. No emoji in chrome (emoji only in user content). Two font weights (400/500). Sentence case.

---

## 4. Feature inventory (all built & verified)

**Core**
- Polls: BINARY (versus) + MULTI; PUBLIC / UNLISTED / PRIVATE (share-code gated); categories; search; trending feed with HN-style time-decay + "rising" flag.
- Realtime vote bars via SSE; optimistic voting; live world-split.
- Comments (1-level threads, soft-delete, edit/delete own).
- Profiles `/u/[username]`, settings (`/settings/profile`, `/settings/account` with data export + account delete).
- Country breakdown + SVG world heatmap per poll (geo from edge headers).
- Drops `/drops` — free trend collectors (Reddit RSS, HN, Product Hunt, Google News) → anticipation filter → "open a poll" prefill. Cron endpoint `/api/drops/refresh`.

**Prediction engine** (the spine)
- `mode=PREDICTION`: `lockAt` (no switching after), `resolvesAt`, conviction (Low/Med/High = 1/2/3).
- Resolution: author/admin marks outcome + source URL → scores every pick. Reward = `10 × conviction × difficulty` where difficulty rewards being right against the crowd; wrong high-conviction stings. Updates reputation + accuracy + prediction streak.
- `/predictions` hub (open / locked / resolved). Track record on profile.

**Magic moves**
- **The Receipt** — dynamic OG PNG "I called it" verified share card (`/api/og/receipt`, page `/receipt/[slug]?u=`). Stamps trophy tier.
- **The Daily Call** `/daily` — one global prediction/day, Wordle-style participation streak + share, **streak-freeze** (burns a freeze on a missed day; granted every 7-day milestone).
- **Tribes** — emergent identity from vote-similarity (raw SQL): allies, nemesis, contrarian index, derived tribe name. On profile.
- **Arenas** `/arenas`, `/arena/[slug]` — time-boxed event hubs (predictions belong to an arena), arena leaderboard, spawn-from-Drop helper.
- **Leagues** `/leagues` — weekly points → Bronze→Diamond tiers, weekly table, lazy week reset.
- **Trophy tiers** — correct calls mint Bronze→Diamond by difficulty; trophy case on profile; tier shown on resolved predictions + receipt.
- **Notifications** — in-app bell + `/notifications` + email (resolved predictions), opt-out toggle. **Nemesis active loop** (rival callouts on resolution). Sweep endpoint `/api/predictions/sweep` nudges authors of due predictions + refreshes nemesis.

**Hardening / ops**
- Rate limiting (`lib/rate-limit.ts`, in-memory) on vote/create/comment/profile/auth.
- Content moderation guard (`lib/moderation.ts`).
- Security headers + CSP via `middleware.ts` (prod-tight; dev relaxes for HMR — this was a real bug fix, don't re-tighten dev).
- Legal: `/legal/privacy`, `/legal/terms`, `/legal/cookies`; cookie consent banner; account delete + data export (GDPR/CCPA basics).
- Health probe `/api/health`.

---

## 5. Architecture map

```
app/                    Pages (RSC by default) + route handlers
  p/[slug]/             Poll/prediction detail (vote, resolve panel, comments, country, receipt link)
  predictions/ daily/ arenas/ arena/[slug]/ leagues/ drops/ explore/ leaderboard/
  u/[username]/         Profile (rep, track record, trophy case, tribe, league badge)
  notifications/ settings/ legal/ receipt/[slug]/
  api/                  health, og/receipt, drops/refresh, predictions/sweep, polls/[id]/stream (SSE), auth
  actions.ts            createPoll, voteAction, resolvePollAction
  actions/              comments, profile, account, notifications
lib/
  predictions.ts        state machine, resolve + scoring, listing queries  (MONEY-SEPARABLE boundary)
  daily.ts leagues.ts trophies.ts tribes.ts arenas.ts   (game systems)
  notifications.ts email.ts                              (retention loop)
  drops/                sources.ts (collectors), filter.ts, refresh.ts, queries.ts
  reputation.ts rate-limit.ts moderation.ts geo.ts pubsub.ts access.ts countries.ts category-colors.ts utils.ts db.ts
components/             UI (poll-vote, create-poll-form, notification-bell, tribe-card, etc.)
prisma/schema.prisma    Postgres schema (provider=postgresql, directUrl)
middleware.ts           security headers / CSP
deploy/cron-workflows/  PARKED GitHub Actions cron files (see §7)
DEPLOY.md               deploy runbook (has the cron secret values locally — gitignored if you move them)
```

Auto-memory at `~/.claude/.../memory/` holds: strategic pivot, deployment coordinates, commit identity. These load into new sessions automatically.

---

## 6. Conventions

- **Commit author (ALL projects, permanent):** `MR-checks` / `mistachecks@gmail.com`.
  Use `git -c user.name="MR-checks" -c user.email="mistachecks@gmail.com" commit …`.
  End commit messages with `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- Only commit/push when asked. `main` is the production branch (auto-deploys).
- **Verify visible changes** with the preview tools (preview_start/screenshot), not by asking the user to check. Run `npx tsc --noEmit` + `npm run build` before claiming done.
- **Don't run `npm run build` while the dev server is live** — it clobbers `.next` and causes ChunkLoadError. Stop the dev server or `rm -rf .next` after.

---

## 7. What's LEFT to do (prioritized)

**Immediate (post-deploy housekeeping):**
1. **Rotate the Vercel deploy token** — it was used once for the first deploy; delete it at vercel.com/account/tokens. Future deploys go through the GitHub→Vercel auto-deploy (push to `main`).
2. **Activate crons.** The two workflows are parked in `deploy/cron-workflows/` because the git token lacked `workflow` scope. To turn on: add both `.yml` under `.github/workflows/` (GitHub UI or a workflow-scoped push), then set repo **Actions Secrets** `DROPS_REFRESH_SECRET` + `PREDICTIONS_SWEEP_SECRET` (values are in Vercel env / were generated this session) and **Variable** `APP_URL=https://globiqall.vercel.app`. Until then, the endpoints can be hit manually with the bearer secret.
3. **Enable real sign-in.** Dev quick-login is off in prod. Add OAuth creds (Google/GitHub/Apple) and/or `EMAIL_SERVER_*` (SMTP for magic links + resolved-prediction emails) to Vercel env. Without these, nobody can log in.

**Launch quality (the "test & harden after deployment" pass the user planned):**
4. Seed real starter content in prod: a live Daily Call, 1–2 Arenas, a handful of genuine open predictions. Make an admin user (`User.isAdmin = true`) so resolution works.
5. Harden under real traffic: confirm auth-endpoint rate limits, watch Sentry, consider swapping in-memory `rate-limit.ts` + `pubsub.ts` for Upstash Redis once multi-instance (interfaces are drop-in).
6. Custom domain (globiqall.app) when ready — add in Vercel, update `NEXT_PUBLIC_APP_URL`.

**Magic-move backlog (planned, not yet built):**
7. Automated oracle resolution per category (sports scores / crypto prices / election APIs) so predictions self-resolve where structured data exists.
8. Web push notifications (PWA service worker + VAPID) — currently in-app + email only.
9. Auto-spawn Arenas from Drops on a schedule (helper exists: `lib/arenas.ts spawnArenaFromDrop`).
10. Rivalry depth (head-to-head history page), monetization later (Pro, private/sponsored arenas, cosmetics) — kept clean, no money in core.

---

## 8. Operational notes / gotchas

- **In-memory state is single-instance:** `lib/rate-limit.ts` (rate limits) + `lib/pubsub.ts` (SSE fan-out). Fine for launch on one region; swap for Redis when scaling out.
- **Schema changes in prod:** edit `schema.prisma` → `npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script` (or diff against current) → apply the SQL via the Supabase connector's `apply_migration` (we don't use Prisma migrate history) → redeploy.
- **Prisma + Supabase pooler:** runtime uses pooled URL (port 6543, `pgbouncer=true&connection_limit=1`); `DIRECT_URL` on 5432 for migrations.
- **Raw SQL must use quoted identifiers** (`"Vote"`, `"userId"`) — Postgres is case-sensitive; this was fixed for tribes/arenas queries.
- **Geo** needs edge headers (Vercel injects `x-vercel-ip-country`); falls back to "Unattributed".
- `.env`, `dev.db`, `.next`, `.vercel` are gitignored — keep secrets out of commits.

---

## 9. Quick reference

```bash
# Local dev (needs a Postgres DATABASE_URL in .env)
npm run dev

# Verify
npx tsc --noEmit && npm run build

# Deploy (or just push to main)
VERCEL_TOKEN=… vercel deploy --prod --scope mrchecks-projects

# Manual cron (until GitHub Actions are activated)
curl -X POST -H "Authorization: Bearer <DROPS_REFRESH_SECRET>"  https://globiqall.vercel.app/api/drops/refresh
curl -X POST -H "Authorization: Bearer <PREDICTIONS_SWEEP_SECRET>" https://globiqall.vercel.app/api/predictions/sweep
```
