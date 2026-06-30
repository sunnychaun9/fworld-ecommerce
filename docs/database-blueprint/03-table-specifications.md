# 03 · Table Specifications

**Status:** Blueprint (no SQL, no Prisma, no migrations).
**Basis:** [`004_DATABASE.md`](../004_DATABASE.md) tables, elaborated to
production grade. `⊕` = table **not in `004`** (reported gap, needs approval).

## Conventions

- **Types** are logical (PostgreSQL family): `uuid`, `citext`, `text`,
  `varchar(n)`, `numeric(p,s)`, `int`, `smallint`, `boolean`, `timestamptz`,
  `jsonb`, `enum(<Name>)` (see [04](./04-enumerations.md)).
- **Money** = `numeric(12,2)` in **INR** (single currency, PRD §15). Never float
  (DB-8). Minor-unit (paise) storage is an alternative pending CTO call.
- **Column case** shown as in `004` (camelCase); physical store recommended
  snake_case via mapping (DB-1).
- **Common audit columns** (on every table **except** `audit_logs`), not repeated
  per table below:

| Column | Type | Null | Default | Notes |
| --- | --- | --- | --- | --- |
| `id` | uuid | no | UUID v7 (app-generated, DB-13) | Primary key |
| `createdAt` | timestamptz | no | `now()` | |
| `updatedAt` | timestamptz | no | `now()` (bumped on update) | |
| `deletedAt` | timestamptz | yes | null | Soft delete ([06](./06-audit-soft-delete.md)) |
| `createdBy` | uuid | yes | null | FK → users.id, `ON DELETE SET NULL` |
| `updatedBy` | uuid | yes | null | FK → users.id, `ON DELETE SET NULL` |

> **Unique + soft delete:** every "unique" below is a **partial unique index**
> `WHERE deletedAt IS NULL`, so a soft-deleted row's value can be reused (DB-1/06).

---

## Identity & Customer

### `users`

Purpose: a person who can browse, buy, review. **This is Better Auth's `user`
table, _extended_** with FWorld fields below (auth-architecture/10) — it is the
single source of truth; **there is no parallel users table**. Guests are **not**
users (auth-architecture/07).

| Column | Type | Null | Default | Key / Constraint | Notes |
| --- | --- | --- | --- | --- | --- |
| name | varchar(120) | yes | null | | display name |
| email | citext | yes | null | unique (partial) | case-insensitive; nullable for phone-only signups |
| phone | varchar(20) | yes | null | unique (partial) | E.164; primary identifier for OTP (India) |
| avatar | text | yes | null | | media URL |
| role | enum(UserRole) | no | `CUSTOMER` | | RBAC (auth-architecture/04) |
| status | enum(UserStatus) | no | `ACTIVE` | | active/blocked |
| lastLogin | timestamptz | yes | null | | |
| emailVerified | boolean | no | false | | managed by Better Auth |
| phoneVerified | boolean | no | false | | |

Indexes: `email`, `phone`, `role`, `status`. At least one of email/phone required
(check constraint).

> **Better Auth ownership (auth-architecture/01, /10):** authentication
> **credentials** and **linked identities** are **not** stored on `users`. Better
> Auth owns `account` (hashed credentials + **one row per linked provider** —
> email/Google/Apple), `session`, and `verification`. The application only
> **extends** Better Auth's `user` with the fields above. (No `password` or
> `provider` column on `users`.)

### `addresses`

Purpose: delivery/billing locations for a user.

| Column | Type | Null | Default | Key | Notes |
| --- | --- | --- | --- | --- | --- |
| userId | uuid | no | | FK → users | |
| type | enum(AddressType) | no | `SHIPPING` | | ⊕ billing/shipping (GST billing) |
| name | varchar(120) | no | | | recipient |
| phone | varchar(20) | no | | | recipient phone |
| address1 | varchar(180) | no | | | |
| address2 | varchar(180) | yes | null | | |
| city | varchar(80) | no | | | |
| state | varchar(80) | no | | | needed for GST place-of-supply |
| country | varchar(80) | no | `India` | | |
| postalCode | varchar(12) | no | | index | pincode (serviceability/COD) |
| isDefault | boolean | no | false | | |

Indexes: `userId`, `postalCode`, partial unique `(userId) WHERE isDefault AND deletedAt IS NULL`.

### Auth tables — **owned by Better Auth** (auth-architecture/01, /10)

Better Auth owns and manages **`user`** (extended above), **`account`** (provider,
providerAccountId, userId, hashed credentials, tokens — **one row per linked
identity**), **`session`** (userId, token, expiresAt, ip, userAgent — DB-backed
sessions), and **`verification`** (identifier, code hash, expiresAt, attempts —
email/phone OTP per auth-architecture/05). These are generated via the Prisma
adapter (UUID v7, snake_case `@map`); the application does **not** define a
parallel auth schema. This **resolves DB-5**.

---

## Catalog

### `categories`

Purpose: self-nesting browsable taxonomy.

| Column | Type | Null | Default | Key | Notes |
| --- | --- | --- | --- | --- | --- |
| name | varchar(120) | no | | | |
| slug | varchar(140) | no | | unique (partial) | SEO URL |
| description | text | yes | null | | |
| image | text | yes | null | | |
| parentCategory | uuid | yes | null | FK → categories (self) | hierarchy; null = root |
| sortOrder | int | no | 0 | | merchandising order |
| status | enum(ProductStatus) | no | `ACTIVE` | | reuse active/archived |
| seoTitle | varchar(180) | yes | null | | |
| seoDescription | varchar(320) | yes | null | | |

Indexes: `slug` (unique), `parentCategory`, `(status, sortOrder)`.

### `brands`

| Column | Type | Null | Default | Key | Notes |
| --- | --- | --- | --- | --- | --- |
| name | varchar(120) | no | | | |
| slug | varchar(140) | no | | unique (partial) | |
| logo | text | yes | null | | |
| description | text | yes | null | | |
| status | enum(ProductStatus) | no | `ACTIVE` | | |

Indexes: `slug` (unique).

### `products`

Purpose: a marketable style.

| Column | Type | Null | Default | Key | Notes |
| --- | --- | --- | --- | --- | --- |
| categoryId | uuid | no | | FK → categories | |
| brandId | uuid | yes | null | FK → brands | optional |
| name | varchar(180) | no | | | |
| slug | varchar(200) | no | | unique (partial) | SEO |
| sku | varchar(64) | yes | null | unique (partial) | product-level code |
| description | text | yes | null | | |
| shortDescription | varchar(320) | yes | null | | |
| price | numeric(12,2) | no | | | list price (MRP) |
| salePrice | numeric(12,2) | yes | null | | display discount (promo logic in coupons) |
| costPrice | numeric(12,2) | yes | null | | margin/reporting (admin-only) |
| taxRate | numeric(5,2) | yes | null | | GST %; ⚠ DB-7 needs HSN + CGST/SGST/IGST |
| hsnCode | varchar(12) | yes | null | | ⊕ GST compliance (DB-7) |
| weight | numeric(8,2) | yes | null | | grams; shipping |
| status | enum(ProductStatus) | no | `DRAFT` | index | lifecycle |
| featured | boolean | no | false | | merchandising |
| newArrival | boolean | no | false | | |
| bestSeller | boolean | no | false | | |
| gender | enum(Department) | no | `MEN` | | ⊕ future women/kids ([10](./10-future-expansion.md)) |
| seoTitle | varchar(180) | yes | null | | |
| seoDescription | varchar(320) | yes | null | | |
| attributes | jsonb | yes | null | GIN | flexible attrs (fit/fabric/occasion) |

Indexes: `slug` (unique), `sku` (unique), `categoryId`, `brandId`, `status`,
`(featured)`, `(newArrival)`, `(bestSeller)`, GIN on `attributes`; name covered by
Meilisearch (see [05](./05-indexing-strategy.md)).

### `product_images`

| Column | Type | Null | Default | Key | Notes |
| --- | --- | --- | --- | --- | --- |
| productId | uuid | no | | FK → products | |
| url | text | no | | | R2/CDN reference |
| altText | varchar(200) | yes | null | | a11y/SEO (mandatory content rule) |
| sortOrder | int | no | 0 | | gallery order |

Indexes: `(productId, sortOrder)`.

### `product_variants`

Purpose: the sellable SKU (color × size). **Catalog information only — no stock
field.** Stock is owned exclusively by `inventory` (CTO-approved; DB-15).

| Column | Type | Null | Default | Key | Notes |
| --- | --- | --- | --- | --- | --- |
| productId | uuid | no | | FK → products | |
| size | varchar(40) | yes | null | | |
| color | varchar(40) | yes | null | | |
| sku | varchar(64) | no | | unique (partial) | variant SKU |
| barcode | varchar(64) | yes | null | unique (partial) | |
| price | numeric(12,2) | yes | null | | overrides product price if set |

Indexes: `productId`, `sku` (unique), `(productId, size, color)` unique (partial).

> ✅ **Stock ownership (DB-15) — Approved by CTO:** `product_variants` holds catalog
> data only; **`inventory` owns all stock quantities** and **Inventory Reservation
> controls sellable stock**. No duplicated stock fields.

---

## Inventory

### `warehouses` ⊕ (DB-4)

| Column | Type | Null | Default | Key | Notes |
| --- | --- | --- | --- | --- | --- |
| name | varchar(120) | no | | | |
| code | varchar(40) | no | | unique (partial) | |
| address | jsonb | yes | null | | location |
| isDefault | boolean | no | false | | single-WH launch (PRD §15) |
| status | enum(WarehouseStatus) | no | `ACTIVE` | | |

### `inventory`

Purpose: **single source of truth** for stock (per variant per warehouse).

| Column | Type | Null | Default | Key | Notes |
| --- | --- | --- | --- | --- | --- |
| productVariantId | uuid | no | | FK → product_variants | |
| warehouseId | uuid | no | | FK → warehouses (⊕ DB-4) | |
| availableStock | int | no | 0 | | sellable |
| reservedStock | int | no | 0 | | held during checkout |
| lowStockAlert | int | no | 0 | | threshold |

Constraints: unique `(productVariantId, warehouseId)` (partial); check
`availableStock >= 0`, `reservedStock >= 0`. Indexes: both FKs;
`(availableStock)` partial for low-stock queries. **InventoryStatus is derived**
(DB-14), not stored.

---

## Promotions

### `coupons`

| Column | Type | Null | Default | Key | Notes |
| --- | --- | --- | --- | --- | --- |
| code | varchar(40) | no | | unique (partial) | |
| discountType | enum(CouponType) | no | | | PERCENTAGE / FLAT |
| discountValue | numeric(12,2) | no | | | |
| minimumOrder | numeric(12,2) | yes | null | | |
| maximumDiscount | numeric(12,2) | yes | null | | cap for % |
| usageLimit | int | yes | null | | global cap |
| perUserLimit | int | yes | 1 | | ⊕ enforce per-user (DB-6) |
| validFrom | timestamptz | yes | null | | |
| validTo | timestamptz | yes | null | | |
| status | enum(CouponStatus) | no | `ACTIVE` | | |

Indexes: `code` (unique), `(status, validFrom, validTo)`.

### `coupon_redemptions` ⊕ (DB-6)

| Column | Type | Null | Default | Key | Notes |
| --- | --- | --- | --- | --- | --- |
| couponId | uuid | no | | FK → coupons | |
| userId | uuid | no | | FK → users | |
| orderId | uuid | no | | FK → orders | |
| discountApplied | numeric(12,2) | no | | | |

Indexes: `couponId`, `userId`, unique `(couponId, orderId)`. Enforces usage limits.

---

## Cart

### `carts`

A `carts` row exists **only for an authenticated user**. **Guest carts are not
persisted in the database** — guest cart state lives only in cookie / localStorage
/ Redis (auth-architecture/07, Q5). On authentication, the guest's ephemeral cart
is **merged** into the user's DB cart. (This resolves DB-9.)

| Column | Type | Null | Default | Key | Notes |
| --- | --- | --- | --- | --- | --- |
| userId | uuid | no | | FK → users | always an authenticated user (no guest carts in DB) |
| status | enum(CartStatus) | no | `ACTIVE` | | active/abandoned/converted |

Indexes: `userId`, partial unique `(userId) WHERE status='ACTIVE'`.

### `cart_items`

| Column | Type | Null | Default | Key | Notes |
| --- | --- | --- | --- | --- | --- |
| cartId | uuid | no | | FK → carts (CASCADE) | |
| productVariantId | uuid | no | | FK → product_variants | |
| quantity | int | no | 1 | | check > 0 |
| price | numeric(12,2) | no | | | snapshot at add |

Indexes: unique `(cartId, productVariantId)` (partial); `cartId`.

### `wishlist`

| Column | Type | Null | Default | Key | Notes |
| --- | --- | --- | --- | --- | --- |
| userId | uuid | no | | FK → users | |
| productId | uuid | no | | FK → products | |
| visibility | enum(WishlistVisibility) | no | `PRIVATE` | | ⊕ future sharing (DB-10) |

Indexes: unique `(userId, productId)` (partial).

---

## Orders & Fulfilment

### `orders`

Purpose: the immutable commercial record.

| Column | Type | Null | Default | Key | Notes |
| --- | --- | --- | --- | --- | --- |
| orderNumber | varchar(32) | no | | unique (partial) | human-facing |
| userId | uuid | yes | null | FK → users | null ⇒ guest order (capture contact) |
| subtotal | numeric(12,2) | no | | | |
| discount | numeric(12,2) | no | 0 | | |
| couponId | uuid | yes | null | FK → coupons | ⊕ which coupon (DB-6) |
| shippingCharge | numeric(12,2) | no | 0 | | |
| tax | numeric(12,2) | no | 0 | | ⚠ DB-7 GST split needed |
| cgst / sgst / igst | numeric(12,2) | yes | null | | ⊕ GST breakdown (DB-7) |
| grandTotal | numeric(12,2) | no | | | |
| paymentStatus | enum(PaymentStatus) | no | `PENDING` | index | |
| orderStatus | enum(OrderStatus) | no | `PENDING` | index | |
| shippingStatus | enum(ShipmentStatus) | no | `PENDING` | | roll-up |
| paymentMethod | enum(PaymentMethod) | yes | null | | UPI/card/netbanking/COD (⚠ C2) |
| invoiceNumber | varchar(32) | yes | null | unique (partial) | GST invoice seq |
| placedAt | timestamptz | no | now() | | |

Indexes: `orderNumber` (unique), `invoiceNumber` (unique), `userId`,
`(orderStatus)`, `(paymentStatus)`, `(placedAt)`.

### `order_addresses` ⊕ (DB-17)

Immutable snapshot of ship-to (and bill-to) at order time (addresses can change/
be deleted later; the order must retain what was used). Columns mirror `addresses`
plus `orderId` (FK), `kind` enum(AddressType). No FK back to live `addresses`.

### `order_items`

| Column | Type | Null | Default | Key | Notes |
| --- | --- | --- | --- | --- | --- |
| orderId | uuid | no | | FK → orders (CASCADE in-aggregate) | |
| productVariantId | uuid | no | | FK → product_variants (RESTRICT) | |
| productName | varchar(180) | no | | | ⊕ snapshot (catalog may change) |
| variantLabel | varchar(80) | yes | null | | ⊕ snapshot (size/color) |
| quantity | int | no | | | check > 0 |
| price | numeric(12,2) | no | | | unit price snapshot |
| tax | numeric(12,2) | no | 0 | | |
| discount | numeric(12,2) | no | 0 | | |

Indexes: `orderId`, `productVariantId`.

### `payments`

Purpose: payment/refund attempts + gateway response. **1—N per order** (⚠ DB-11).

| Column | Type | Null | Default | Key | Notes |
| --- | --- | --- | --- | --- | --- |
| orderId | uuid | no | | FK → orders (RESTRICT) | |
| type | enum(PaymentTxnType) | no | `PAYMENT` | | ⊕ payment/refund |
| gateway | varchar(40) | no | `razorpay` | | |
| transactionId | varchar(120) | yes | null | unique (partial) | gateway ref |
| status | enum(PaymentStatus) | no | `PENDING` | index | |
| amount | numeric(12,2) | no | | | |
| response | jsonb | yes | null | | raw gateway payload (PII-aware) |

Indexes: `orderId`, `transactionId` (unique), `(status)`.

### `shipments` ⊕ (DB-3)

| Column | Type | Null | Default | Key | Notes |
| --- | --- | --- | --- | --- | --- |
| orderId | uuid | no | | FK → orders | |
| courier | varchar(80) | yes | null | | Shiprocket courier |
| awbNumber | varchar(64) | yes | null | unique (partial) | tracking |
| status | enum(ShipmentStatus) | no | `PENDING` | index | |
| trackingUrl | text | yes | null | | |
| shippedAt / deliveredAt | timestamptz | yes | null | | |

### `returns` ⊕ (DB-2)

| Column | Type | Null | Default | Key | Notes |
| --- | --- | --- | --- | --- | --- |
| orderId | uuid | no | | FK → orders | |
| userId | uuid | no | | FK → users | |
| reason | varchar(200) | yes | null | | |
| status | enum(ReturnStatus) | no | `REQUESTED` | index | |
| refundAmount | numeric(12,2) | yes | null | | |
| refundMethod | enum(RefundMethod) | yes | null | | ⚠ C6 (COD refund) |
| requestedAt / resolvedAt | timestamptz | yes | null | | 7-day window (BRD §15) |

### `return_items` ⊕ (DB-2)

`returnId` (FK), `orderItemId` (FK), `quantity`, `reason`. Supports partial
returns.

---

## UGC, Content, Engagement, Admin

### `reviews`

| Column | Type | Null | Default | Key | Notes |
| --- | --- | --- | --- | --- | --- |
| userId | uuid | no | | FK → users | |
| productId | uuid | no | | FK → products | |
| orderId | uuid | yes | null | FK → orders | ⊕ verified purchase (DB-12) |
| rating | smallint | no | | check 1–5 | |
| title | varchar(160) | yes | null | | |
| review | text | yes | null | | |
| status | enum(ReviewStatus) | no | `PENDING` | index | moderation |

Indexes: `productId`, `(productId, status)`, unique `(userId, productId, orderId)` (partial).

### `blogs`

| Column | Type | Null | Default | Key | Notes |
| --- | --- | --- | --- | --- | --- |
| title | varchar(200) | no | | | |
| slug | varchar(220) | no | | unique (partial) | |
| content | text | no | | | |
| thumbnail | text | yes | null | | |
| author | varchar(120) | yes | null | | ⚠ free-text vs FK→users (minor) |
| status | enum(ContentStatus) | no | `DRAFT` | | ⊕ draft/published |
| publishedAt | timestamptz | yes | null | | |
| seoTitle / seoDescription | varchar | yes | null | | |

Indexes: `slug` (unique), `(status, publishedAt)`.

### `notifications`

| Column | Type | Null | Default | Key | Notes |
| --- | --- | --- | --- | --- | --- |
| userId | uuid | no | | FK → users | |
| title | varchar(160) | no | | | |
| message | text | no | | | |
| type | enum(NotificationType) | no | | | category (order/promo/system) |
| channel | enum(NotificationChannel) | no | `IN_APP` | | ⊕ email/SMS/push (DB-18) |
| read | boolean | no | false | | |

Indexes: `(userId, read)`.

### `settings`

| Column | Type | Null | Default | Key | Notes |
| --- | --- | --- | --- | --- | --- |
| key | varchar(120) | no | | unique (partial) | |
| value | jsonb | no | | | typed config |
| group | varchar(80) | yes | null | | store/GST/shipping/payment (012) |

### `audit_logs` ⊕ (012 Audit Logs — append-only, **no soft delete**)

| Column | Type | Null | Default | Notes |
| --- | --- | --- | --- | --- |
| id | uuid | no | UUID v7 | |
| actorId | uuid | yes | null | who (admin/system) |
| action | varchar(80) | no | | e.g. `order.update` |
| entity | varchar(80) | no | | table/aggregate |
| entityId | uuid | yes | null | |
| diff | jsonb | yes | null | before/after |
| ip | inet | yes | null | |
| createdAt | timestamptz | no | now() | **no** updatedAt/deletedAt (immutable) |

Indexes: `(entity, entityId)`, `(actorId)`, `(createdAt)`.

---

> Tables marked `⊕` and columns marked `⊕`/`⚠` are **not yet ratified** by `004`;
> they are required by BRD/PRD/012/business-architecture and are listed for CTO
> approval (see final report), not implemented here.
