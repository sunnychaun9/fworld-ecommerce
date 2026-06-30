# 05 · Indexing Strategy

**Status:** Blueprint (no implementation).
**Basis:** `004` Indexes (email, phone, slug, sku, product name, category, brand,
order number, coupon code), expanded for a production catalog of **100k products /
1M customers / 10k orders/day** (PRD §9, TRD §23).

## 1. Primary indexes

- Every table's **primary key is its UUID v7** ([07](./07-uuid-strategy.md)).
  v7 is **time-ordered**, so PK B-tree inserts stay at the right edge (good index
  locality, low fragmentation) — unlike random UUID v4. **Why this matters:** with
  10k orders/day, random PKs would scatter writes and bloat the index.

## 2. Foreign-key indexes (mandatory)

- **Every FK column gets its own index.** PostgreSQL does **not** auto-index FKs;
  unindexed FKs cause slow joins and, worse, lock the child table on parent
  updates/deletes. Examples: `addresses.userId`, `products.categoryId`,
  `product_variants.productId`, `order_items.orderId`,
  `inventory.productVariantId`, `coupon_redemptions.couponId`, etc.

## 3. Unique indexes (partial, soft-delete aware)

All "unique" business keys are **partial unique indexes** `WHERE deletedAt IS
NULL`, so a soft-deleted value can be reused:

| Unique key | Table | Why |
| --- | --- | --- |
| `email`, `phone` | users | identity |
| `slug` | categories, products, brands, blogs | SEO URLs |
| `sku`, `barcode` | products, product_variants | catalog/ops |
| `code` | coupons | redemption |
| `orderNumber`, `invoiceNumber` | orders | lookup, GST sequence |
| `transactionId` | payments | idempotency vs gateway |
| `awbNumber` | shipments | tracking |
| `(userId, productId)` | wishlist | no dup wishlist entry |
| `(cartId, productVariantId)` | cart_items | no dup cart line |
| `(productVariantId, warehouseId)` | inventory | one stock row per WH |

## 4. Composite indexes (query-driven)

Designed around real access patterns, **column order = most-selective / equality
first, range last**:

| Index | Serves |
| --- | --- |
| `products(status, categoryId)` | PLP: active products in a category |
| `products(categoryId, createdAt desc)` | "new arrivals" in a category |
| `products(status, featured/newArrival/bestSeller)` | homepage rails |
| `orders(userId, placedAt desc)` | customer order history |
| `orders(orderStatus, placedAt)` | admin order queues |
| `orders(paymentStatus)` | reconciliation |
| `reviews(productId, status)` | approved reviews on a PDP |
| `notifications(userId, read)` | unread badge |
| `inventory(warehouseId, availableStock)` | low-stock reports |
| `coupon_redemptions(couponId, userId)` | usage-limit enforcement |

## 5. Search indexes

- **Primary search engine = Meilisearch** (TRD §4): typo-tolerant, faceted,
  instant — it owns product **search/autocomplete/relevance**
  (business-architecture/05). The catalog is the source of truth; the index is a
  **derived projection** kept in sync.
- **PostgreSQL is the relational backstop** for search-adjacent queries:
  - **Trigram (GIN, `pg_trgm`)** on `products.name`, `categories.name` for
    `ILIKE`/fuzzy admin search and as a fallback if Meilisearch is unavailable.
  - **Full-text (`tsvector` + GIN)** optional for blog/content search.
  > `pg_trgm` is a PostgreSQL extension — enabling it is a migration/infra
  > decision (no dependency added here).

## 6. GIN & JSON(B) indexes

- **JSONB columns** (`products.attributes`, `settings.value`, `payments.response`,
  `warehouses.address`) get **GIN** indexes **only where queried**:
  - `products.attributes` → GIN for attribute/facet filtering (fit, fabric).
  - `settings.value`, `payments.response` are mostly read by key/whole-document →
    GIN usually **not** needed (avoid index bloat).
- **Array columns** (if introduced, e.g. tags) use GIN.
- **Why JSONB + GIN selectively:** flexible attributes avoid schema churn, but
  every GIN index has write cost — index only the documents you actually filter on.

## 7. Performance considerations

- **Covering/INCLUDE indexes** for hot read paths (e.g. PLP returning a few
  columns) to enable index-only scans.
- **Partial indexes** beyond uniqueness: e.g. `orders(orderStatus) WHERE
  orderStatus IN ('PENDING','CONFIRMED','PACKED')` keeps the admin "to-fulfil"
  queue index small.
- **Avoid over-indexing**: each index slows writes (10k orders/day, frequent
  inventory updates). Index to measured query patterns, not speculatively.
- **Hot-row contention**: inventory rows are high-write during sales; keep them
  narrow, consider row-level locking discipline (handled in app/tx design).
- **Pagination** (`?page&limit&sort&order`, 005) should prefer **keyset/seek**
  pagination on indexed, time-ordered columns (UUID v7 / `createdAt`) over large
  `OFFSET` for deep pages.
- **Time-series growth** (orders, audit_logs, notifications) are future
  **partitioning** candidates by month/range ([10](./10-future-expansion.md)).
- Index maintenance (`REINDEX`/autovacuum tuning) is an ops concern, noted for
  the runbook, not configured here.
