# 04 · Enumerations

**Status:** Blueprint (no implementation).
**Basis:** `004` status fields, `012` order/return states,
[business-architecture/08](../business-architecture/08-order-lifecycle.md) state
machines. Every enum lists values, default, whether **stored or derived**, and
**why**.

## Enum management policy (WHY)

- **Native PostgreSQL enums** are used for **small, stable** sets (roles,
  statuses) — they are compact, self-documenting, and type-safe.
- **Lookup tables** are preferred where the set is **business-managed or grows
  often** (e.g. notification categories, payment methods that marketing toggles),
  because PostgreSQL enums cannot drop a value and reordering requires a migration.
- Adding an enum value is a **forward-only migration** ([08](./08-migration-strategy.md)).
- Enums map 1:1 to Prisma enums (future) — values are **UPPER_SNAKE_CASE**
  (Handbook constant convention).

---

## Identity

### `UserRole`
`GUEST · CUSTOMER · SUPPORT · MANAGER · ADMIN · SUPER_ADMIN` (default `CUSTOMER`).
**Why:** the approved RBAC role set (auth-architecture/04). Authorization is
enforced by controller guards + service-layer ownership; granular per-role
permissions are finalized in the admin sprint (09 admin).

### `UserStatus`
`ACTIVE · BLOCKED` (default `ACTIVE`). Optional `PENDING` for unverified.
**Why:** moderation/abuse control without deleting accounts.

### `AuthProvider` — **owned by Better Auth `account`** (not a `users` column)
`EMAIL · OTP · GOOGLE · APPLE` (BRD §12, PRD FR-001..004).
**Why:** sign-in methods. **DB-5 resolved:** linked identities are **rows in Better
Auth's `account` table** (one per provider), not a single `provider` column on
`users` — so a user can link email + Google + Apple simultaneously
(auth-architecture/10). The provider values above describe `account.provider`.

### `AddressType`
`SHIPPING · BILLING` (default `SHIPPING`).
**Why:** GST-compliant invoices may need a billing address distinct from delivery.

---

## Catalog & Inventory

### `ProductStatus`
`DRAFT · ACTIVE · OUT_OF_STOCK · ARCHIVED` (default `DRAFT`).
**Why:** product lifecycle (business-architecture/03). `OUT_OF_STOCK` is normally
**derived** from inventory, not set by hand, to avoid overselling (BRD §20). Reused
for category/brand active/archived.

### `Department` (gender)
`MEN` (default) · `WOMEN · KIDS · UNISEX` (future).
**Why:** men-only at launch (BRD), but reserving the axis lets women/kids attach
without a rewrite ([10](./10-future-expansion.md)).

### `InventoryStatus` — **derived, not stored** (⚠ DB-14)
`IN_STOCK · LOW_STOCK · OUT_OF_STOCK`.
**Why:** `004` stores numeric stock, not a status. This enum is computed
(`available = 0` → out; `available ≤ lowStockAlert` → low; else in-stock). Stored
only if a materialized status is needed for fast filtering.

### `WarehouseStatus` ⊕
`ACTIVE · INACTIVE` (default `ACTIVE`).
**Why:** multi-warehouse readiness (DB-4); single active WH at launch (PRD §15).

---

## Promotions

### `CouponType`  *(004 `discountType`)*
`PERCENTAGE · FLAT`.
**Why:** matches `004` (percentage/flat) and 012 (with min-order/max-discount).

### `CouponStatus`
`ACTIVE · INACTIVE · SCHEDULED · EXPIRED`.
**Why:** `SCHEDULED`/`EXPIRED` may be **derived** from `validFrom/validTo`; stored
status lets admins force-disable a coupon instantly.

---

## Cart

### `CartStatus`
`ACTIVE · ABANDONED · CONVERTED · MERGED` (default `ACTIVE`).
**Why:** the **authenticated**-cart lifecycle (business-architecture/06); enables
abandoned-cart recovery. **Note:** guests have **no DB cart** (auth-architecture/07,
Q5) — guest state is ephemeral (cookie/localStorage/Redis) and is merged **into**
the user's cart on authentication; `MERGED` therefore applies to consolidating a
user's own carts, never a guest DB row.

---

## Orders, Payments, Shipping, Returns

### `OrderStatus`
`PENDING · CONFIRMED · PACKED · SHIPPED · OUT_FOR_DELIVERY · DELIVERED ·
CANCELLED · RETURNED · REFUNDED` (default `PENDING`).
**Why:** the 012 order states plus `OUT_FOR_DELIVERY` from the lifecycle
(business-architecture/08). This is the **order roll-up**; shipment detail lives in
`ShipmentStatus`.

### `PaymentStatus`
`PENDING · PAID · FAILED · REFUNDED · PARTIALLY_REFUNDED` (default `PENDING`).
**Why:** `004`/`012` track payment + refund; `PARTIALLY_REFUNDED` supports partial
returns ([10](./10-future-expansion.md)).

### `PaymentMethod`
`UPI · CREDIT_CARD · DEBIT_CARD · NET_BANKING` · ⚠ `COD`.
Future: `WALLET · EMI · BNPL` (BRD §14).
**Why:** BRD §14 methods (UPI-first for India). **`COD` is conditional on the C2
decision** (BRD §13 lists COD support but §14 omits it).

### `PaymentTxnType` ⊕
`PAYMENT · REFUND` (default `PAYMENT`).
**Why:** one order has many payment rows (attempts + refunds) — DB-11.

### `ShipmentStatus` ⊕
`PENDING · READY_TO_SHIP · SHIPPED · IN_TRANSIT · OUT_FOR_DELIVERY · DELIVERED ·
RTO · CANCELLED · LOST` (default `PENDING`).
**Why:** Shiprocket fulfilment detail incl. **RTO** (a first-class India/COD cost —
business-architecture/08). Not in `004` (DB-3).

### `ReturnStatus` ⊕
`REQUESTED · APPROVED · REJECTED · PICKUP_SCHEDULED · PICKED_UP · IN_QC ·
REFUNDED · CLOSED` (default `REQUESTED`).
**Why:** the 7-day return workflow (BRD §15, business-architecture/08). Not in
`004` (DB-2).

### `RefundMethod` ⊕
`ORIGINAL · BANK_TRANSFER · UPI` · `WALLET` (future).
**Why:** prepaid refunds reverse to source; **COD refunds need a payout** (⚠ **C6**)
— surfaces the unresolved COD-refund decision.

---

## UGC, Content, Engagement

### `ReviewStatus`
`PENDING · APPROVED · REJECTED` (default `PENDING`).
**Why:** moderation before public display (trust; review-fraud control,
business-architecture/10).

### `ContentStatus` (blog)
`DRAFT · PUBLISHED · ARCHIVED` (default `DRAFT`).
**Why:** `004` blogs imply publish flow (`publishedAt`) but define no status.

### `NotificationType`
`ORDER · PAYMENT · SHIPPING · PROMOTION · ACCOUNT · SYSTEM`.
**Why:** categorizes messages for preferences/filtering. (`004` `type` is
untyped.)

### `NotificationChannel` ⊕ (⚠ DB-18)
`IN_APP · EMAIL · SMS · PUSH` (default `IN_APP`).
**Why:** the same notification may go across channels (Resend email, MSG91 SMS
future, push); `004` conflates type and channel.

### `WishlistVisibility` ⊕ (⚠ DB-10)
`PRIVATE` (default) · `PUBLIC · SHARED` (future).
**Why:** requested by the task, but **wishlist sharing is a future feature**
(BRD §19) and `004` has no visibility column — enum reserved, only `PRIVATE`
active at launch.

---

## Mapping summary

| Enum | Stored on | In `004`? |
| --- | --- | --- |
| UserRole, UserStatus | `users` (the extended Better Auth user) | `role`/`status` columns |
| AuthProvider | Better Auth **`account`** (not `users`) | provider per linked identity (resolves DB-5) |
| AddressType | addresses | ⊕ |
| ProductStatus, Department | products/categories/brands | partial (`status`); Department ⊕ |
| InventoryStatus | *(derived)* | ⊕ derived |
| WarehouseStatus | warehouses | ⊕ |
| CouponType, CouponStatus | coupons | `discountType`,`status` |
| CartStatus | carts | ⊕ |
| OrderStatus, PaymentStatus, PaymentMethod, ShipmentStatus | orders | yes (status fields) |
| PaymentTxnType | payments | ⊕ |
| ShipmentStatus | shipments | ⊕ |
| ReturnStatus, RefundMethod | returns | ⊕ |
| ReviewStatus | reviews | `status` |
| ContentStatus | blogs | ⊕ |
| NotificationType, NotificationChannel | notifications | `type`; channel ⊕ |
| WishlistVisibility | wishlist | ⊕ (future) |
