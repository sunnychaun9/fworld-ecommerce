# Deployment

FWorld backend (NestJS + Prisma + PostgreSQL + Redis). Supports **development**,
**staging**, and **production** via `NODE_ENV`.

## Local setup

```bash
pnpm install
docker compose up -d                 # postgres, redis (+ dev services)
cp backend/.env.example backend/.env # then edit
pnpm --filter @fworld/backend prisma:migrate
pnpm --filter @fworld/backend dev     # http://localhost:4000
```

- API docs (Swagger UI): `http://localhost:4000/api/docs`
- Health: `http://localhost:4000/health`

## Production deployment (Docker)

The production image is a multi-stage build (`Dockerfile.production`, context = repo root).

```bash
# 1. Configure
cp .env.production.example .env.production   # fill in real secrets

# 2. Build + start backend, postgres, redis
docker compose -f docker-compose.production.yml --env-file .env.production up -d --build

# 3. Apply migrations once (prisma CLI ships in the image)
docker compose -f docker-compose.production.yml --env-file .env.production \
  run --rm backend node node_modules/prisma/build/index.js migrate deploy
```

Build the image alone:

```bash
docker build -f Dockerfile.production -t fworld-backend:prod .
```

### Environments

| NODE_ENV     | Notes                                                                 |
| ------------ | --------------------------------------------------------------------- |
| development  | Dev placeholder auth secret allowed; verbose logs; cache optional.    |
| staging      | Production-like; supply real secrets/DB/Redis via env.                |
| production   | Config validation enforces `DATABASE_URL` and a strong `BETTER_AUTH_SECRET`; stack traces hidden. |

## Zero-downtime notes

- The container exposes `GET /health/live` (liveness) and `GET /health/ready`
  (readiness — 503 until PostgreSQL is reachable). Wire these to your
  orchestrator. The image also declares a Docker `HEALTHCHECK`.
- Graceful shutdown is enabled (`enableShutdownHooks`); the process drains on
  `SIGTERM`/`SIGINT`.

See [environment.md](./environment.md) for variables and [operations.md](./operations.md)
for backups, Redis, PostgreSQL and scheduled jobs.
