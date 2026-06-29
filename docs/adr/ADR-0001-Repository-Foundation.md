# ADR-0001: Repository Foundation

- **Status:** Accepted
- **Date:** 2026-06-29
- **Deciders:** CTO Office, Lead Software Architect
- **Supersedes:** —
- **Superseded by:** —

---

## Context

FWorld is a greenfield premium D2C fashion ecommerce platform for the Indian
market (see [Engineering Handbook](../000_MASTER_INSTRUCTIONS.md) and
[TRD](../003_TRD.md)). The platform must be fast, SEO-first, mobile-first,
secure-by-default, accessible, and scalable to ~1M users / 100k products /
10k orders per day without an architectural rewrite, while remaining easy for a
small team (and AI coding agents) to maintain.

Before any feature work, we must commit to the foundational technology stack
and repository structure, because these choices are expensive to reverse once
business code is built on top of them. This ADR records those decisions and the
reasoning behind them. It documents the stack already scaffolded in the
repository foundation; it does **not** introduce or change application code.

## Problem

Which repository topology, languages, frameworks, data stores, infrastructure,
and tooling should FWorld standardize on for v1, such that we satisfy the
handbook's priorities — **long-term maintainability first**, then ecosystem
maturity, performance, developer experience, community, documentation, upgrade
path, and vendor stability — and avoid premature lock-in to choices that would
block the documented future roadmap?

## Decision

We will build FWorld as a **single pnpm + Turborepo monorepo** containing a
**Next.js 15** frontend and a **NestJS 11** backend, both in **strict
TypeScript**, persisting to **PostgreSQL via Prisma**, with **Redis** for
cache/queues, **Meilisearch** for search, **Cloudflare R2** for object storage,
**Razorpay** for payments and **Shiprocket** for shipping. The frontend deploys
to **Vercel**, the backend to **Railway**, both containerizable via **Docker**,
with **GitHub Actions** for CI/CD. The frontend UI is built with **Tailwind CSS
+ shadcn/ui**, **TanStack Query** for server state, and **Zustand** for client
state.

The per-technology rationale, alternatives, trade-offs, and migration paths are
documented below.

---

### 1. Monorepo using pnpm

- **Why selected:** Frontend and backend share a type contract (API
  request/response shapes), tooling, and release cadence. A monorepo keeps them
  version-locked and atomically reviewable, and lets shared `packages/*` evolve
  without publishing to a registry. **pnpm** uses a content-addressed global
  store (fast installs, minimal disk) and a strict, non-flat `node_modules` that
  prevents phantom dependencies — directly serving "every dependency must
  justify its existence."
- **Alternatives considered:** _npm/yarn workspaces_ (slower, looser hoisting,
  phantom-dependency risk); _polyrepo_ (two separate repos — drifts type
  contracts, doubles CI/release overhead, no atomic cross-cutting changes);
  _Nx integrated monorepo_ (more powerful but heavier mental model and more
  opinionated than a small team needs initially).
- **Trade-offs:** pnpm's strictness occasionally requires explicit peer/hoist
  configuration (handled via `.npmrc`); some tooling assumes a flat
  `node_modules`. Monorepos need a task runner to stay fast (see Turborepo).
- **Future migration path:** Workspaces can be extracted to a polyrepo later by
  promoting a package to its own repo; pnpm → another manager is mechanical
  (lockfile regen). The `packages/*` boundary makes extraction low-friction.

### 2. Turborepo

- **Why selected:** Provides cached, parallel, topologically-ordered task
  execution (`build`, `lint`, `test`, `typecheck`) across workspaces with
  near-zero config. Local and CI runs reuse the cache, keeping the "always
  deployable" pipeline fast as the repo grows.
- **Alternatives considered:** _Nx_ (richer generators/graph, but heavier and
  more prescriptive); _plain pnpm `--filter` + scripts_ (no caching, slower CI);
  _Bazel_ (powerful, hermetic, but disproportionate complexity for a TS-only
  shop).
- **Trade-offs:** Another tool in the chain; remote caching needs setup to
  benefit CI fully. Caching correctness depends on accurate `inputs/outputs`
  declarations.
- **Future migration path:** Turborepo is config-only orchestration — it can be
  removed (fall back to pnpm scripts) or swapped for Nx without touching
  application code.

### 3. Next.js 15 (frontend framework)

- **Why selected:** The handbook mandates **SEO-as-infrastructure** and
  **performance-first**. Next.js App Router gives first-class SSR/SSG/ISR, React
  Server Components (less client JS), streaming, image optimization, and dynamic
  metadata — the core SEO/performance levers — with the largest React ecosystem
  and a clean upgrade path. Vercel (its maintainer) is our chosen host.
- **Alternatives considered:** _Remix/React Router 7_ (excellent, smaller
  ecosystem, fewer turnkey SEO/image features); _Astro_ (great for content, less
  suited to a highly interactive authenticated commerce app); _SvelteKit/Nuxt_
  (would fragment the React/TS skill set); _plain Vite SPA_ (poor SEO, no SSR).
- **Trade-offs:** Framework gravity and some Vercel-leaning defaults; App Router
  has a learning curve; rapid release cadence requires disciplined upgrades.
- **Future migration path:** Standard React + TS components port to Remix/Vite
  with effort concentrated in routing/data-loading. `output: standalone` keeps
  us host-portable (Docker), reducing Vercel lock-in.

### 4. NestJS 11 (backend framework)

- **Why selected:** Opinionated, modular architecture (modules, providers, DI,
  guards, interceptors, filters, pipes) that maps cleanly onto the TRD's
  module-per-domain design and enforces consistency across many contributors and
  AI agents. First-class TypeScript, validation, config, and testing support.
- **Alternatives considered:** _Express/Fastify alone_ (minimal, but every team
  reinvents structure — poor consistency at scale); _AdonisJS_ (smaller
  ecosystem); _tRPC-only_ (couples client and server too tightly for a platform
  that must also serve mobile apps and third parties); _Go/Java microservices_
  (fragment the TS skill set; premature for v1).
- **Trade-offs:** More boilerplate and abstraction than bare Express; DI/decorator
  learning curve; some runtime overhead.
- **Future migration path:** Nest runs on Express today and can switch to Fastify
  via adapter. Domain logic lives in services independent of transport, so
  extracting a module into a standalone microservice later is contained.

### 5. PostgreSQL (primary database)

- **Why selected:** A mature, ACID-compliant relational database fits commerce's
  inherently relational, transactional data (orders, inventory, payments) and
  offers JSONB, full-text search, rich indexing, and strong integrity guarantees.
  Excellent managed options (Supabase initially, then Railway/cloud).
- **Alternatives considered:** _MySQL/MariaDB_ (capable, weaker JSON/indexing
  ergonomics); _MongoDB_ (document model risks integrity for financial/order
  data and complicates multi-entity transactions); _SQLite_ (single-writer, not
  for production scale).
- **Trade-offs:** Requires schema discipline and migrations; horizontal scaling
  needs deliberate strategy (read replicas, partitioning).
- **Future migration path:** Prisma abstracts the SQL dialect, easing a managed-
  Postgres provider switch. Scale-out via read replicas, connection pooling
  (PgBouncer), and table partitioning before any engine change.

### 6. Prisma (ORM)

- **Why selected:** Type-safe, schema-first ORM with auto-generated types that
  reinforce strict TypeScript end-to-end, a first-class migration workflow
  (`prisma migrate`), and excellent DX. Aligns with TRD §8 conventions (UUID
  primary keys, soft delete, audit fields).
- **Alternatives considered:** _TypeORM_ (decorator-based, historically buggier
  migrations); _Drizzle_ (lighter, SQL-near, but younger ecosystem and less
  batteries-included tooling); _Knex/raw SQL_ (maximum control, no type safety,
  more boilerplate).
- **Trade-offs:** A generation step in the build; an abstraction layer over SQL
  that can hide cost; advanced queries sometimes need raw SQL escape hatches
  (which Prisma supports).
- **Future migration path:** The Prisma schema is the source of truth; models
  and SQL are portable. If we outgrow Prisma, Drizzle or raw SQL can be adopted
  per-module incrementally since the DB schema itself is standard Postgres.

### 7. Redis (cache & queues)

- **Why selected:** Industry-standard in-memory store for caching hot reads
  (catalog, sessions), rate limiting, and as the backing store for background
  job queues (e.g. BullMQ) used by the `jobs/` and `queues/` modules. Directly
  supports the performance-first mandate.
- **Alternatives considered:** _Memcached_ (cache-only, no data structures or
  queue semantics); _in-process cache_ (doesn't survive restarts or scale across
  instances); _dedicated brokers (RabbitMQ/Kafka)_ (overkill for v1 queue needs).
- **Trade-offs:** Another stateful service to operate; cache invalidation
  complexity; persistence/HA require configuration.
- **Future migration path:** Cache and queue concerns are isolated behind
  services. Heavy event-streaming workloads can later move to Kafka without
  disturbing the cache layer.

### 8. Cloudflare R2 (object storage)

- **Why selected:** S3-compatible object storage with **zero egress fees** —
  significant for an image-heavy fashion catalog served globally — and native
  Cloudflare CDN integration for fast, cheap media delivery (WebP/AVIF per TRD
  §17).
- **Alternatives considered:** _AWS S3_ (de facto standard but egress costs add
  up for media-heavy delivery); _Cloudinary/imgix_ (great transforms but pricier
  at scale and more lock-in); _self-hosted MinIO_ (operational burden).
- **Trade-offs:** Newer than S3; some S3 ecosystem edge features differ. Image
  transformation pipeline is our responsibility (Next/Image + a transform layer).
- **Future migration path:** R2 speaks the S3 API, so the storage client and
  bucket layout port to S3 (or any S3-compatible provider) with config changes
  only.

### 9. Railway (backend hosting)

- **Why selected:** Low-friction, Git-driven deployment for the NestJS API plus
  managed Postgres/Redis add-ons — minimal DevOps overhead for a small team while
  remaining container-based and portable.
- **Alternatives considered:** _Render/Fly.io_ (comparable; Fly is edge-oriented);
  _AWS ECS/EKS_ (maximally flexible, far more ops overhead); _Vercel functions
  for the API_ (serverless cold starts and execution limits are a poor fit for a
  stateful, long-running Nest app with queues).
- **Trade-offs:** A managed PaaS with less low-level control and potential cost
  growth at high scale; some vendor-specific configuration.
- **Future migration path:** Because the backend ships as a Docker image
  (`docker/backend.Dockerfile`), it redeploys to any container platform (Fly,
  Render, ECS, Kubernetes) without code changes.

### 10. Vercel (frontend hosting)

- **Why selected:** First-party Next.js host — best-in-class support for SSR/ISR,
  edge caching, image optimization, preview deployments per PR, and analytics.
  Maximizes the framework's SEO/performance capabilities with minimal config.
- **Alternatives considered:** _Netlify/Cloudflare Pages_ (good, less seamless
  with cutting-edge Next features); _self-hosting on Railway/Docker_ (loses
  turnkey ISR/edge tuning).
- **Trade-offs:** Some Next features are tuned for Vercel; costs scale with
  traffic/bandwidth; provider gravity.
- **Future migration path:** `output: standalone` produces a self-contained Node
  server (`docker/frontend.Dockerfile`), so the app can be self-hosted on any
  container platform if we leave Vercel.

### 11. Docker

- **Why selected:** Reproducible builds and environment parity. Local backing
  services (Postgres, Redis, Meilisearch) run via `docker-compose.yml`;
  production images for both apps are defined in `docker/` (multi-stage,
  non-root). Containers are the portability insurance behind every hosting
  choice above.
- **Alternatives considered:** _Native local installs_ (environment drift, "works
  on my machine"); _Nix/devcontainers_ (powerful but steeper adoption curve);
  _Podman_ (compatible alternative, smaller mindshare).
- **Trade-offs:** Image build/maintenance effort; Windows symlink constraints for
  some build outputs (handled by gating Next standalone behind an env var).
- **Future migration path:** OCI images are a portable standard, directly
  consumable by Kubernetes or any container runtime when scale demands it.

### 12. GitHub Actions (CI/CD)

- **Why selected:** Native to our GitHub-hosted repository; runs the same quality
  gates as local (`format → lint → typecheck → build → test`), plus CodeQL and
  Dependabot for supply-chain security. Enforces "broken builds may not be merged
  into the default branch."
- **Alternatives considered:** _GitLab CI / CircleCI_ (would split tooling from
  our SCM); _Jenkins_ (self-hosted maintenance burden).
- **Trade-offs:** Vendor-specific YAML; minutes cost at scale; some lock-in to
  the Actions marketplace.
- **Future migration path:** Pipeline logic is mostly plain pnpm/Turbo commands,
  so the bulk is portable; only the workflow YAML wrapper would need rewriting.

### 13. Tailwind CSS (styling)

- **Why selected:** Utility-first CSS enables a consistent, token-driven design
  system (handbook: design tokens, no inline CSS), excellent purge/tree-shaking
  for performance, and fast iteration. v4's CSS-first config keeps tokens as the
  single source of truth and is the foundation shadcn/ui builds on.
- **Alternatives considered:** _CSS Modules / vanilla CSS_ (more boilerplate,
  weaker design-token enforcement); _CSS-in-JS (styled-components/Emotion)_
  (runtime cost, friction with React Server Components); _Chakra/MUI_ (heavier,
  more opinionated visual language, harder to make feel "premium/bespoke").
- **Trade-offs:** Verbose class lists; a learning curve; requires conventions
  (and `cn()` + cva) to avoid duplication.
- **Future migration path:** Utilities can be progressively replaced by component
  styles; the token layer (CSS variables) is framework-agnostic and survives a
  styling-engine change.

### 14. shadcn/ui (component layer)

- **Why selected:** Not a dependency but a **copy-in** library of accessible
  (Radix-based) component source we own and restyle — ideal for a bespoke premium
  brand and for meeting WCAG 2.2 AA without fighting a vendor's design opinions.
  No runtime lock-in.
- **Alternatives considered:** _MUI/Chakra/Ant_ (faster start but generic look
  and heavier runtime, harder to make premium); _hand-rolling on Radix_ (more
  effort, reinvents what shadcn already assembles); _Headless UI_ (smaller
  primitive set).
- **Trade-offs:** We own and maintain the copied component code; updates are
  manual rather than via package bumps.
- **Future migration path:** Because the code lives in our repo (`components/ui`),
  there is nothing to migrate _off_ — components can be edited or replaced
  individually at will.

### 15. TanStack Query (server state)

- **Why selected:** Purpose-built for server-state: caching, background
  refetching, deduplication, pagination/infinite scroll, and request retries
  (TRD §API: retry logic) — eliminating brittle hand-rolled fetching and
  improving perceived performance.
- **Alternatives considered:** _RTK Query_ (ties us to Redux Toolkit); _SWR_
  (lighter, fewer features for complex commerce data); _manual fetch + Zustand_
  (re-implements caching/invalidation poorly).
- **Trade-offs:** A dedicated cache to understand; query-key discipline required
  to avoid stale-data bugs.
- **Future migration path:** Data access is wrapped in `services/` + hooks, so
  the fetching library can be swapped behind that boundary without touching
  components.

### 16. Zustand (client state)

- **Why selected:** Minimal, unopinionated client-state store for genuinely
  client-only concerns (cart drawer, UI toggles, wizard steps). Tiny bundle, no
  boilerplate, no context-provider tax — keeping client JS small (performance
  mandate). Clear division of labor: **TanStack Query owns server state, Zustand
  owns client state.**
- **Alternatives considered:** _Redux Toolkit_ (powerful but heavy boilerplate
  for our needs); _Jotai/Recoil_ (atomic model, less subjectively simple);
  _React Context_ (re-render and scaling issues for frequently-updated state).
- **Trade-offs:** Fewer guardrails/conventions than Redux; large stores need
  self-imposed structure and middleware for devtools/persistence.
- **Future migration path:** Stores are small and localized; migrating to another
  client-state library is a contained, store-by-store effort.

### 17. TypeScript strict mode

- **Why selected:** The handbook mandates strict TypeScript and **no `any`**.
  Strict mode (plus `noUncheckedIndexedAccess`, `noImplicitOverride`, unused-symbol
  checks in `tsconfig.base.json`) catches whole classes of bugs at compile time,
  documents intent, and makes the codebase safe to refactor — the cornerstone of
  long-term maintainability. End-to-end types (Prisma → API → React) reduce
  integration defects.
- **Alternatives considered:** _JavaScript_ (rejected by the handbook — no type
  safety); _TypeScript non-strict_ (permits implicit `any`, undermining the
  guarantees); _other typed languages per tier_ (fragments the skill set and the
  shared type contract).
- **Trade-offs:** More upfront annotation effort; stricter checks can slow rapid
  prototyping and occasionally require explicit narrowing.
- **Future migration path:** Strictness is a one-way ratchet we intend to keep;
  if ever needed, individual flags can be relaxed per-file, but the standing rule
  is to tighten, never loosen.

---

## Alternatives Considered

The table summarizes the headline alternatives; per-technology detail is above.

| Area              | Chosen            | Leading alternative(s)        | Why not chosen (summary)                                  |
| ----------------- | ----------------- | ----------------------------- | --------------------------------------------------------- |
| Repo topology     | pnpm monorepo     | Polyrepo, npm/yarn, Nx        | Type-contract drift / slower / heavier than needed        |
| Task runner       | Turborepo         | Nx, Bazel, plain scripts      | Right power-to-complexity ratio with caching              |
| Frontend          | Next.js 15        | Remix, Astro, SvelteKit       | Best turnkey SSR/SEO/image in the React ecosystem         |
| Backend           | NestJS 11         | Express/Fastify, tRPC, Go     | Enforced structure & consistency at scale                 |
| Database          | PostgreSQL        | MySQL, MongoDB                 | Relational integrity for transactional commerce data      |
| ORM               | Prisma            | Drizzle, TypeORM, raw SQL      | Type-safe schema-first DX + migrations                    |
| Cache/queue       | Redis             | Memcached, Kafka/RabbitMQ     | Versatile cache + queue without overkill                  |
| Object storage    | Cloudflare R2     | AWS S3, Cloudinary            | Zero egress + CDN for media-heavy catalog                 |
| Backend host      | Railway           | Render, Fly.io, AWS ECS       | Low ops overhead, container-portable                      |
| Frontend host     | Vercel            | Netlify, CF Pages, self-host  | First-party Next features & previews                      |
| UI styling        | Tailwind + shadcn | MUI, Chakra, CSS-in-JS        | Token-driven, premium-bespoke, low runtime                |
| Server state      | TanStack Query    | RTK Query, SWR               | Best-in-class caching/retry for commerce data             |
| Client state      | Zustand           | Redux Toolkit, Jotai          | Minimal, small-bundle, low boilerplate                    |
| Language strictness | TS strict       | JS, TS non-strict             | Compile-time safety + refactorability                     |

## Consequences

- **Positive:**
  - A single, coherent TypeScript codebase with end-to-end type safety and one
    set of quality gates (lint/format/typecheck/build/test) shared across apps.
  - Each layer is independently deployable, container-portable, and individually
    replaceable behind clear boundaries (`services/`, modules, `packages/*`).
  - Choices directly serve the handbook mandates: SEO, performance, security,
    accessibility, and scalability to the documented targets.
- **Negative / costs:**
  - More moving parts to operate (Postgres, Redis, Meilisearch, R2) and several
    framework learning curves (App Router, Nest DI, Prisma, Tailwind).
  - Some provider gravity (Vercel/Railway/Cloudflare), mitigated by Docker.
  - Strict TypeScript and ADR/documentation discipline add upfront effort.
- **Neutral / follow-ups:**
  - Future ADRs required for: authentication strategy, API response/error
    contract, caching strategy, search indexing, and observability stack.

## Risks

| Risk                                                          | Likelihood | Impact | Mitigation                                                                 |
| ------------------------------------------------------------- | ---------- | ------ | -------------------------------------------------------------------------- |
| Framework churn (Next.js/Nest fast release cadence)           | Medium     | Medium | Pin majors, scheduled upgrade ADRs, Dependabot, CI gates                   |
| Vendor lock-in (Vercel / Railway / R2)                        | Medium     | Medium | Dockerized apps + S3-compatible storage keep exit paths open               |
| Operational complexity for a small team                       | Medium     | Medium | Managed services + `docker-compose` for local parity + automation in CI    |
| Prisma abstraction hides query cost at scale                  | Low        | Medium | Query logging, raw-SQL escape hatch, read replicas, indexing review        |
| pnpm strictness / Windows symlink quirks in build             | Low        | Low    | `.npmrc` config; standalone output gated behind `BUILD_STANDALONE`         |
| Skill ramp-up on strict TS + Nest + App Router                | Medium     | Low    | Conventions in the handbook, coding standards doc, reviews, this ADR trail |

## Migration Strategy

This is a **greenfield foundation**, so there is no legacy system to migrate
_from_. The relevant strategy is preserving **exit paths** for each decision:

- **Hosting:** both apps build to Docker images, so Vercel/Railway can be left
  for any container platform (Fly, Render, ECS, Kubernetes) without code changes.
- **Storage:** R2 is S3-compatible — switching providers is configuration-only.
- **Database:** Prisma abstracts the dialect; scale-out (replicas, pooling,
  partitioning) precedes any engine change.
- **Frameworks/libraries:** data access (`services/`), client state (Zustand
  stores), and UI components (owned shadcn source) sit behind boundaries that
  localize any future replacement.
- **Reversal of this ADR:** any change to a foundational choice here requires a
  new ADR that supersedes this one, with its own migration plan, per the process
  in [`README.md`](./README.md).

## References

- [Engineering Handbook (000_MASTER_INSTRUCTIONS.md)](../000_MASTER_INSTRUCTIONS.md)
- [Technical Requirements Document (003_TRD.md)](../003_TRD.md)
- [Coding Standards (009_CODING_STANDARDS.md)](../009_CODING_STANDARDS.md)
- [Deployment (011_DEPLOYMENT.md)](../011_DEPLOYMENT.md)
- Repository foundation: root `README.md`, `turbo.json`, `pnpm-workspace.yaml`,
  `tsconfig.base.json`, `docker/`, `.github/workflows/`
- [ADR Index (ADR-0000)](./ADR-0000-INDEX.md)
