# FWorld Repository Architecture Audit

**Audit date:** 2026-06-29 · **Mode:** read-only inspection · **No files modified.**
**Scope basis:** actual files on disk, `package.json` manifests, `pnpm-lock.yaml` installed versions, and source inspection.

---

## 1. Repository Structure

Directory tree (max depth 4; `node_modules`, `.git`, `.next`, `dist`, `.turbo`, husky internals omitted):

```text
fworld/
├── .github/
│   ├── ISSUE_TEMPLATE/ (bug_report.yml, feature_request.yml, config.yml, .gitkeep)
│   ├── workflows/ (ci.yml, codeql.yml, .gitkeep)
│   ├── CODEOWNERS
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── dependabot.yml
├── .husky/ (pre-commit, commit-msg, _/)
├── .vscode/ (extensions.json, settings.json)
├── architecture/ (README.md, .gitkeep)        ← diagrams only; none yet
├── assets/                                     ← empty (untracked)
├── backend/
│   ├── prisma/ (schema.prisma, .gitkeep)
│   ├── src/
│   │   ├── app.module.ts, main.ts
│   │   ├── config/ (configuration.ts)
│   │   ├── database/ (prisma.module.ts, prisma.service.ts)
│   │   ├── common/ config/ decorators/ events/ filters/ guards/
│   │   ├── interceptors/ jobs/ middleware/ modules/ queues/   ← all .gitkeep only
│   ├── test/ (.gitkeep)
│   ├── eslint.config.mjs, nest-cli.json, tsconfig.json, tsconfig.build.json
│   ├── package.json, README.md, .env.example
├── branding/figma/ (.gitkeep)
├── docker/ (backend.Dockerfile, frontend.Dockerfile, README.md)
├── docs/
│   ├── 000_MASTER_INSTRUCTIONS.md … 014_ROADMAP.md (15 files)
│   └── adr/ (README.md, ADR_TEMPLATE.md, ADR-0000-INDEX.md, ADR-0001-Repository-Foundation.md)
├── frontend/
│   ├── app/ (layout.tsx, page.tsx, globals.css, .gitkeep)
│   ├── lib/ (utils.ts)
│   ├── components/ config/ constants/ features/ hooks/ providers/
│   ├── public/ services/ store/ styles/ tests/ types/ utils/   ← all .gitkeep only
│   ├── components.json, next.config.mjs, postcss.config.mjs
│   ├── tsconfig.json, .eslintrc.json, package.json, README.md, .env.example
├── legal/ prompts/ research/ assets/          ← empty (untracked)
├── packages/ (README.md, .gitkeep)            ← no packages
├── scripts/ (README.md, .gitkeep)
├── docker-compose.yml
├── package.json, pnpm-workspace.yaml, pnpm-lock.yaml, turbo.json
├── tsconfig.base.json, commitlint.config.cjs
├── .gitignore, .dockerignore, .editorconfig, .npmrc, .nvmrc
├── .prettierrc.json, .prettierignore
├── README.md, LICENSE, CONTRIBUTING.md, CODE_OF_CONDUCT.md, SECURITY.md, CHANGELOG.md
```

---

## 2. Frontend

| Aspect                 | Finding                                                                                                                                                            |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Framework**          | Next.js (App Router) + React                                                                                                                                       |
| **Version**            | `next` ^15.1.3 (installed **15.5.19**); `react`/`react-dom` ^19 (installed **19.2.7**)                                                                             |
| **Routing**            | App Router (`app/`). Only routes present: `/` (`page.tsx`) and implicit `/_not-found`. No route groups, nested layouts, or handlers.                               |
| **State Management**   | Server state: **TanStack Query** ^5.62.7 (dependency present, **no `QueryClientProvider` wired**). Client state: **Zustand** ^5.0.2 (dependency present, **`store/` empty**). |
| **UI Library**         | **shadcn/ui** configured via `components.json` (style `new-york`, RSC, lucide). **No components generated** — `components/` is empty.                               |
| **Styling**            | **Tailwind CSS v4** (`tailwindcss` ^4, `@tailwindcss/postcss`). `globals.css` uses `@import 'tailwindcss'` + `@theme` tokens. `cn()` helper in `lib/utils.ts`.     |
| **Forms**              | **React Hook Form** ^7.54.2 + `@hookform/resolvers` ^3.9.1 (deps only; no forms).                                                                                  |
| **Validation**         | **Zod** ^3.24.1 (dep only).                                                                                                                                        |
| **Animation**          | **Framer Motion** ^11.15.0 (dep only).                                                                                                                             |
| **Data Fetching**      | TanStack Query (dep only); no `services/` clients implemented.                                                                                                     |
| **Folder Structure**   | All 15 mandated dirs exist. Only `app/` and `lib/` contain code; the rest are `.gitkeep` placeholders.                                                             |
| **Providers**          | **None wired** — `providers/` contains only `.gitkeep`. No theme, query, or context providers.                                                                     |
| **Build Configuration**| `next.config.mjs`: `reactStrictMode`, `poweredByHeader:false`, `outputFileTracingRoot` pinned, `output:'standalone'` gated by `BUILD_STANDALONE`, `optimizePackageImports` (lucide, framer-motion), images `avif`/`webp` + R2 `remotePatterns`. ESLint via **legacy `.eslintrc.json`** (`next/core-web-vitals` + `next/typescript`) run through `next lint`. PostCSS configured for Tailwind v4. |

---

## 3. Backend

| Aspect              | Finding                                                                                                                                  |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Framework**       | NestJS                                                                                                                                   |
| **Version**         | `@nestjs/*` ^11 (core installed **11.1.27**)                                                                                             |
| **Architecture**    | Modular monolith with DI. `main.ts` bootstrap + `AppModule` root.                                                                        |
| **Modules**         | **`AppModule` only**, importing `ConfigModule` (global) + `PrismaModule` (global). **No feature modules** — `src/modules/` is empty.     |
| **Middleware**      | None — `src/middleware/` empty.                                                                                                          |
| **Guards**          | None — `src/guards/` empty.                                                                                                              |
| **Filters**         | None — `src/filters/` empty (no global exception filter yet).                                                                            |
| **Interceptors**    | None — `src/interceptors/` empty (no response-envelope/logging interceptor).                                                             |
| **Validation**      | Global `ValidationPipe` in `main.ts` (`whitelist`, `forbidNonWhitelisted`, `transform`, implicit conversion). `class-validator`/`class-transformer` present. No DTOs yet. |
| **ORM**             | **Prisma** ^6 (installed **6.19.3**). `PrismaService` (connect/disconnect lifecycle) + global `PrismaModule`.                            |
| **Database**        | **PostgreSQL** datasource configured. **Schema has zero models** (datasource + generator only).                                         |
| **Configuration**   | `@nestjs/config` ^4 global + cached; typed `configuration()` factory (`nodeEnv, port, apiPrefix, corsOrigin, database, redis, meilisearch`). No env-schema validation. |
| **Background Jobs** | None — `src/jobs/` empty; no scheduler dep.                                                                                              |
| **Queue**           | None — `src/queues/` empty; **no BullMQ / Redis client dependency**.                                                                     |
| **API Versioning**  | Global prefix `api/v1` via `setGlobalPrefix` (not Nest URI/header versioning). **No controllers/endpoints exist.**                       |

---

## 4. Shared Packages

`packages/` contains **only** `README.md` + `.gitkeep`.

| Item                | Finding                                                                                                                          |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **Purpose**         | Documented roadmap for future workspace libraries: `@fworld/types`, `@fworld/config`, `@fworld/ui`, `@fworld/utils`.             |
| **Dependencies**    | None — no `package.json`, no code.                                                                                               |
| **Current status**  | **Not implemented.** Declared in `pnpm-workspace.yaml` (`packages/*`) and root `workspaces`, but zero actual packages. Shared TS config lives at root (`tsconfig.base.json`), not as a package. |

---

## 5. Infrastructure

| Component          | Finding                                                                                                                                 |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| **Docker**         | Two multi-stage, non-root images: `docker/backend.Dockerfile` (Nest, `pnpm deploy`), `docker/frontend.Dockerfile` (Next standalone, sets `BUILD_STANDALONE=true`). `.dockerignore` present. |
| **Docker Compose** | `docker-compose.yml`: `postgres:16-alpine`, `redis:7-alpine`, `getmeili/meilisearch:v1.12` — each with healthcheck + named volume. App containers not in compose (dev runs on host). |
| **CI/CD**          | `.github/workflows/ci.yml` on push/PR to `main` + `develop`: install → format:check → lint → typecheck → build → test. Concurrency cancellation, Node 22, pnpm cache. |
| **CodeQL**         | `codeql.yml`: `javascript-typescript`, push/PR `main`+`develop`, weekly cron.                                                           |
| **Dependabot**     | `dependabot.yml`: weekly npm (grouped prod/dev), github-actions, docker.                                                                |
| **Commitlint**     | `commitlint.config.cjs`: `config-conventional` + explicit `type-enum`; scope **free-form, enforced kebab-case** (`scope-case`); 100-char header. |
| **Husky**          | v9. `pre-commit` → `lint-staged`; `commit-msg` → `commitlint`.                                                                          |
| **Turbo**          | `turbo.json` tasks: `build` (depends `^build`), `dev` (persistent), `lint`, `typecheck`, `test`, `clean`. Caching active.               |
| **pnpm Workspace** | `pnpm-workspace.yaml` (`frontend`, `backend`, `packages/*`), `packageManager pnpm@10.30.1`, `.npmrc` (auto-install-peers, selective hoist, engine-strict). |

---

## 6. Security

| Control                   | Status         | Detail                                                                              |
| ------------------------- | -------------- | ----------------------------------------------------------------------------------- |
| **Helmet**                | ✅ Implemented | `app.use(helmet())` in `main.ts`.                                                   |
| **CORS**                  | ✅ Implemented | `enableCors` with config-driven `origin` + `credentials:true`.                      |
| **Rate Limiting**         | ❌ Absent      | No `@nestjs/throttler` or equivalent.                                               |
| **JWT**                   | ❌ Absent      | No JWT/passport/auth dependency. `.env.example` has `JWT_*` **placeholders only**.  |
| **Environment Variables** | ✅ Partial     | `@nestjs/config` + `.env.example` at root/frontend/backend. **No runtime env-schema validation.** |
| **Secrets**               | ✅ Good        | None committed; `.gitignore` blocks `.env*` except `.env.example`. Templates only.  |
| **Validation**            | ✅ Implemented | Global `ValidationPipe` (whitelist + forbidNonWhitelisted). No DTOs yet.            |
| **Input Sanitization**    | ⚠️ Minimal     | Only via validation pipe whitelisting; no dedicated sanitizer/escaping layer.       |
| **Current Status**        | **Foundational only** | Transport-level hardening present; authn/authz, rate limiting, and CSRF not yet implemented. |

---

## 7. Current Documentation

**`docs/` (all exist, substantive content by size/inspection):**

| Document                    | Exists | Status                                  |
| --------------------------- | ------ | --------------------------------------- |
| 000_MASTER_INSTRUCTIONS.md  | ✅     | Complete (Parts 1 & 2; 824 lines)       |
| 001_BRD.md                  | ✅     | Substantive (548)                       |
| 002_PRD.md                  | ✅     | Substantive (766)                       |
| 003_TRD.md                  | ✅     | Complete (834)                          |
| 004_DATABASE.md             | ✅     | Substantive (496)                       |
| 005_API.md                  | ✅     | Substantive (261)                       |
| 006_DESIGN_SYSTEM.md        | ✅     | Substantive (352)                       |
| 007_UI_UX.md                | ✅     | Substantive (446)                       |
| 008_SEO.md                  | ✅     | Substantive (258)                       |
| 009_CODING_STANDARDS.md     | ✅     | Complete (268)                          |
| 010_TESTING.md              | ✅     | Substantive (204)                       |
| 011_DEPLOYMENT.md           | ✅     | Substantive (176)                       |
| 012_ADMIN_PANEL.md          | ✅     | Substantive (208)                       |
| 013_ANALYTICS.md            | ✅     | Substantive (140)                       |
| 014_ROADMAP.md              | ✅     | Substantive (170)                       |

> "Complete/Substantive" reflects existence + size + the files read (000, 003, 009). The remaining numbered docs were not deep-read line-by-line in this audit; none are empty/placeholder.

**`docs/adr/`:**

| Document                          | Exists | Status                                  |
| --------------------------------- | ------ | --------------------------------------- |
| README.md                         | ✅     | Complete (process, lifecycle, statuses) |
| ADR_TEMPLATE.md                   | ✅     | Complete                                |
| ADR-0000-INDEX.md                 | ✅     | Complete (lists ADR-0001)               |
| ADR-0001-Repository-Foundation.md | ✅     | Complete (Accepted, 401 lines)          |

**`architecture/`:**

| Item      | Exists | Status                                                       |
| --------- | ------ | ----------------------------------------------------------- |
| README.md | ✅     | Placeholder folder — conventions only; **no diagrams yet**  |

---

## 8. Third-Party Services

| Service                              | Purpose          | Configured?                          | Placeholder?         | Production Ready?                     |
| ------------------------------------ | ---------------- | ------------------------------------ | -------------------- | ------------------------------------- |
| **PostgreSQL**                       | Primary DB       | Partial (compose + Prisma datasource)| No                   | No (local only; no models/migrations) |
| **Redis**                            | Cache / queues   | Partial (compose + config slot)      | Yes (no client dep)  | No                                    |
| **Meilisearch**                      | Search           | Partial (compose + config slot)      | Yes (no client dep)  | No                                    |
| **Cloudflare R2**                    | Object storage   | No (env + image `remotePatterns`)    | Yes                  | No (no SDK)                           |
| **Razorpay**                         | Payments         | No (`.env` placeholders)             | Yes                  | No                                    |
| **Shiprocket**                       | Shipping         | No (`.env` placeholders)             | Yes                  | No                                    |
| **Resend**                           | Email            | No (`.env` placeholders, per TRD)    | Yes                  | No                                    |
| **Sentry**                           | Monitoring       | No (`.env` DSN placeholder)          | Yes                  | No                                    |
| **Google Analytics 4 / Clarity**     | Analytics        | No (`NEXT_PUBLIC_*` placeholders)    | Yes                  | No                                    |
| **Auth provider (Better Auth, TRD §4)** | Authentication| No (only `JWT_*` env placeholders)   | Yes                  | No                                    |

> No third-party SDK is installed in any `package.json`. All integrations are **environment-template placeholders or compose services only**.

---

## 9. Build Status

| Capability    | Status | Evidence                                                                                              |
| ------------- | ------ | ----------------------------------------------------------------------------------------------------- |
| **Install**   | ✅ YES | `pnpm install` succeeded (741 pkgs; Prisma generate + Husky ran).                                      |
| **Lint**      | ✅ YES | `pnpm lint` → no ESLint warnings/errors (both apps).                                                   |
| **Typecheck** | ✅ YES | `pnpm typecheck` → 2 successful (strict TS).                                                           |
| **Test**      | ✅ YES | `pnpm test` → 2 successful — **but both are no-op echo scripts** (no real tests).                      |
| **Build**     | ✅ YES | `pnpm build` → 2 successful (Next prod build + `nest build`).                                          |
| **Run**       | ❌ NO  | Not runnable end-to-end here: backend `PrismaService` `$connect()`s on boot and needs a reachable PostgreSQL; **Docker is not installed on this machine**, so compose services can't start. |

---

## 10. Repository Decisions Already Made

All implemented and captured in **ADR-0001 (Accepted)**:

- **Monorepo** (pnpm workspaces) + **Turborepo** task orchestration
- **Next.js 15 / React 19** (App Router) frontend
- **NestJS 11** backend
- **TypeScript strict** (shared `tsconfig.base.json` with extra strict flags)
- **Prisma + PostgreSQL** (ORM + primary DB)
- **Tailwind CSS v4 + shadcn/ui** styling/UI
- **TanStack Query + Zustand** state split
- **React Hook Form + Zod** forms/validation
- **Framer Motion** animation; **lucide-react** icons
- **Helmet + CORS + global ValidationPipe**; `api/v1` global prefix
- **Docker** images + **Compose** (Postgres/Redis/Meilisearch)
- **GitHub Actions CI + CodeQL + Dependabot**
- **Husky + Commitlint + lint-staged + Prettier + EditorConfig**
- **Vercel (frontend) / Railway (backend)** hosting (documented)
- **Proprietary license**; **Redis** for cache/queues and **Meilisearch** for search (selected, not yet wired)

---

## 11. Assumptions

Made during bootstrap (not all explicitly mandated by the docs):

1. **Tailwind v4** chosen (TRD says only "Tailwind CSS").
2. **pnpm + Turborepo** as the monorepo toolchain (not specified in TRD).
3. **Node 22** runtime (`.nvmrc`), engines `>=20`.
4. **ESLint split**: backend flat config (`typescript-eslint`) vs frontend legacy `.eslintrc.json` via `next lint`.
5. **Tests stubbed** as passing no-ops pending the testing phase.
6. **`output: standalone` gated** behind `BUILD_STANDALONE` (Windows symlink limitation).
7. **`packages/`** left as a documented roadmap, not wired.
8. **Prisma schema intentionally model-free**; `prisma generate` in `postinstall`/`prebuild`.
9. **JWT-oriented auth env placeholders** added, although TRD §4 names **Better Auth**.
10. **API versioning via global prefix** (`api/v1`), not Nest's URI versioning.
11. **R2 image hostnames** added as broad wildcards (`**.r2.dev`, `**.cloudflarestorage.com`).
12. **Proprietary "All Rights Reserved" license** (not specified by docs).

---

## 12. Potential Conflicts (vs. `000_MASTER_INSTRUCTIONS.md` Parts 1 & 2, and TRD)

| #   | Mismatch                                                                                                    | Why it exists                                                       | Recommendation                                                                                  |
| --- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| 1   | **Auth approach: TRD §4 = "Better Auth"; repo has only `JWT_*` env placeholders** (ADR-0001 also references JWT). | Bootstrap added generic JWT placeholders; auth not yet decided.    | **Change neither yet — write an ADR** to settle Better Auth vs JWT before any auth code.         |
| 2   | **Testing: TRD §19 mandates Vitest/Playwright/Nest testing + 80% coverage; repo `test` scripts are no-op echoes.** | Tests deferred to the testing phase.                               | **Implementation should change** (add real harness) when the testing phase starts.              |
| 3   | **Naming conventions (Part 2): "Files kebab-case" vs ADR filenames `ADR_TEMPLATE.md`, `ADR-0000-INDEX.md`.** | ADR community naming convention was followed.                      | **Documentation should carve out an ADR-filename exception**, or rename. Low priority.          |
| 4   | **ESLint inconsistency: backend flat config vs frontend legacy `.eslintrc.json`; `next lint` deprecated (removed in Next 16).** | `next lint` was the stable path at bootstrap.                      | **Implementation should change** — migrate frontend to flat config. Soon.                       |
| 5   | **Branch strategy (Part 2): protected `main` + `develop`; only `main` exists; `develop` not created.**      | Branch protection is a GitHub setting, not a repo file. CI already triggers on `develop`. | **Ops change** — create & protect `develop`; configure real CODEOWNERS teams. Immediate.        |
| 6   | **Redundant workspace declaration:** root `package.json` `workspaces` field **and** `pnpm-workspace.yaml`.   | npm-style field left in alongside the pnpm-authoritative file.     | **Implementation may change** — drop the `workspaces` field or keep intentionally. Trivial.     |
| 7   | **TRD §21 deployment DB = "Supabase PostgreSQL (initial)"; compose/datasource use generic local Postgres.**  | Local-dev parity choice; managed provider is a deploy-time concern.| **No change now**; capture provider choice in a deployment ADR.                                  |
| 8   | **No env-schema validation**, while handbook stresses "secure by default / never trust input."               | Not yet added.                                                     | **Implementation should change** (add Zod/Joi env validation) when config grows. Soon.          |

> No conflict found on: docs being Markdown-only (✅), ADRs as source-of-truth for architecture (✅), secrets hygiene (✅), top-level folder list (matches the approved set after `figma/` was folded into `branding/`).

---

## 13. Missing Decisions (no ADR yet)

Only **ADR-0001 (Repository Foundation)** exists. No ADR has been recorded for:

- **Authentication** (Better Auth vs JWT — see conflict #1) & session strategy
- **Authorization / RBAC** (Guest/Customer/Admin roles per TRD §10)
- **Caching strategy** (Redis usage, invalidation)
- **Payments** (Razorpay integration & webhooks)
- **Shipping** (Shiprocket)
- **Email** (Resend) / transactional messaging
- **Logging & Observability** (structured logs, Sentry, audit logs per TRD §13)
- **Search** (Meilisearch indexing & sync)
- **Monitoring / Uptime** (Sentry, Uptime Robot)
- **Queues / background jobs** (BullMQ or alternative)
- **CDN & Media Processing** (R2 + image pipeline: WebP/AVIF, blur placeholders)
- **Feature flags**
- **Rate limiting** (throttling strategy)
- **API response/error envelope contract** (`{ success, message, data, errors }` per TRD §11)
- **Testing harness** (Vitest/Playwright/Nest)
- **Internationalization** (future per TRD §27)
- **Branch protection / release & versioning process**
- **Secrets management** (vault strategy beyond env templates)
- **Analytics** wiring (GA4 / Clarity / Search Console)

---

## 14. Recommendations

_(Recommendations only — no changes made.)_

### Immediate

- Create and **protect `develop`** (and `main`) in GitHub; replace placeholder **CODEOWNERS** teams with real ones.
- Record **ADR-0002: Authentication & Authorization** to resolve the Better Auth vs JWT conflict before any auth code is written.
- Decide the **API response/error envelope** contract (ADR) since it constrains every future controller.

### Soon

- Stand up the **real testing harness** (Vitest + Playwright + Nest testing) to replace no-op `test` scripts and meet TRD §19.
- Migrate **frontend ESLint to flat config** (ahead of `next lint` removal) for parity with the backend.
- Add **runtime env-schema validation** in `@nestjs/config`.
- Author ADRs for **caching, search indexing, rate limiting, logging/monitoring, queues, payments, shipping, email**.
- Introduce **Prisma models + initial migration** per `docs/004_DATABASE.md` (UUID v7, soft delete, audit fields).

### Later

- Wire **`packages/` shared libraries** (start with `@fworld/types`) once the frontend↔backend contract stabilizes.
- Decide and document **CDN/media-processing pipeline**, **feature flags**, **i18n**, and the **observability stack**.
- Populate **`architecture/`** with C4/sequence/deployment diagrams to back ADR-0001.
- Resolve minor cleanups: redundant `workspaces` field, ADR-filename naming exception.

---

_End of audit report. No application code was created or modified to produce this report._
