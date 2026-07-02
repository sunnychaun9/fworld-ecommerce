# Operations

Runbook for the FWorld backend in staging/production.

## PostgreSQL

- **Migrations:** applied with Prisma. In a container:
  ```bash
  node node_modules/prisma/build/index.js migrate deploy
  ```
  Never run `migrate dev` against production (it can reset/prompt).
- **Backups:** logical dumps via `pg_dump`, scheduled (e.g. cron/managed service):
  ```bash
  pg_dump "$DATABASE_URL" -Fc -f fworld-$(date +%F).dump      # backup
  pg_restore --clean --if-exists -d "$DATABASE_URL" fworld.dump # restore
  ```
  Keep encrypted, off-host copies; test restores regularly.
- **Connections:** one Prisma pool per instance; size the DB `max_connections`
  for the number of backend replicas.

## Redis

- Used only as a **cache** (read-through with TTLs). It is **not** a source of
  truth — flushing it is safe; the app repopulates from PostgreSQL.
- Enabled by `REDIS_HOST` (+ `CACHE_ENABLED != false`). If Redis is down the app
  keeps serving from the database (degraded, not failed).
- TTLs: home 5 min, product/collections 10 min, categories 5 min, dashboard 2 min.
- Writes to products/categories/collections/inventory/orders invalidate the
  relevant namespaces automatically.
- Persistence: `--appendonly yes` (see compose). Health shows Redis as
  `up`/`down`/`disabled`.

## Scheduled jobs

Run in-process via NestJS Schedule (no external queue). Controlled by `JOBS_ENABLED`:

| Job                              | Schedule        | Action                                            |
| -------------------------------- | --------------- | ------------------------------------------------- |
| cleanup expired coupons          | daily 00:00     | Delete coupons past `validTo`.                    |
| cleanup expired notifications    | daily 01:00     | Delete soft-deleted / read notifications > 30d.   |
| recompute recommendation caches  | hourly          | Clear product/home caches so recos refresh.       |
| cleanup abandoned carts          | daily 02:00     | Delete carts inactive > 30 days.                  |
| delete expired pending payments  | hourly          | Delete `PENDING` payments older than 24h.         |

With multiple replicas, run jobs on a single instance (set `JOBS_ENABLED=false`
on the others) to avoid duplicate work.

## Health & monitoring

- `GET /health` — full report: `{ status, checks: { database, redis, memory }, version, uptime }`.
- `GET /health/live` — liveness (process up).
- `GET /health/ready` — readiness (200 ready / 503 when the DB is unreachable).

Scrape `/health` for dashboards; wire `/health/live` and `/health/ready` to the
orchestrator. Health probes are exempt from rate limiting.

## Logging & errors

- 5xx errors are logged with stack traces server-side; responses never leak
  stack traces (hidden entirely in production).
- Startup logs the version, environment, port and docs URL. A fatal bootstrap
  error logs and exits non-zero.
