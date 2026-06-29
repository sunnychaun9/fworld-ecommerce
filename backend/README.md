# FWorld Backend

NestJS 11 REST API for FWorld.

## Stack

- **NestJS 11** + **TypeScript** (strict)
- **Prisma 6** + **PostgreSQL**
- **Redis** (cache & queues) · **Meilisearch** (search)
- **class-validator** / **class-transformer** (DTO validation)
- **Helmet** (security headers)

## `src/` layout

| Folder          | Purpose                                         |
| --------------- | ----------------------------------------------- |
| `modules/`      | Feature modules (products, cart, orders, …)     |
| `common/`       | Shared DTOs, types, constants, utilities        |
| `config/`       | Typed configuration factory & validation        |
| `database/`     | Prisma client/module & data-access plumbing     |
| `middleware/`   | Express/Nest middleware                         |
| `guards/`       | AuthN/AuthZ guards                              |
| `interceptors/` | Response shaping, logging, caching interceptors |
| `filters/`      | Global exception filters                        |
| `decorators/`   | Custom parameter/method decorators              |
| `events/`       | Domain events & handlers                        |
| `jobs/`         | Scheduled/cron jobs                             |
| `queues/`       | Background queue processors (BullMQ)            |

## Scripts

```bash
pnpm --filter @fworld/backend dev             # watch-mode dev server on :4000
pnpm --filter @fworld/backend build           # prisma generate + nest build
pnpm --filter @fworld/backend lint            # eslint
pnpm --filter @fworld/backend typecheck       # tsc --noEmit
pnpm --filter @fworld/backend prisma:migrate  # run a dev migration
```

## API conventions

- Versioned under `/api/v1` (TRD §11).
- Uniform response envelope: `{ success, message, data, errors }`.
- Global validation pipe with `whitelist` + `forbidNonWhitelisted`.
