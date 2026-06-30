# FWorld Database Blueprint

**Status:** Specification / blueprint (no implementation)
**Date:** 2026-06-29
**Database:** PostgreSQL · **ORM (future):** Prisma · **Keys:** UUID v7
**Authoritative source:** [`004_DATABASE.md`](../004_DATABASE.md) (schema),
supported by [`003_TRD.md`](../003_TRD.md) §8, [`005_API.md`](../005_API.md),
[`012_ADMIN_PANEL.md`](../012_ADMIN_PANEL.md), and the
[business-architecture](../business-architecture/) set.

This section is the **production-grade database blueprint**: domain model, ER
design, table specifications, enumerations, indexing, audit/soft-delete, UUID,
migration, retention, and future-expansion strategy.

> **Hard boundaries (per task):** no SQL, no Prisma models, no migrations, no
> `package.json` edits, no dependencies. This is a **blueprint**. Where `004`
> already defines something, this document **elaborates** it; where `004` is
> silent or inconsistent, the gap is **reported** (see §Conflict register and
> [final report]) and routed to CTO approval — **never silently changed**.

## How to read

| #  | Document | Scope |
| -- | -------- | ----- |
| 01 | [Domain Model](./01-domain-model.md) | Entities, aggregate roots, bounded contexts, ownership |
| 02 | [Entity Relationships](./02-entity-relationship.md) | Cardinality, 1:1 / 1:N / M:N, cascade rules |
| 03 | [Table Specifications](./03-table-specifications.md) | Per-table columns, types, constraints, keys, indexes |
| 04 | [Enumerations](./04-enumerations.md) | Every enum + allowed values + rationale |
| 05 | [Indexing Strategy](./05-indexing-strategy.md) | Primary, composite, search, GIN, JSON, partial |
| 06 | [Audit & Soft Delete](./06-audit-soft-delete.md) | Audit columns, soft-delete rules, audit trail |
| 07 | [UUID Strategy](./07-uuid-strategy.md) | UUID v7, why not auto-increment |
| 08 | [Migration Strategy](./08-migration-strategy.md) | Forward-only, rollback, prod process, seeding |
| 09 | [Data Retention](./09-data-retention.md) | Retention, erasure, legal holds (GST, DPDP) |
| 10 | [Future Expansion](./10-future-expansion.md) | Women/Kids, multi-warehouse, marketplace, loyalty, … |

## Design principles (from `004` + TRD §8)

1. **UUID v7 primary keys** — never auto-increment (see [07](./07-uuid-strategy.md)).
2. **Soft delete** via `deletedAt` on every table except append-only logs.
3. **Audit columns** on every table: `createdAt`, `updatedAt`, `deletedAt`,
   `createdBy`, `updatedBy`.
4. **Normalized, ACID** schema; money never stored as float.
5. **Indexed search**; Meilisearch is the primary search engine (TRD §4) with
   PostgreSQL indexes as the relational backstop.
6. **Future-ready** (multi-warehouse, women/kids, marketplace, i18n) by additive
   design, not rewrites.

## Naming convention (⚠ decision — see DB-1)

The Engineering Handbook (Part 2) mandates **snake_case** for database tables and
columns, but [`004_DATABASE.md`](../004_DATABASE.md) lists **camelCase** columns
(`createdAt`, `productVariantId`). This blueprint documents **logical** column
names as written in `004` for traceability, and recommends the physical store be
**snake_case** with Prisma `@map`/`@@map` mapping model fields (camelCase) to
snake_case columns. **This requires CTO ratification before implementation.**

## Conflict register (reported, not resolved)

Full detail and rationale appear in each linked document and in the final report.

| ID | Inconsistency / gap | Source tension | Where |
| --- | --- | --- | --- |
| DB-1 | ✅ **Approved by CTO**: DB columns/tables **snake_case**; Prisma models **camelCase via `@map`/`@@map`**; API JSON camelCase | api-architecture D10 | this README; [03](./03-table-specifications.md) |
| DB-2 | **Returns** entity not modeled in `004` | 004 vs BRD §15 / PRD FR-050 / 012 / biz-arch 08 | [01](./01-domain-model.md), [03](./03-table-specifications.md) |
| DB-3 | **Shipment** entity not modeled (only `Orders.shippingStatus`) | 004 vs Shiprocket needs / biz-arch 08 | [03](./03-table-specifications.md) |
| DB-4 | **Warehouse** table missing although `Inventory.warehouseId` references it | 004 internal | [03](./03-table-specifications.md), [10](./10-future-expansion.md) |
| DB-5 | ✅ **RESOLVED** (auth freeze): Better Auth owns `user`/`account`/`session`/`verification`; `password`/`provider` removed from `users`; user extended via Prisma | auth-architecture/10, Q10 | [01](./01-domain-model.md), [03](./03-table-specifications.md) |
| DB-6 | **Coupon redemption** ledger missing; `Orders` has no `couponId` | 004 vs 012 (usage limit) | [03](./03-table-specifications.md) |
| DB-7 | **GST modeling** insufficient: single `tax` field, no CGST/SGST/IGST split, no HSN code, no place-of-supply | 004 vs BRD §20 | [03](./03-table-specifications.md), [09](./09-data-retention.md) |
| DB-8 | ✅ **Approved by CTO**: money is **`Decimal(12,2)`** (INR) in the DB and **serialized as strings** on the API | api-architecture D9 | [03](./03-table-specifications.md) |
| DB-9 | ✅ **RESOLVED** (auth freeze): guests are not DB users and have **no DB cart**; guest cart state is ephemeral (cookie/localStorage/Redis), merged into a user cart on auth | auth-architecture/07, Q5 | [03](./03-table-specifications.md) |
| DB-10 | **WishlistVisibility** requested but `Wishlist` has no visibility; sharing is future | task/04 vs 004/BRD §19 | [04](./04-enumerations.md) |
| DB-11 | **Payment cardinality**: Order↔Payment 1:1 vs retries/refunds (1:N) | 004 vs biz-arch 07/08 | [02](./02-entity-relationship.md) |
| DB-12 | **Verified-purchase reviews**: `Reviews` lacks order/variant link | 004 vs biz-arch 02 | [03](./03-table-specifications.md) |
| DB-13 | ✅ **Approved by CTO**: **UUID v7 generated at the application layer** (works on PostgreSQL 16; not the DB default) | CTO decision | [07](./07-uuid-strategy.md) |
| DB-14 | **InventoryStatus** has no column (derived from stock) | task/04 vs 004 | [04](./04-enumerations.md) |
| DB-15 | ✅ **Approved by CTO**: **Inventory is the only source of truth** for stock; `product_variants` is catalog-only (no stock field); Inventory Reservation controls sellable stock; no duplicated stock fields | CTO decision | [01](./01-domain-model.md), [03](./03-table-specifications.md) |
| DB-16 | ✅ **RESOLVED** (auth freeze): OTP/verification stored in Better Auth's `verification` table | auth-architecture/05, /10 | [03](./03-table-specifications.md) |
| DB-17 | **Order address snapshot** missing (`Orders` has no immutable ship-to) | 004 vs invoice immutability | [03](./03-table-specifications.md) |
| DB-18 | **Notification channel** vs type ambiguous (email/SMS/push) | 004 vs 013/biz-arch 10 | [04](./04-enumerations.md) |

> Prior cross-doc conflicts **C1 (auth provider)**, **C2 (COD)**, **C5 (single vs
> multi-warehouse)**, **C6 (COD refund)** from the business-architecture register
> also bear on the schema and are cross-referenced where relevant.
