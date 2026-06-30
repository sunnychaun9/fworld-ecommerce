# 02 · Entity Relationships

**Status:** Blueprint (no implementation — no SQL).
**Basis:** `004` Relationships section, expanded with cardinality and cascade
semantics under a **soft-delete** regime.

## 1. Relationship inventory

Notation: `A 1—N B` = one A has many B. `(⊕)` = relationship involves an entity
not in `004` (reported gap).

### One-to-one (1:1)

| Relationship | Notes |
| --- | --- |
| `product_variants 1—1 inventory` *(single-warehouse)* | Becomes **1—N** under multi-warehouse (one row per warehouse). ⚠ DB-4/DB-15 |
| `orders 1—1 order_addresses` (⊕) | Immutable ship-to/bill-to snapshot per order. ⚠ DB-17 |
| `users 1—1 cart` (active cart) | A user has at most one **active** cart; historical carts may exist. |

### One-to-many (1:N)

| Parent | Child | Cardinality | Source |
| --- | --- | --- | --- |
| users | addresses | 1—N | 004 |
| users | orders | 1—N | 004 |
| users | reviews | 1—N | 004 |
| users | notifications | 1—N | 004 |
| categories | categories (self) | 1—N (parent→children) | 004 (`parentCategory`) |
| categories | products | 1—N | 004 |
| brands | products | 1—N | 004 |
| products | product_images | 1—N | 004 |
| products | product_variants | 1—N | 004 |
| warehouses (⊕) | inventory | 1—N | DB-4 |
| product_variants | inventory | 1—N (multi-WH) / 1—1 (single) | 004 + DB-15 |
| carts | cart_items | 1—N | 004 |
| orders | order_items | 1—N | 004 |
| orders | payments | **1—N** (attempts + refunds) | ⚠ DB-11 (004 implies 1:1) |
| orders | shipments (⊕) | 1—N (splits) | DB-3 |
| orders | returns (⊕) | 1—N | DB-2 |
| returns (⊕) | return_items (⊕) | 1—N | DB-2 |
| coupons | coupon_redemptions (⊕) | 1—N | DB-6 |
| products | reviews | 1—N | 004 |

### Many-to-many (M:N) — resolved via join entities

| A | B | Join entity | Extra attributes on join |
| --- | --- | --- | --- |
| users | products | `wishlist` | (timestamp) — 004 |
| carts | product_variants | `cart_items` | quantity, price snapshot — 004 |
| orders | product_variants | `order_items` | quantity, price, tax, discount snapshot — 004 |
| users | coupons | `coupon_redemptions` (⊕) | redeemed_at, order_id — DB-6 |
| products | warehouses (⊕) | `inventory` | available/reserved stock — DB-4 |

> All M:N are modeled as **explicit join tables with their own UUID PK and audit
> columns** (not implicit Prisma relations), because each carries business data
> (quantities, price snapshots, usage) — never a bare link table.

## 2. Cardinality summary (key rules)

- A **ProductVariant** is the join target for cart/order/inventory — it is the
  true "sellable unit", so quantities and stock always hang off the variant, not
  the product.
- **Order lines snapshot price/tax/discount** at purchase time; they do **not**
  follow later catalog price changes (financial/invoice integrity).
- **Wishlist** references `product` (style-level) while **cart/order** reference
  `product_variant` (size/color), matching how customers behave (save the style,
  buy the SKU). Consistent with `004`.

## 3. Cascade & referential rules

Because the schema uses **soft delete** (`deletedAt`), there are two layers:

### 3.1 Physical foreign keys (DB-enforced)

Default stance: **`ON DELETE RESTRICT`** (no physical row deletion of a parent
that has children). Rationale: orders, payments, invoices, and audit history must
never be silently destroyed (GST/financial integrity — BRD §20, [09](./09-data-retention.md)).

| FK | On parent **physical** delete | Why |
| --- | --- | --- |
| address → user | RESTRICT | preserve order address history |
| order_item → order | CASCADE (within aggregate) | items have no life without their order, but orders are effectively never hard-deleted |
| order → user | RESTRICT | never destroy financial records on user delete |
| payment → order | RESTRICT | money records are immutable |
| cart_item → cart | CASCADE | cart lines are disposable within the cart aggregate |
| product_variant → product | RESTRICT | protect order/inventory references |
| inventory → variant / warehouse | RESTRICT | protect stock integrity |
| review → user / product | RESTRICT (soft delete instead) | keep UGC integrity / moderation trail |

> Physical `CASCADE` is permitted **only inside an aggregate** (e.g. cart→cart_items)
> where children are meaningless without the root and are not financial records.

### 3.2 Logical cascade (soft delete)

| Action | Logical behavior |
| --- | --- |
| Soft-delete a **user** | Anonymize PII, set `deletedAt`; **retain** orders/payments/invoices (legal hold — [09](./09-data-retention.md)); cascade soft-delete addresses/cart/wishlist |
| Soft-delete a **product** | Set `deletedAt` → hidden from storefront; **variants** soft-deleted; **order_items keep** their snapshot (no cascade into history) |
| Soft-delete a **category** | Block if it has active products (RESTRICT-style) or reassign; keep SEO redirect ([03](./03-table-specifications.md)) |
| Soft-delete a **coupon** | Stop new redemptions; keep redemption history |

> **Rule:** soft delete **never** cascades into financial/historical records
> (orders, order_items, payments, invoices, audit_logs). It cascades only into
> "live" owned children (addresses, cart_items, variants' storefront visibility).

## 4. Referential integrity notes

- Every FK column is **indexed** (see [05](./05-indexing-strategy.md)) — Postgres
  does not auto-index FKs, and unindexed FKs cause slow joins and lock contention.
- FK targets are always the parent's **UUID PK**.
- Nullable FKs (`createdBy`, `updatedBy`, optional `brandId`) use `ON DELETE SET
  NULL` where the link is informational rather than structural.
