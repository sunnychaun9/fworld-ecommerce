# 10 · Future Expansion

**Status:** Blueprint (no implementation).
**Goal:** show how the schema absorbs the BRD §19 / PRD §7 / Roadmap Phase 8
roadmap **additively** — new columns/tables/joins, **no rewrites of core tables**.
**Basis:** the future domains reserved in
[business-architecture/01](../business-architecture/01-business-domains.md).

> Design rule: extend by **adding** (columns, tables, join tables, lookup rows),
> never by reshaping `orders`/`payments`/`products` in breaking ways. UUID v7 keys,
> JSONB attribute bags, and explicit join tables are the main extension seams.

## 1. Women's & Kids' Fashion

- **Seam:** `products.gender` (`Department` enum: MEN→WOMEN/KIDS/UNISEX) +
  self-nesting `categories`. **No new core tables.**
- Size systems differ (kids age-based, women's numeric) → handled by
  `product_variants.size` (free-ish text) + `products.attributes` (JSONB) and a
  future **size-chart** table per category. Additive.
- **Why it fits:** the catalog never assumed "men" structurally — gender is an
  attribute, taxonomy is data-driven (03/§taxonomy).

## 2. Multi-Warehouse (DB-4, ⚠ C5)

- **Already seeded:** `inventory.warehouseId` + a `warehouses` table. Single active
  WH at launch (PRD §15); adding warehouses is **inserting rows**, and inventory
  becomes **1—N per variant** (one row per WH).
- Adds later: order-routing/allocation table, per-WH fulfilment on `shipments`.
- **Why no rewrite:** stock was modeled per `(variant, warehouse)` from day one.

## 3. Marketplace / Multi-Vendor

- **New tables:** `vendors`/`sellers`, and a nullable `vendorId` on `products`
  (and `orders`/`order_items` for split settlements). Null `vendorId` = first-party
  (FWorld) — existing data stays valid.
- Adds: payout/commission ledger, vendor users (RBAC role).
- **Why additive:** first-party is "vendor null"; no existing row changes meaning.
- ⚠ Major business pivot, explicitly **out of V1** (PRD §15) — listed for shape
  only.

## 4. Loyalty & Rewards

- **New tables:** `loyalty_accounts` (per user, points balance) + an **append-only
  `loyalty_ledger`** (earn/burn events tied to orders). Cart/checkout read balance;
  no change to `orders` beyond an optional `pointsRedeemed` column.
- **Why ledger, not a mutable balance:** auditable points history; balance is a
  fold over the ledger.

## 5. Gift Cards

- **New tables:** `gift_cards` (code, initial/remaining value, status) +
  `gift_card_transactions` (issue/redeem/refund). At checkout, gift card is a
  **tender type** → add `GIFT_CARD` to `PaymentMethod`/`PaymentTxnType` and a
  payment row. Additive enum value + table.

## 6. Subscriptions

- **New tables:** `subscription_plans`, `subscriptions` (user, plan, status,
  next-billing), `subscription_invoices`. Recurring orders reuse the existing
  `orders` pipeline. Adds a `subscriptionId` nullable on `orders`.
- **Why:** orders remain the fulfilment unit; subscriptions sit beside them.

## 7. Internationalization (i18n)

- **Currency:** add `currency` + minor-unit handling on money-bearing tables (INR
  default today). **Why a column, not a rewrite:** single-currency now (PRD §15),
  multi-currency later without touching amounts' semantics.
- **Language:** a `translations` table (entity, entityId, locale, field, value)
  for product/category/content copy — keeps core rows single-locale and adds
  locales as rows. Regional languages (BRD §19) for tier-2/3.
- **Tax/region:** GST today; a `tax_regions`/`tax_rules` table generalizes tax for
  cross-border later (connects to DB-7 GST work).

## 8. AI Recommendations & Search

- **New tables:** `user_events` (append-only behavioral stream: view/cart/purchase)
  and a derived `recommendations`/feature store. Meilisearch already owns search;
  **semantic/vector search** later via a vector index/extension or external store.
- **Why separate event stream:** keeps transactional tables clean; ML reads from a
  purpose-built, partitioned event table ([05](./05-indexing-strategy.md)).

## 9. Cross-cutting scalability seams

| Seam | Enables |
| --- | --- |
| **JSONB `attributes`** on products | new attributes without migrations |
| **Explicit join tables** (cart_items, order_items, redemptions, inventory) | adding attributes to relationships |
| **UUID v7 keys** | sharding, multi-region, offline import without ID collisions |
| **Lookup tables** for volatile enums | business-managed values without migrations |
| **Append-only ledgers/events** (audit, loyalty, user_events) | history + ML without mutating core |
| **Range partitioning** (orders, audit_logs, user_events by month) | volume growth at 10k orders/day+ |
| **Snapshots** (order_items, order_addresses) | history immune to catalog/PII changes |

## 10. What stays frozen

`orders`, `order_items`, `payments`, `audit_logs`, and invoice data are
**append-mostly and immutable** — future features attach **beside** them (new
tables, nullable FKs, additive enum values), never reshape them. This is the
guarantee that the roadmap above needs **no major schema rewrite**.
