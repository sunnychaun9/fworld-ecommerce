# FWorld API & Backend Architecture

**Status:** ✅ **CTO APPROVED / FROZEN FOR MVP** — ratified 2026-06-29
**Date:** 2026-06-29
**Author role:** Staff Backend Architect
**Applies to:** NestJS 11 modular-monolith backend, REST `/api/v1`

> 🔒 **Frozen for MVP.** The 12 CTO decisions in the ratification register below
> are authoritative for the MVP. This is now the **immutable API contract**:
> controllers, services, DTOs, and modules must conform; any change requires a new
> ADR and CTO approval. All prior open items (API-1 … API-9) are resolved.

This is the production-grade API design specification for FWorld — the **contract
that precedes feature implementation**.

> **Boundaries (per task):** no code, no DTOs, controllers, services, or modules.
> This document specifies conventions, identifies conflicts with existing docs,
> and lists decisions that require CTO approval. Authentication is covered at a
> **high level only**; the binding auth design is the separate **Authentication
> Architecture Design Review** (next deliverable).

## Source-of-truth alignment

| Concern | Authoritative source | This document |
| --- | --- | --- |
| API endpoints & base format | [`005_API.md`](../005_API.md), [`003_TRD.md`](../003_TRD.md) §11 | elaborates to production grade |
| Error handling | TRD §12, Sprint 1 `AllExceptionsFilter` | formalizes taxonomy |
| Security | TRD §14, `009_CODING_STANDARDS.md` | API-specific requirements |
| Data model / IDs / money | [`database-blueprint`](../database-blueprint/), CTO decisions | serialization rules |
| Events / async | [`business-architecture`](../business-architecture/), CTO (BullMQ/Meilisearch) | integration boundaries |
| Modular monolith | ADR-0001, CTO decision | module interaction rules |

## Contents

| # | Document | Topics |
| - | -------- | ------ |
| 01 | [REST Conventions](./01-rest-conventions.md) | REST rules, URI naming, versioning, deprecation policy |
| 02 | [Response Envelope & Errors](./02-response-envelope-and-errors.md) | envelope rules, error taxonomy, HTTP status mapping |
| 03 | [Collections](./03-collections-pagination-filtering-sorting.md) | pagination (cursor vs offset), filtering, sorting |
| 04 | [Idempotency & Correlation](./04-idempotency-and-correlation.md) | idempotency keys, request/correlation IDs |
| 05 | [Auth Flows (high level)](./05-auth-flows-highlevel.md) | authN/authZ flow shape only — defers to Auth Design Review |
| 06 | [Validation & DTOs](./06-validation-and-dto.md) | validation pipeline, DTO conventions |
| 07 | [Files & Webhooks](./07-files-and-webhooks.md) | upload/download, Razorpay/Shiprocket/Better Auth webhooks |
| 08 | [Rate Limiting & Security](./08-rate-limiting-and-security.md) | throttling tiers, API security requirements |
| 09 | [API Documentation](./09-api-documentation.md) | OpenAPI/Swagger strategy |
| 10 | [Modules & Events](./10-modules-and-events.md) | module interaction rules, event-driven boundaries |
| 11 | [Coding Conventions](./11-coding-conventions.md) | controllers, services, repositories, DTOs, modules |

## Ratification register (CTO decisions — authoritative)

All previously-open items are now **RATIFIED**. These 12 decisions are the
authoritative API architecture for the MVP; the prior conflicts (API-1 … API-9)
are resolved as shown.

| Decision | Ruling | Resolves | Detail |
| --- | --- | --- | --- |
| **D1 · Session transport** | Better Auth **HTTP-only secure cookie sessions**; browser never stores access tokens; backend trusts Better Auth sessions; JWT reserved for future M2M only | API-1 | [05](./05-auth-flows-highlevel.md) |
| **D2 · Pagination** | **Hybrid.** Cursor for **products, orders, reviews, notifications, audit logs, search**; offset only for **small lookup tables, admin reference data, static lists** | API-2 | [03](./03-collections-pagination-filtering-sorting.md) |
| **D3 · Response envelope** | Add optional **`meta`** (`{ cursor, hasNext, total }`); `meta` stays optional | API-3 | [02](./02-response-envelope-and-errors.md) |
| **D4 · Error format** | **Structured** `errors: [{ code, field?, message }]`; every business error has a **stable code** | API-4 | [02](./02-response-envelope-and-errors.md) |
| **D5 · API docs** | Adopt **`@nestjs/swagger`** (OpenAPI) | API-7 | [09](./09-api-documentation.md) |
| **D6 · Idempotency** | **`Idempotency-Key`** required on **checkout, payment creation, payment capture, refunds, return requests, exchange requests**; keys stored in **Redis w/ TTL** | API-8 | [04](./04-idempotency-and-correlation.md) |
| **D7 · Request IDs** | Every request carries **`X-Request-Id`** + **`X-Correlation-Id`**, propagated through API, BullMQ, Meilisearch, Notifications, webhooks, logs, Sentry | API-8 | [04](./04-idempotency-and-correlation.md) |
| **D8 · Repository pattern** | **Controller → Service → Repository → Prisma**; repositories are **thin** Prisma wrappers; **no ORM Entity classes** | API-5 | [11](./11-coding-conventions.md) |
| **D9 · Money** | DB **`Decimal(12,2)`**; API serializes money as **strings**; never expose floats | API-6 | [02](./02-response-envelope-and-errors.md), [11](./11-coding-conventions.md) |
| **D10 · Naming** | DB **snake_case**; Prisma **camelCase via `@map`**; API JSON **camelCase**; URLs **kebab-case** (e.g. `GET /api/v1/order-items`) | API-9 | [01](./01-rest-conventions.md) |
| **D11 · Versioning** | Keep **`/api/v1`**; no breaking changes within a version; breaking changes → new version + deprecation period | — | [01](./01-rest-conventions.md) |
| **D12 · Webhook security** | All provider webhooks (Razorpay, Shiprocket, Better Auth) must **verify signatures**, be **idempotent**, be **logged**, **return success only after successful processing**, and **queue heavy work via BullMQ** | — | [07](./07-files-and-webhooks.md) |

> No open decisions remain for the MVP API contract. Changes require a new ADR.
