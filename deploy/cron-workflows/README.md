# Cron workflows

These GitHub Actions workflows are parked here because pushing files under
`.github/workflows/` requires a token with `workflow` scope. To activate:

1. In the GitHub repo, create `.github/workflows/` and add both files via the
   web UI (Add file → Create new file), pasting the contents — OR push them
   with a `workflow`-scoped Personal Access Token.
2. Repo **Settings → Secrets and variables → Actions**:
   - Secrets: `DROPS_REFRESH_SECRET`, `PREDICTIONS_SWEEP_SECRET`
   - Variables: `APP_URL` = your production URL

- `drops-refresh.yml` — every 4h, refreshes the Drops feed.
- `predictions-sweep.yml` — hourly, nudges due predictions + refreshes rivalry data.
