# Deploying Globiqall

Target: **Vercel** (app) + **Supabase Postgres** (database). Reputation-only, no money.

## 0. One-time switches before first deploy

### Prisma → Postgres
`prisma/schema.prisma` ships on SQLite for local dev. For production, change the
datasource block to:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")   // pooled (PgBouncer, port 6543)
  directUrl = env("DIRECT_URL")     // direct (port 5432) — migrations only
}
```

Then create the schema in Supabase:

```bash
npx prisma db push          # or: prisma migrate deploy (if using migrations)
npm run db:seed             # seed categories + sample content
```

## 1. Environment variables (Vercel project settings)

Required:
```
AUTH_SECRET                 # openssl rand -base64 33
DATABASE_URL                # Supabase pooled: ...@host:6543/postgres?pgbouncer=true&connection_limit=1
DIRECT_URL                  # Supabase direct: ...@host:5432/postgres
NEXT_PUBLIC_APP_URL         # https://globiqall.app  (your domain)
DROPS_REFRESH_SECRET        # openssl rand -base64 24
PREDICTIONS_SWEEP_SECRET    # openssl rand -base64 24
```

Recommended (features degrade gracefully if unset):
```
# OAuth
AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET
AUTH_GITHUB_ID / AUTH_GITHUB_SECRET
AUTH_APPLE_ID  / AUTH_APPLE_SECRET
# Email (magic links + prediction-resolved emails)
EMAIL_SERVER_HOST / EMAIL_SERVER_PORT / EMAIL_SERVER_USER / EMAIL_SERVER_PASSWORD / EMAIL_FROM
# Error tracking
NEXT_PUBLIC_SENTRY_DSN / SENTRY_ORG / SENTRY_PROJECT / SENTRY_AUTH_TOKEN
# Analytics (consent-gated)
NEXT_PUBLIC_POSTHOG_KEY / NEXT_PUBLIC_POSTHOG_HOST
```

## 2. Deploy

```bash
vercel link          # link to the Vercel project
vercel deploy --prod # build + ship
```

The build runs `prisma generate && next build` (see package.json).

## 3. Cron jobs (GitHub Actions — already in .github/workflows)

Set repo **Secrets**: `DROPS_REFRESH_SECRET`, `PREDICTIONS_SWEEP_SECRET`.
Set repo **Variables**: `APP_URL` = your production URL.

- `drops-refresh.yml` — every 4h, refreshes the Drops feed.
- `predictions-sweep.yml` — hourly, nudges authors of due predictions + refreshes rivalry data.

(Alternatively use Vercel Cron via `vercel.ts` `crons` — pointing at the same endpoints.)

## 4. Post-deploy smoke test

- `GET /api/health` → `{ ok: true }`
- Sign in (set OAuth/SMTP or dev is disabled in prod)
- Open a prediction, resolve it, confirm the predictor gets a notification
- `POST /api/drops/refresh` and `/api/predictions/sweep` with the bearer secret

## Notes

- **Connection pooling is mandatory** on Supabase free tier — use the pooled URL
  (port 6543, `pgbouncer=true&connection_limit=1`) for `DATABASE_URL`.
- In-memory rate limiter + realtime pub/sub are single-instance. For multi-region
  scale, swap `lib/rate-limit.ts` + `lib/pubsub.ts` for Upstash Redis (same API).
- `AUTH_SECRET` must be a fresh value in production.
