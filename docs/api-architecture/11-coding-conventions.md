# 11 · Backend Coding Conventions (Controllers, Services, Repositories, DTOs, Modules)

**Status:** ✅ CTO Approved / Frozen for MVP (D8, D9). **Cross-refs:** TRD §6/§24,
`009_CODING_STANDARDS.md`, ADR-0001, CTO (Prisma, modular monolith), Sprint 1.

These conventions are binding for every feature module. They operationalize the
TRD §6 layout (Controller · Service · Repository · DTO · Entity · Validation ·
Tests) against the chosen stack.

## 1. Layered responsibilities

```text
Controller  → HTTP only: route, bind/validate DTO, call service, return data
Service     → business logic, orchestration, transactions, events
Repository  → data access via Prisma (the only place Prisma is touched)
DTO         → request/response shapes + validation
Events      → domain events published by services
```

- **One responsibility per layer.** A controller never contains business logic; a
  service never touches `req`/`res`; a repository never makes business decisions.

## 2. Controllers

- Thin. Responsibilities: declare routes (kebab-case, `/api/v1`), apply auth/role
  guards ([05](./05-auth-flows-highlevel.md)), bind the request DTO, call **one**
  service method, return the result (the global `ResponseInterceptor` wraps it).
- **No** business logic, no Prisma, no vendor SDKs, no try/catch-for-flow (let the
  global filter handle errors; throw typed Nest exceptions).
- Return **plain data / response DTOs**, never the envelope (interceptor adds it).
- Document with OpenAPI decorators ([09](./09-api-documentation.md)).

## 3. Services

- Hold the **business rules** and orchestrate repositories, other modules'
  services, and events.
- Own **transaction boundaries** (Prisma `$transaction`) within their aggregate.
- Raise **typed exceptions** mapping to the error taxonomy
  ([02](./02-response-envelope-and-errors.md)) with stable codes — e.g. throw a
  domain exception that the filter renders as `422 OUT_OF_STOCK`.
- Enforce **ownership/authorization** that is data-dependent
  ([05](./05-auth-flows-highlevel.md)).
- Generate IDs via the shared **`newId()`** (UUID v7, Sprint 1) — never rely on DB
  defaults, never auto-increment.
- Publish **domain events** for async side effects ([10](./10-modules-and-events.md)).
- Pure where possible; no `req`/`res`/HTTP concerns.

## 4. Repositories — **RATIFIED (D8)**

The approved data-access layering is **Controller → Service → Repository → Prisma**:

- Each module has a **thin repository** that is the **only** place its Prisma
  models are accessed; services depend on the repository. This isolates Prisma
  (testability, swappability) and satisfies TRD §6 "Repository".
- **"Entity" (TRD §6) = the Prisma model** (D8/CTO). FWorld does **not** introduce
  separate ORM Entity classes (no TypeORM-style entities) — that would duplicate
  the Prisma schema.
- Repositories apply the **soft-delete filter** (`deletedAt IS NULL`) centrally
  (database-blueprint/06) and the snake_case↔camelCase mapping is Prisma's `@map`
  (CTO), invisible above this layer.
- Repositories return **domain/Prisma types**, not HTTP DTOs; mapping to response
  DTOs happens in the service/controller boundary.

## 5. DTOs

- Per [06](./06-validation-and-dto.md): request vs response DTOs are distinct;
  response DTOs whitelist exposed fields; server-owned fields are never client-set;
  money/enum/ID serialization follows [02](./02-response-envelope-and-errors.md).

## 6. Modules

- One module per bounded context (business-architecture/01), self-contained:
  `controller`, `service`, `repository`, `dto/`, `events/`, `*.spec.ts`.
- Export only the **service (public interface)** and shared DTOs/events; keep
  repositories and internals private (`exports` discipline).
- Depend on other modules via their exported services only
  ([10](./10-modules-and-events.md)); no cyclic imports.
- Register in `AppModule` in the feature's sprint.

## 7. General standards (`009_CODING_STANDARDS.md`, Master Instructions)

- **Strict TypeScript, no `any`**, no `@ts-ignore`, no `eslint-disable`
  (enforced — Sprint 1 audit confirmed zero). SOLID, DRY, KISS, YAGNI.
- **Naming** (Handbook Part 2): files kebab-case (`product.service.ts`); classes
  PascalCase; variables camelCase; constants `UPPER_SNAKE_CASE`; enums
  `UPPER_SNAKE_CASE`.
- **Errors**: throw typed exceptions; never swallow; never leak internals
  ([02](./02-response-envelope-and-errors.md)).
- **Logging**: structured, with correlation id ([04](./04-idempotency-and-correlation.md));
  never log secrets/PII.
- **Tests** (TRD §19): every module ships unit tests (services/repositories) and
  the critical flows get integration/e2e tests (Vitest backend; the Sprint 1 audit
  requires an infrastructure e2e). 80% coverage target.
- **Money**: always `Decimal` server-side (CTO), string on the wire
  ([02](./02-response-envelope-and-errors.md)) — never `number` for money.
- **Async side effects** go through events/BullMQ, not inline
  ([10](./10-modules-and-events.md)).
- **Definition of Done** (TRD §26) applies to every endpoint: typed, validated,
  authorized, documented (OpenAPI), tested, performant, error-handled.
