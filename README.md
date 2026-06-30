<div align="center">

# FWorld

**Premium Indian D2C Fashion — Enterprise Ecommerce Platform**

[![CI](https://github.com/fworld/fworld/actions/workflows/ci.yml/badge.svg)](https://github.com/fworld/fworld/actions/workflows/ci.yml)
![Node](https://img.shields.io/badge/node-%3E%3D20-339933?logo=node.js&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-workspace-F69220?logo=pnpm&logoColor=white)
![License](https://img.shields.io/badge/license-Proprietary-red)

</div>

> **Status:** Repository foundation. The app skeleton, tooling, and CI are in
> place. Business features (catalog, cart, checkout, payments, …) are built in
> subsequent phases per the documents in [`docs/`](./docs).

---

## Monorepo layout

```
fworld/
├── frontend/      # Next.js 15 storefront (App Router, React 19, Tailwind v4)
├── backend/       # NestJS 11 REST API (Prisma + PostgreSQL)
├── packages/      # Shared workspace libraries (types, config, ui, utils)
├── docker/        # Production Dockerfiles
├── scripts/       # Repo automation & DX scripts
├── docs/          # BRD, PRD, TRD, ADRs, design system, standards, roadmap
├── architecture/  # System, sequence, infrastructure & C4 diagrams
├── branding/      # Brand assets
├── assets/        # Static/source assets
├── research/      # Market & UX research
├── legal/         # Policies & legal docs
├── prompts/       # AI prompt library
└── .github/       # CI/CD, issue/PR templates, CODEOWNERS, Dependabot
```

## Technology stack

| Layer          | Technology                                                                       |
| -------------- | -------------------------------------------------------------------------------- |
| **Frontend**   | Next.js 15 · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui · Framer Motion |
| **State/Data** | TanStack Query · Zustand · React Hook Form · Zod                                 |
| **Backend**    | NestJS 11 · TypeScript · Prisma · class-validator                                |
| **Data**       | PostgreSQL · Redis · Meilisearch                                                 |
| **Storage**    | Cloudflare R2 (S3-compatible)                                                    |
| **Payments**   | Razorpay · **Shipping** Shiprocket                                               |
| **Infra/CI**   | Docker · GitHub Actions · Turborepo · pnpm                                       |
| **Quality**    | ESLint · Prettier · Husky · lint-staged · Commitlint                             |
| **Hosting**    | Frontend → Vercel · Backend → Railway                                            |

See [`docs/003_TRD.md`](./docs/003_TRD.md) for the full technical architecture.

## Prerequisites

- **Node.js** ≥ 22.12 (required — the backend loads ESM-only `better-auth` via
  `require(ESM)`, stable since Node 22.12; see [`.nvmrc`](./.nvmrc))
- **pnpm** ≥ 9 (`corepack enable`)
- **Docker** (for local PostgreSQL / Redis / Meilisearch)

## Getting started

```bash
# 1. Install dependencies (whole workspace)
pnpm install

# 2. Configure environment
cp .env.example .env

# 3. Start backing services (PostgreSQL, Redis, Meilisearch)
docker compose up -d

# 4. Run everything in dev (Turborepo orchestrates both apps)
pnpm dev
```

| App      | URL                          |
| -------- | ---------------------------- |
| Frontend | http://localhost:3000        |
| Backend  | http://localhost:4000/api/v1 |

## Common scripts

| Command          | Description                         |
| ---------------- | ----------------------------------- |
| `pnpm dev`       | Run all apps in watch mode (Turbo)  |
| `pnpm build`     | Production build of every workspace |
| `pnpm lint`      | Lint every workspace                |
| `pnpm typecheck` | Type-check every workspace          |
| `pnpm test`      | Run the test suites                 |
| `pnpm format`    | Format the repository with Prettier |

Target a single workspace with pnpm filters, e.g.
`pnpm --filter @fworld/frontend dev`.

## Contributing

Read [CONTRIBUTING.md](./CONTRIBUTING.md). Commits follow
[Conventional Commits](https://www.conventionalcommits.org/) (enforced by
Commitlint) and are formatted/linted via Husky pre-commit hooks.

## Documentation

The [`docs/`](./docs) directory is the source of truth — BRD, PRD, TRD,
database design, API spec, design system, coding standards, testing,
deployment, analytics, and roadmap.

Architecture decisions are recorded as ADRs in
[`docs/adr/`](./docs/adr/) — start with the
[ADR index](./docs/adr/ADR-0000-INDEX.md). System diagrams live in
[`architecture/`](./architecture). The design-token foundation is specified in
[`docs/design-foundation/`](./docs/design-foundation/), the business-capability
model in [`docs/business-architecture/`](./docs/business-architecture/), the
database blueprint in [`docs/database-blueprint/`](./docs/database-blueprint/),
the API & backend contract in [`docs/api-architecture/`](./docs/api-architecture/),
and the authentication design review in
[`docs/auth-architecture/`](./docs/auth-architecture/).

## License

Proprietary — see [LICENSE](./LICENSE). © 2026 FWorld. All rights reserved.
