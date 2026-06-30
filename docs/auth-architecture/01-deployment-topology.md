# 01 · Better Auth Deployment Topology (Q1)

**Status:** ✅ CTO Approved — Frozen for MVP.

**Approved (Q1):** Better Auth runs **inside the NestJS backend**. Next.js is the
**frontend client only**. NestJS is the **single authentication authority** and
owns: **Better Auth, Prisma, sessions, OAuth callbacks, RBAC, and user
management.** The options below are retained for rationale.

## Options

### Option A — Better Auth in **Next.js** only
- Auth handler mounted as a Next.js route; storefront owns auth.
- NestJS validates sessions by reading the shared session store or calling Next.
- **Pros:** Better Auth is Next-native; least friction for the frontend.
- **Cons:** **Two writers to the same Postgres** (Next writes auth tables, NestJS
  writes everything else) — violates "backend owns the DB"; RBAC/authorization
  for API routes lives away from the API; session validation in NestJS becomes a
  cross-service call or a shared-secret hack. **Rejected.**

### Option B — Better Auth in **NestJS** (recommended)
- Better Auth's framework-agnostic **handler is mounted on a NestJS route**
  (`/api/v1/auth/*`); NestJS owns the auth tables via the **Prisma adapter** —
  one DB writer.
- Next.js uses the **Better Auth client** (React hooks) pointed at the backend.
- **Pros:** single source of truth for the DB; **RBAC + ownership co-located with
  the API** (guards run where the data is); consistent with modular monolith;
  sessions validated in-process by the same app that authorizes requests.
- **Cons:** Better Auth on a non-Next backend is less "out-of-the-box"; the
  **cross-origin cookie** must be handled ([03](./03-cross-origin.md)).

### Option C — **Shared** (both)
- One Better Auth config in a shared package, mounted in both apps.
- **Cons:** dual writers + duplicated runtime + ambiguous ownership. **Rejected.**

## Approved: **Option B** (Better Auth in NestJS)

The backend owns persistence, business rules, and authorization; auth lives where
authorization decisions are made and where the database is written. The only real
cost — cross-origin cookies — is solved by the same-site domain strategy
([03](./03-cross-origin.md)). Next.js consumes auth via the client SDK, keeping the
storefront simple while the API remains the **single trust boundary / single
authentication authority**.

## Consequences of Option B

- `/api/v1/auth/*` (the `005` auth surface) is served by the Better Auth handler
  within NestJS; FWorld-specific endpoints (`/auth/me`, `/auth/profile`) wrap or
  extend it.
- NestJS **auth guard** resolves the Better Auth session → principal
  (`userId, role, isGuest`) for every protected route
  ([api-architecture/05](../api-architecture/05-auth-flows-highlevel.md)).
- The **raw-body** webhook concern ([api-architecture/07](../api-architecture/07-files-and-webhooks.md))
  and the Better Auth handler must coexist in the bootstrap (body-parser config).
- OAuth **callback URLs** point at the backend
  (`/api/v1/auth/callback/{google|apple}`) — see [06](./06-oauth-google-apple.md).

> **CTO decision (Q1): APPROVED** — Better Auth in NestJS; one authentication
> authority; NestJS owns Better Auth, Prisma, sessions, OAuth callbacks, RBAC, and
> user management.
