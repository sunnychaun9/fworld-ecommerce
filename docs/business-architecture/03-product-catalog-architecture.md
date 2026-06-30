# 03 · Product Catalog Architecture (Business View)

**Status:** Specification (no implementation — **no database schema**).
**Anchors:** BRD §10, PRD FR-010..016, 012 (Products/Categories/Inventory).

This is the **business model** of the catalog: concepts, relationships, lifecycle,
and rules. It deliberately avoids tables, columns, and APIs.

## 1. Catalog concepts

| Concept | Business meaning | Example |
| --- | --- | --- |
| **Category** | A browsable grouping in a hierarchy | Men → Topwear → Shirts |
| **Product** | A marketable style customers perceive as "one item" | "Oxford Cotton Shirt" |
| **Variant (SKU)** | A specific sellable combination | Oxford Shirt / Navy / M |
| **Attribute** | A descriptive property used for filtering/decision | fit, fabric, sleeve, occasion |
| **Collection** | A curated, merchandised set (cross-category) | "New Arrivals", "Festive Edit" |
| **Badge** | A merchandising signal | New, Bestseller, Low Stock, Offer |
| **Media** | Imagery that sells the product | gallery, swatch, lifestyle shots |
| **Size guide** | Fit guidance reducing return risk | chest/length chart per category |

> A **product** is what the customer browses; a **variant/SKU** is what is priced,
> stocked, and sold. This separation is essential for apparel (color × size).

## 2. Taxonomy (launch)

Launch categories (BRD §10): **Jeans, Shirts, T-Shirts, Oversized T-Shirts, Polo
T-Shirts, Cargo Pants, Trousers, Shorts, Hoodies, Jackets**.

- Hierarchy: `Men → {Topwear, Bottomwear, Outerwear} → Category`. Hierarchy is
  **data-driven** (Admin manages it — 012), not hard-coded, so future categories
  (Women, Kids, Accessories) attach without restructuring.
- ⚠ **C3 (taxonomy drift):** BRD §10's list differs from the TRD/000 launch lists
  (which mark Accessories "future-ready" and don't split Oversized/Polo). Treated
  here as **BRD-authoritative** for business taxonomy; flagged for reconciliation,
  not silently merged.

## 3. Variant & attribute model (conceptual)

- **Variation axes at launch:** **Color** and **Size** (PRD FR-013/014).
- **Descriptive attributes** (for filtering & content): fit (slim/regular/
  oversized), fabric/material, pattern, sleeve length, neck type, occasion, wash.
- A variant carries its own **SKU**, **price** (consistent per BRD §20), **media
  emphasis** (color swatch), and **stock** (owned by Inventory).
- **SEO metadata** is a first-class catalog property (PRD FR-016): title,
  description, slug, schema, per product (and ideally per category/collection).

## 4. Product lifecycle (states)

| State | Meaning | Visible to customer? | Sellable? |
| --- | --- | --- | --- |
| **Draft** | Being created/enriched | No | No |
| **Active** | Published and on sale | Yes | Yes (if stock) |
| **Out of Stock** | Active but all variants unavailable | Yes (with notify-me) | No |
| **Archived** | Retired from sale | No (SEO redirect kept) | No |

Transitions are Admin-driven (09). Out-of-stock is **derived from Inventory**, not
set manually, to prevent overselling (BRD §20).

## 5. Catalog ↔ other domains (boundaries)

- **Inventory** owns availability; catalog **reflects** it. Catalog never stores
  the authoritative stock number.
- **Promotions** owns discounts; catalog stores the **list price**, not coupon
  logic. Displayed strike-through/discount is a presentation of a Promotion.
- **Search & Discovery** **indexes** the catalog; the catalog is the source of
  truth, the index is a derived projection ([05](./05-search-and-discovery.md)).
- **Media/CDN** stores image binaries (Cloudflare R2); catalog holds references
  and the required ratios/alt text per [design-foundation/10](../design-foundation/10-image-strategy.md).

## 6. Content & merchandising attributes

Beyond raw data, premium catalog quality requires:

- Multiple high-quality images per product (gallery, zoom, lifestyle) — `007`.
- Consistent, on-brand copy (benefit-led, minimal — premium voice).
- Size guide per category; fit notes to cut returns.
- Structured specs (fabric, care, country of origin) — also feeds SEO schema.

## 7. KPIs

| KPI | Why it matters |
| --- | --- |
| Catalog coverage (categories populated) | breadth of offer |
| % products with ≥N images / size guide | conversion & return reduction |
| New-arrival velocity | freshness, repeat visits |
| PDP view rate, add-to-cart rate | catalog effectiveness |
| Out-of-stock exposure rate | lost-sale & UX risk |
| Return rate by category/attribute | fit/quality signal back into catalog |

## 8. Edge cases

- **Partial availability:** product active but only some sizes in stock → show
  per-size availability, disable unavailable, offer notify-me.
- **Price change** while wishlisted/carted → surface transparently (BRD §20
  pricing consistency).
- **Discontinued variant** with historical orders → archive, never hard-delete
  (order history & invoices must remain valid).
- **Duplicate/near-duplicate products** → governance to avoid catalog bloat.
- **SEO continuity** on archive → maintain redirects (012 SEO Redirects).

## 9. Future extensibility

- New top-level genders (Women/Kids) and **Accessories** attach via taxonomy.
- **Configurable/bundle products** ("complete the look", combos).
- **Richer variant axes** (length/inseam for trousers, fit systems).
- **Localized content** (regional languages) and **size localization**.
- **AI enrichment** (auto-tagging, attribute extraction) feeding Discovery.
