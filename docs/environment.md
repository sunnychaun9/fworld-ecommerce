# Environment variables

All variables are validated at startup by `src/config/env.validation.ts` (Zod).
Invalid or missing-in-production values fail fast with a clear error. A full
template lives in [`.env.production.example`](../.env.production.example).

## Core

| Variable      | Required            | Default        | Description                                  |
| ------------- | ------------------- | -------------- | -------------------------------------------- |
| `NODE_ENV`    | no                  | `development`  | `development` \| `test` \| `staging` \| `production` |
| `PORT`        | no                  | `4000`         | HTTP port.                                   |
| `API_PREFIX`  | no                  | `api/v1`       | Global route prefix (health is excluded).    |
| `CORS_ORIGIN` | no                  | `http://localhost:3000` | Comma-separated allowed browser origins. |

## Database

| Variable       | Required             | Description                                    |
| -------------- | -------------------- | ---------------------------------------------- |
| `DATABASE_URL` | **yes (production)** | PostgreSQL connection string.                  |

## Auth (Better Auth)

| Variable              | Required             | Notes                                                     |
| --------------------- | -------------------- | --------------------------------------------------------- |
| `BETTER_AUTH_SECRET`  | **yes (production)** | ≥ 32 chars; must not be the dev placeholder in production. |
| `BETTER_AUTH_URL`     | no                   | Public base URL of the API.                               |
| `COOKIE_DOMAIN`       | no                   | Cross-subdomain session cookie domain (prod).             |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | no (both-or-neither) | Google OAuth.               |

## Rate limiting

| Variable            | Default | Description                        |
| ------------------- | ------- | ---------------------------------- |
| `RATE_LIMIT_TTL`    | `60000` | Window (ms) for the global limiter.|
| `RATE_LIMIT_LIMIT`  | `100`   | Max requests per window per IP.    |

Auth endpoints have additional Better Auth rate limiting (`AUTH_RATE_LIMIT_*`).

## Payments (Razorpay, optional)

`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` (both-or-neither), `RAZORPAY_WEBHOOK_SECRET`.

## Redis / cache / search / jobs

| Variable          | Default    | Description                                                     |
| ----------------- | ---------- | --------------------------------------------------------------- |
| `REDIS_HOST`      | –          | Enables the cache when set (with `CACHE_ENABLED != false`).     |
| `REDIS_PORT`      | `6379`     | Redis port.                                                    |
| `REDIS_PASSWORD`  | –          | Redis auth.                                                    |
| `CACHE_ENABLED`   | –          | `false` disables caching even if Redis is configured.          |
| `SEARCH_PROVIDER` | `postgres` | Search backend (only `postgres` today).                        |
| `JOBS_ENABLED`    | `true`     | `false` disables scheduled maintenance jobs.                   |

When Redis is not configured the cache transparently falls back to the database.
