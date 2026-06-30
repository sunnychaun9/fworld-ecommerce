# 01 · Domain Model

**Status:** Blueprint (no implementation).
**Maps:** [`004_DATABASE.md`](../004_DATABASE.md) tables ↔
[business-architecture/01](../business-architecture/01-business-domains.md) domains.

This translates business domains into a **persistence-oriented domain model**:
entities, the **aggregate roots** that own consistency boundaries, the **bounded
contexts** that group them, and **who owns what**. It defines *what data exists
and how it clusters* — not columns (see [03](./03-table-specifications.md)).

## 1. Aggregates & aggregate roots

An **aggregate** is a cluster of entities that must stay transactionally
consistent and is always modified through its **root**. This is the unit of
write-consistency and the natural transaction boundary.

| Aggregate root | Members (owned) | Why grouped (consistency rule) |
| --- | --- | --- |
| **User** | Address(es) | A customer's identity + contact must be consistent; addresses have no life without their user. **Credentials, linked identities, sessions, and verification are owned by Better Auth** (`account`/`session`/`verification`), not this aggregate (auth-architecture/10) |
| **Product** | ProductImage(s), ProductVariant(s) | A product and its sellable variants/media are published/retired as one unit |
| **Inventory** | InventoryRecord per (variant, warehouse) | Stock math (available/reserved) must be atomic to prevent oversell (BRD §20) |
| **Cart** | CartItem(s) | A basket and its lines are priced/validated together |
| **Order** | OrderItem(s), OrderAddress snapshot, Payment(s), Shipment(s), Return(s) | A placed order and everything financial/fulfilment about it must be consistent and **immutable for history** |
| **Coupon** | CouponRedemption(s) | Usage limits enforced against the coupon atomically |
| **Review** | — | Independent UGC entity tied to product + author |
| **Blog/Content** | — | Editorial content lifecycle |
| **Notification** | — | Append-style messaging record |
| **Setting** | — | Key/value configuration |
| **Warehouse** | — | Fulfilment location (future-active; see DB-4) |

> Cross-aggregate references are **by ID only** (e.g. `OrderItem` references a
> `ProductVariant` id), never by embedding another aggregate. Aggregates are
> updated in separate transactions and reconciled by domain events/workflows.

## 2. Bounded contexts → tables

Grouping of the `004` tables (plus reported additions) under the
business-architecture contexts:

| Bounded context | Tables (004 + ⊕ additions) | Owns |
| --- | --- | --- |
| **Identity & Customer** | `users` (extended Better Auth user), `addresses` + **Better Auth-owned** `account`, `session`, `verification` | identity, contact, consent |
| **Catalog & Merchandising** | `categories`, `brands`, `products`, `product_images`, `product_variants` | catalog truth, taxonomy, media refs |
| **Inventory** | `inventory` ⊕ `warehouses` | availability (single source of truth) |
| **Promotions** | `coupons` ⊕ `coupon_redemptions` | discount rules & usage |
| **Cart & Checkout** | `carts`, `cart_items` | basket state, pricing inputs |
| **Orders & Fulfilment** | `orders`, `order_items` ⊕ `order_addresses`, `shipments`, `returns`, `return_items` | the commercial record |
| **Payments** | `payments` | money movement records |
| **Reviews / UGC** | `reviews` | ratings & reviews |
| **Content, Brand & SEO** | `blogs` | editorial content |
| **Engagement** | `notifications` | lifecycle messages |
| **Administration & Ops** | `settings` ⊕ `audit_logs` | configuration, audit trail |

`⊕` marks entities **not present in `004`** that the business architecture
requires — reported as DB-2/3/4/5/6/16/17, not assumed approved.

## 3. Ownership rules (single source of truth)

| Concept | Owned by | Others must… |
| --- | --- | --- |
| **Availability / stock** | `inventory` | read it; never store their own stock count |
| **List price** | `product_variants` / `products` | reference; coupons compute discount, never overwrite price |
| **Discount logic** | `coupons` (+ redemptions) | apply; orders store the *resulting* discount amount |
| **Authoritative order totals** | `orders` (computed at checkout, server-side) | snapshot at write time |
| **Authoritative payment state** | `payments` (gateway truth) | orders roll it up into `paymentStatus` |
| **Identity/auth** | **Better Auth** (owns `user`/`account`/`session`/`verification`; DB-5 resolved) | reference `users.id`; never store credentials/providers elsewhere |

> ✅ **DB-15 (stock ownership) — Approved by CTO.** **Inventory is the only source
> of truth** for stock. `product_variants` carries **catalog information only** (no
> stock field); **`inventory` owns all stock quantities** and **Inventory
> Reservation controls sellable stock**. **No duplicated stock fields.**

## 4. Entity catalogue (business meaning)

| Entity | Business meaning | Domain |
| --- | --- | --- |
| User | A registered person (the extended Better Auth user); **guests are not users** (auth-architecture/07) | Identity |
| Address | A delivery/billing location for a user | Identity |
| Category | Browsable taxonomy node (self-nesting) | Catalog |
| Brand | Product brand/label (private-label ready) | Catalog |
| Product | A marketable style | Catalog |
| ProductImage | Media for a product | Catalog |
| ProductVariant | A sellable SKU (color × size) | Catalog |
| Warehouse ⊕ | A fulfilment location | Inventory |
| Inventory | Stock per variant (per warehouse) | Inventory |
| Coupon | A discount rule | Promotions |
| CouponRedemption ⊕ | A usage record enforcing limits | Promotions |
| Cart / CartItem | Basket and its lines | Cart |
| Order / OrderItem | Placed order and its lines (price snapshot) | Orders |
| OrderAddress ⊕ | Immutable ship-to/bill-to snapshot | Orders |
| Payment | A payment/refund attempt + gateway response | Payments |
| Shipment ⊕ | A courier shipment (AWB, tracking) | Fulfilment |
| Return / ReturnItem ⊕ | A return request + its items | Returns |
| Review | Product rating/review (verified-purchase ⚠ DB-12) | UGC |
| Blog | Editorial article | Content |
| Notification | A customer message | Engagement |
| Setting | Key/value config | Admin |
| AuditLog ⊕ | Append-only change record (012) | Admin |

## 5. Transactional boundaries (what must be atomic)

- **Checkout → Order creation**: reserve inventory, create order + items + address
  snapshot, create initial payment — coordinated so stock is never oversold
  (saga/transaction; see [business-architecture/07](../business-architecture/07-checkout-architecture.md)).
- **Coupon application**: validate + increment redemption atomically against the
  usage limit.
- **Inventory adjustment**: available/reserved updates are atomic.
- **Order state transition**: order roll-up + payment/shipment truth reconcile via
  events, not a single giant transaction across external systems.
