# 01 · REST Conventions, URI Naming, Versioning

**Status:** ✅ CTO Approved / Frozen for MVP (D10, D11). **Cross-refs:** TRD §11,
`005_API.md`, Handbook Part 2 (naming), Sprint 1 (global prefix `api/v1`).

## 1. REST principles

- **Resource-oriented**: URLs name **nouns** (resources), HTTP **verbs** express
  the action. No verbs in paths (except controlled non-CRUD "actions", §5).
- **Stateless**: every request carries its own auth context; no server session
  affinity beyond the session store.
- **JSON only** (`application/json`), UTF-8 (TRD §11).
- **Predictable & uniform**: the same conventions apply across every module.

## 2. HTTP method semantics

| Method | Use | Safe | Idempotent | Body |
| --- | --- | --- | --- | --- |
| `GET` | read resource/collection | ✔ | ✔ | no |
| `POST` | create; non-idempotent actions | ✘ | ✘ (use Idempotency-Key, [04](./04-idempotency-and-correlation.md)) | yes |
| `PUT` | full replace | ✘ | ✔ | yes |
| `PATCH` | partial update | ✘ | ✔ (target state) | yes |
| `DELETE` | remove (soft delete, DB blueprint) | ✘ | ✔ | no |

> `DELETE` performs a **soft delete** (`deletedAt`) per the database blueprint —
> the resource disappears from reads but is retained. This is a server-side rule,
> invisible to the client contract.

## 3. URI naming standards

- **Plural, kebab-case nouns**: `/products`, `/product-variants`, `/order-items`.
  (Handbook Part 2: "API endpoints kebab-case", "URLs lowercase".)
- **Resource identifier** = the resource's public key. Prefer **opaque business
  keys** for SEO/UX where they exist (`/products/{slug}`, `/categories/{slug}`,
  `/orders/{orderNumber}`) and the **UUID** for write/admin operations
  (`/products/{id}`). UUIDs are v7 (CTO) and non-enumerable.
- **Nesting** expresses ownership, max ~2 levels: `/orders/{id}/items`,
  `/products/{id}/reviews`. Beyond that, use top-level resources + filters.
- **No trailing slash**; no file extensions; no PascalCase/camelCase in paths.

### Canonical examples (aligned to `005_API.md`)

```text
GET    /api/v1/products
GET    /api/v1/products/{slug}
GET    /api/v1/products/search?q=...
POST   /api/v1/cart/items
PATCH  /api/v1/cart/items/{id}
DELETE /api/v1/wishlist/{id}
POST   /api/v1/checkout
GET    /api/v1/orders/{orderNumber}
```

> Note: `005` lists some singular/compact paths (e.g. `/coupon/apply`). This spec
> standardizes on **plural resources + action sub-paths** (`/coupons/apply`).
> Minor deviation from `005` wording — flagged for alignment, behavior unchanged.

## 4. JSON field casing — **RATIFIED (D10)**

- **Request/response JSON fields are `camelCase`** (`createdAt`, `productVariantId`)
  — matches Prisma model fields (CTO: Prisma camelCase via `@map` to snake_case
  columns) and the TypeScript frontend. The snake_case DB naming never leaks to
  the API.
- **URL path/query segments are `kebab-case`/lowercase**.
- Enum values are `UPPER_SNAKE_CASE` strings (database-blueprint/04).

## 5. Non-CRUD actions

Some operations are not pure CRUD (apply coupon, cancel order, verify payment).
Model them as a **sub-resource action** with `POST`:

```text
POST /api/v1/coupons/apply
POST /api/v1/orders/{id}/cancel
POST /api/v1/orders/{id}/return
POST /api/v1/payments/verify
```

Keep actions few, explicit, and verb-suffixed only when no resource noun fits.

## 6. Versioning strategy

- **URI versioning**: `/api/v1` (TRD §11, `005`). Implemented in Sprint 1 via the
  global prefix. Chosen over header versioning for cache-ability, visibility, and
  client simplicity.
- **`v1` is the launch contract.** Breaking changes ship as `/api/v2`
  (`005`: "Future /api/v2"). Non-breaking, additive changes (new optional fields,
  new endpoints) ship **within** `v1`.
- **What is a breaking change:** removing/renaming a field, changing a type/meaning,
  changing an enum's semantics, tightening validation, changing status-code
  semantics, or altering the envelope shape. Adding optional fields/endpoints is
  **non-breaking**.
- Internal/admin endpoints follow the same versioning.

## 7. API version deprecation policy

When `v2` is introduced:

1. **Announce** deprecation of `v1` with a target sunset date (≥ 90 days notice
   recommended; final window is a CTO/business call).
2. **Signal in-band**: deprecated responses include `Deprecation: true` and a
   `Sunset: <date>` header (RFC 8594), plus a changelog link.
3. **Dual-run** `v1` and `v2` during the migration window.
4. **Monitor** `v1` traffic; assist remaining clients (esp. future mobile apps,
   BRD §4 — old app versions linger).
5. **Sunset**: after the window, `v1` returns `410 Gone` for removed resources.

> Because future **native mobile apps** (BRD §4) cannot be force-upgraded, the
> deprecation window for any version that mobile depends on must be generous and
> business-approved.

## 8. Caching & conditional requests (forward-looking)

- `GET` collection/detail endpoints should be cache-friendly (CDN/SSR per TRD
  §15/§16). Support for `ETag`/`If-None-Match` and `Cache-Control` is recommended
  for public catalog reads; finalized per endpoint during catalog (S4/S5).
