# `docker/`

Container assets for FWorld.

| File                  | Purpose                                                     |
| --------------------- | ----------------------------------------------------------- |
| `backend.Dockerfile`  | Production image for the NestJS API (multi-stage, non-root) |
| `frontend.Dockerfile` | Production image for the Next.js app (standalone output)    |

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
