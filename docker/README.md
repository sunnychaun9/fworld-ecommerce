# `docker/`

Container assets for FWorld.

| File                  | Purpose                                                     |
| --------------------- | ----------------------------------------------------------- |
| `backend.Dockerfile`  | Production image for the NestJS API (multi-stage, non-root) |
| `frontend.Dockerfile` | Production image for the Next.js app (standalone output)    |

> **Node runtime:** both images use `node:22-alpine`, which satisfies the
> required floor of **Node ≥ 22.12** (the backend loads ESM-only `better-auth`
> via `require(ESM)`, stable since 22.12). Do not downgrade the base image below
> 22.12.

Local backing services (PostgreSQL, Redis, Meilisearch) are defined in the
root `docker-compose.yml`.

```bash
# Local dev infrastructure
docker compose up -d

# Build production images (context = repo root)
docker build -f docker/backend.Dockerfile  -t fworld-backend  .
docker build -f docker/frontend.Dockerfile -t fworld-frontend .
```

> The `.dockerignore` at the repo root keeps build contexts small.
