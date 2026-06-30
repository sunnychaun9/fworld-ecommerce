# 06 · Validation Pipeline & DTO Conventions

**Status:** ✅ CTO Approved / Frozen for MVP. **Cross-refs:** TRD §14, `009_CODING
_STANDARDS.md` (Zod, never trust client), Sprint 1 (global `ValidationPipe`),
CTO (class-validator per TRD §4 backend; Zod per coding standards).

## 1. Validation pipeline (layers)

Validation is **defense in depth** — never trust the client (Coding Standards):

```text
1. Transport     HTTPS, body-size limits, content-type = application/json
2. Structural    Global ValidationPipe (whitelist + forbidNonWhitelisted + transform)  ← S1
3. Schema/DTO    Per-field rules on the request DTO (types, formats, ranges)
4. Business      Service-layer rules (stock, coupon eligibility, ownership, state)
5. Persistence   DB constraints (unique, FK, check) — last line of defense
```

- **Layer 2 is live** (Sprint 1): unknown properties stripped (`whitelist`) and
  rejected (`forbidNonWhitelisted`); payloads transformed to typed instances.
- **Layer 4** raises business errors (`422`/`409`) with stable codes
  ([02](./02-response-envelope-and-errors.md)) — structural validity ≠ business
  validity.

## 2. Validation library (⚠ note)

- **TRD §4** names **class-validator** (backend); Sprint 1 installed
  `class-validator`/`class-transformer` and uses Nest's `ValidationPipe`.
- **`009_CODING_STANDARDS.md`** names **Zod** for validation.
- **Resolution (recommended, no conflict in practice):** use **class-validator +
  class-transformer DTOs** for HTTP request validation (native Nest pipeline,
  already wired), and **Zod** for **non-DTO** schema needs — environment
  validation (already, Sprint 1), config, queue-job payloads, and shared
  `@fworld/types` contracts. Both are in use; neither is removed. *(If the CTO
  wants a single validator, that is a decision; default is the split above.)*

## 3. DTO conventions

- **Location:** each module owns its DTOs under `modules/<feature>/dto/`.
- **Naming:** `Create<Entity>Dto`, `Update<Entity>Dto`, `<Entity>QueryDto`
  (filters/pagination/sort), `<Entity>ResponseDto` where the response shape must be
  explicit. PascalCase types; `*.dto.ts` files (kebab-case filenames).
- **Direction-specific:** **request DTOs** and **response DTOs** are distinct —
  never reuse a Prisma model or a create DTO as the response shape (prevents
  over-exposure of internal/sensitive fields).
- **No leakage:** response DTOs **whitelist** what is exposed; never serialize
  `password`, internal flags, `costPrice` (admin-only), soft-delete columns, or
  raw gateway payloads to customers.
- **Immutability of server-owned fields:** clients cannot set `id`, `createdAt`,
  `updatedAt`, `createdBy`, totals, `status`, `role`, prices — these are
  server-assigned; DTOs simply omit them (and `whitelist` strips them if sent).
- **Types match the contract:** money as string ([02](./02-response-envelope-and-errors.md)),
  enums as the `UPPER_SNAKE_CASE` union, IDs as UUID strings.
- **Partial updates:** `Update*Dto` uses optional fields (PATCH semantics).
- **Query DTOs** validate and **allow-list** pagination/filter/sort params
  ([03](./03-collections-pagination-filtering-sorting.md)).

## 4. Input hardening rules

- Reject unknown fields (`forbidNonWhitelisted`, live).
- Enforce length/size bounds on every string/array (DoS protection).
- Normalize/trim where safe (email lowercase via `citext`, phone to E.164).
- Validate enums against the canonical set (database-blueprint/04).
- File uploads validated separately ([07](./07-files-and-webhooks.md)).
- SQL injection is mitigated by **Prisma parameterization** (TRD §14); never build
  raw SQL from user input (raw queries, if ever needed, use parameter binding).
- Output encoding/escaping for any HTML-bearing content (blog) to prevent stored
  XSS (TRD §14).

## 5. Validation error contract

- DTO/structural failures → `400` (current `ValidationPipe` behavior), with
  per-field entries in `errors` (`field` + `message`), `code: VALIDATION_ERROR`
  once the structured-error decision (API-4) is ratified.
- Business-rule failures → `422`/`409` from the service layer with domain codes.
