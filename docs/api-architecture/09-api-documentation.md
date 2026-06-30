# 09 · API Documentation Strategy

**Status:** ✅ CTO Approved / Frozen for MVP (D5). **Cross-refs:** TRD §25
(documentation mandatory), `005_API.md`, Handbook (documentation policy).

## 1. Goal

The API is a **contract**. It must be documented, accurate, and versioned, and the
docs must not drift from the implementation (TRD §25, Handbook: "documentation is
part of the product").

## 2. OpenAPI via `@nestjs/swagger` — **RATIFIED (D5)**

- **`@nestjs/swagger`** is the approved OpenAPI implementation (D5). It generates an
  **OpenAPI 3** spec from the code (DTOs + decorators), served as interactive
  Swagger UI in non-production and exported as a static `openapi.json` artifact in
  CI.
- **Why:** single source of truth co-located with the code → docs can't drift;
  typed DTOs become the schema; enables client-SDK generation for the future
  **mobile apps** (BRD §4) and the `@fworld/types` contract package.
- The dependency is added in the first backend sprint that exposes documented
  endpoints (Sprint 2); no code is added in this document.

## 3. Documentation rules

- **Every endpoint** documents: method, path, summary, auth/role requirement,
  request DTO/params, response DTO, pagination/filter/sort support, possible error
  codes + statuses ([02](./02-response-envelope-and-errors.md)), and examples.
- **Schemas** mirror DTOs; money/enum/ID serialization rules
  ([02](./02-response-envelope-and-errors.md)) are reflected.
- **Auth**: documents the session/credential scheme (finalized by the Auth Design
  Review), `Idempotency-Key`, and `X-Request-Id` headers.
- **Error catalog**: a **central, append-only registry** of stable error `code`s
  ([02](./02-response-envelope-and-errors.md) §6) is maintained and published with
  the API docs so clients can rely on codes.
- **Webhooks**: documented separately (provider, signature, payload, idempotency)
  per [07](./07-files-and-webhooks.md).
- **Changelog**: API changes recorded in the root `CHANGELOG.md`; breaking changes
  trigger a new version ([01](./01-rest-conventions.md)).

## 4. Versioning of the docs

- The OpenAPI spec is **versioned with the API** (`v1` now; `v2` doc set when it
  exists). Deprecated endpoints are marked `deprecated: true` with the sunset date.

## 5. Accuracy enforcement

- The OpenAPI artifact is generated in CI; a drift check (spec vs routes) can fail
  the build if an endpoint is undocumented — keeps the contract honest (TRD §26
  Definition of Done: "Documentation Updated").
- Swagger UI is **disabled or auth-gated in production** (do not expose the full
  surface publicly).

## 6. Audience-specific docs

- **Internal/engineering:** full OpenAPI + this architecture set.
- **Future external/mobile:** a curated subset + generated SDK from the same
  OpenAPI source.
