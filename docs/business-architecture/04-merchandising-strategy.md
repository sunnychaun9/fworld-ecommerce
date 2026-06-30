# 04 · Merchandising Strategy

**Status:** Specification (no implementation).
**Anchors:** `007_UI_UX.md` (homepage sections), BRD §8 (revenue sources),
BRD §21 (competitive advantages).

Merchandising is how the catalog is **arranged and presented to maximize
discovery, desire, and conversion** — the commercial art on top of the catalog
data. For a premium brand, restraint and curation matter as much as volume.

## 1. Principles

- **Curated, not crowded** — premium feel comes from edited selections and
  whitespace (`007`), not endless grids.
- **Imagery leads** — product photography is the hero (Master Instructions Part 1).
- **Honest urgency** — scarcity/“low stock” only when true (trust > tricks; BRD §20).
- **Merchandising is data-driven** — collections, badges, and placements are
  managed by Admin (012), not hard-coded.

## 2. Homepage merchandising surfaces (from `007`)

| Surface | Commercial intent | Driven by |
| --- | --- | --- |
| Announcement bar | Offers, shipping/returns reassurance | Promotions / Settings |
| Hero banner | Brand story, hero drop/collection | Collections |
| Categories | Orient & route to intent | Taxonomy |
| New Arrivals | Freshness, repeat-visit reason | Catalog (recency) |
| Trending | Social proof of demand | Analytics (behavioral) |
| Best Sellers | Proven winners, lower-risk buys | Analytics (sales) |
| Featured Collections | Curated stories ("Festive Edit") | Collections |
| Why Choose Us | Trust (quality, returns, secure pay) | Content |
| Customer Reviews | Social proof | Reviews/UGC |
| Newsletter | Email capture for retention | Engagement |

## 3. Collections & curation

- **Collection types:** seasonal (EOSS, festive), thematic ("Workwear",
  "Streetwear"), drop/exclusive launch (a BRD §8 revenue source), and evergreen
  ("Essentials").
- Collections are **cross-category** and time-boxable (scheduled start/end), so
  campaigns can be merchandised without catalog changes.

## 4. Badges & signals

| Badge | Trigger (business rule) | Purpose |
| --- | --- | --- |
| New | Within N days of launch | Freshness |
| Bestseller | Top sellers by window | Social proof |
| Low Stock | Inventory below threshold (true only) | Honest urgency |
| Offer/Discount | Active promotion applies | Value perception |
| Back in Stock | Restocked recently | Re-engagement |

## 5. Cross-sell & upsell

| Mechanism | Where | Goal |
| --- | --- | --- |
| Related products | PDP | Discovery, basket breadth |
| "Complete the look" (future bundles) | PDP | AOV uplift |
| Recently viewed | PDP/PLP/home | Re-engagement |
| Recommended for you | Home/cart (future AI) | Personalized AOV |
| Cart recommendations | Cart | AOV, threshold-to-free-shipping |
| Coupon thresholds | Cart/checkout | Lift AOV ("₹X to free shipping") |

## 6. Pricing & discount presentation

- Show list price, discounted price, and **% saved** clearly; never misleading
  reference prices (BRD §20, Indian consumer rules).
- Coupon value must be visible and verifiable at cart/checkout
  ([07](./07-checkout-architecture.md)).
- Price is **consistent across the catalog** (BRD §20) — no per-surface price drift.

## 7. KPIs

| KPI | Signal |
| --- | --- |
| Surface CTR (hero, collections, trending) | merchandising pull |
| PLP → PDP rate, PDP → add-to-cart | funnel efficiency |
| AOV, units per order | upsell/cross-sell effectiveness |
| Collection revenue share | curation impact |
| Discount depth vs margin | promotion health |
| Sell-through rate per collection/drop | demand planning |

## 8. Edge cases

- **Empty/!thin collection** (items sold out) → auto-hide or backfill, never show
  an empty rail.
- **Stale "New"/"Trending"** → time-bound rules so badges expire.
- **Over-discounting** erodes premium positioning → guardrails on depth/frequency.
- **Festive surge** → ensure merchandised hero items are well-stocked (Inventory
  coordination, 09).

## 9. Future extensibility

- **Personalized merchandising** & **AI outfit recommendations** (BRD §19/PRD §7).
- **Bundles/configurable** "shop the look".
- **Segment-based** merchandising (new vs returning, persona-based).
- **Loyalty-gated** drops/early access (future Loyalty domain).
