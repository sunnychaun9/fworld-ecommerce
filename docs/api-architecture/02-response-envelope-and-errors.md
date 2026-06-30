# 02 · Response Envelope & Error Taxonomy

**Status:** ✅ CTO Approved / Frozen for MVP. **Cross-refs:** TRD §11/§12,
`005_API.md`, Sprint 1 (`ResponseInterceptor`, `AllExceptionsFilter`).

## 1. Response envelope (frozen base shape)

Every response — success or error — uses the envelope already implemented in
Sprint 1 (TRD §11):

```json
{ "success": true, "message": "Success", "data": {}, "errors": [] }
```

| Field | Type | Rule |
| --- | --- | --- |
| `success` | boolean | `true` for 2xx, `false` otherwise |
| `message` | string | human-readable summary (safe to display) |
| `data` | object \| array \| null | payload; `null` on error or no content |
| `errors` | array | empty on success; populated on error (see §4) |

> The base four fields are **immutable** (TRD §11 + shipped code). The optional
> `meta` extension is **ratified (D3)** and additive.

## 2. Pagination / list metadata — **RATIFIED (D3)**

List endpoints add an **optional** top-level **`meta`** object (additive,
non-breaking; `meta` is absent on non-list responses):

```json
{
  "success": true,
  "message": "Success",
  "data": [ /* items */ ],
  "meta": { "cursor": "eyJ...", "hasNext": true, "total": 235 },
  "errors": []
}
```

| `meta` field | Type | Meaning |
| --- | --- | --- |
| `cursor` | string \| null | next-page cursor (cursor pagination); `null`/absent when no next page |
| `hasNext` | boolean | whether more results exist |
| `total` | number (optional) | total count when cheaply known (always for offset; optional for cursor) |

Offset endpoints additionally expose `page`, `limit`, `totalPages` inside `meta`
([03](./03-collections-pagination-filtering-sorting.md)). `meta` remains optional.

## 3. Money & special-type serialization — **RATIFIED (D9)**

- **Money** (`Decimal(12,2)`, CTO/D9) serializes as a **JSON string** (`"1299.00"`),
  **never** a float — floats lose precision. All amounts are INR (PRD §15).
- **Timestamps**: ISO-8601 UTC strings (`2026-06-29T10:00:00.000Z`) — DB stores
  `timestamptz` (database-blueprint/06).
- **IDs**: UUID v7 strings (CTO); never integers.
- **Enums**: `UPPER_SNAKE_CASE` strings matching database-blueprint/04.

## 4. Error representation — **RATIFIED (D4)**

`errors` is a **structured array** of machine-readable error objects. **Every
business error has a stable `code`.**

```json
{
  "success": false,
  "message": "Validation failed",
  "data": null,
  "errors": [
    { "code": "EMAIL_ALREADY_EXISTS", "field": "email", "message": "Email already exists" }
  ]
}
```

| Field | Required | Meaning |
| --- | --- | --- |
| `code` | yes | stable `UPPER_SNAKE_CASE` identifier (never localized) — clients branch on this |
| `field` | optional | offending input path (validation/business field errors) |
| `message` | yes | human-readable, localizable detail |

> **Implementation note (not done here):** Sprint 1 shipped `errors: string[]`.
> Aligning the `AllExceptionsFilter` to this structured array is a required code
> change in the next backend sprint — it must land **before** any feature consumes
> errors. Tracked as a Sprint-2 prerequisite; no code is changed in this document.

## 5. Error taxonomy → HTTP status mapping

Aligned to `005_API.md` status codes; codes are the proposed stable catalog.

| HTTP | When | Example `code` |
| --- | --- | --- |
| **200** OK | successful read/update/action | — |
| **201** Created | resource created | — |
| **204** No Content | success, no body (rare with envelope; prefer 200) | — |
| **400** Bad Request | malformed request / bad params | `BAD_REQUEST` |
| **401** Unauthorized | missing/invalid auth | `UNAUTHENTICATED` |
| **403** Forbidden | authenticated but not allowed (RBAC) | `FORBIDDEN` |
| **404** Not Found | resource absent or soft-deleted | `NOT_FOUND` |
| **409** Conflict | state conflict (dup, version, already-used coupon) | `CONFLICT`, `COUPON_ALREADY_USED` |
| **422** Unprocessable | semantic/business-rule violation | `VALIDATION_ERROR`, `OUT_OF_STOCK` |
| **429** Too Many Requests | rate limit exceeded ([08](./08-rate-limiting-and-security.md)) | `RATE_LIMITED` |
| **500** Internal | unexpected server error (sanitized) | `INTERNAL_ERROR` |
| **503** Service Unavailable | dependency down (e.g. DB readiness) | `SERVICE_UNAVAILABLE` |

> **400 vs 422 rule:** `400` = the request is malformed (can't be parsed/bound);
> `422` = the request is well-formed but **violates a business rule** (e.g. coupon
> below min order, variant out of stock). NestJS `ValidationPipe` currently emits
> `400` for DTO failures — acceptable; reserve `422` for service-layer business
> validation. Both are in `005`'s list.

## 6. Domain-specific business errors (catalog — illustrative)

Stable codes the storefront/admin can rely on (final list grows per feature
sprint, but the **naming convention** is fixed here):

| Code | HTTP | Domain |
| --- | --- | --- |
| `OUT_OF_STOCK` | 422 | inventory/cart/checkout |
| `INSUFFICIENT_STOCK` | 409 | reservation race |
| `COUPON_INVALID` / `COUPON_EXPIRED` / `COUPON_USAGE_EXCEEDED` | 422 | promotions |
| `PINCODE_NOT_SERVICEABLE` | 422 | checkout/shipping |
| `PAYMENT_FAILED` / `PAYMENT_PENDING` | 402/409 | payments |
| `ORDER_NOT_CANCELLABLE` | 409 | orders |
| `RETURN_WINDOW_EXPIRED` | 422 | returns |

> Each feature sprint registers its codes in a central catalog (see
> [09](./09-api-documentation.md)); codes are **append-only** and never repurposed.

## 7. Production sanitization (TRD §12)

- `5xx` responses never include stack traces or internal messages in production
  (already enforced by `AllExceptionsFilter`). Internal detail is logged with the
  correlation ID ([04](./04-idempotency-and-correlation.md)) for support.
- `message` must always be safe to display to an end user.
