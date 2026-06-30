# 01 · Business Domains

**Status:** Specification (no implementation).

This document defines FWorld's **business domains** (bounded capabilities) before
any technical design. A domain owns a coherent slice of business meaning, its own
language, its own rules, and a clear boundary. Modeling domains first keeps the
business scalable: domains can grow, split, or be staffed independently without
rewriting the whole.

## 1. Domain classification

| Class | Meaning | FWorld examples |
| --- | --- | --- |
| **Core** | Competitive differentiators; where premium experience is won | Catalog & Merchandising, Search & Discovery, Cart & Checkout, Order Fulfillment, Customer Experience |
| **Supporting** | Necessary, business-specific, but not differentiating | Inventory, Promotions, Returns, Content/CMS, Analytics, Admin/Ops |
| **Generic** | Solved-problem capabilities, ideally bought/integrated | Identity/Auth, Payments (Razorpay), Shipping (Shiprocket), Notifications, Media/CDN |

## 2. Core domains

### 2.1 Catalog & Merchandising

- **Responsibility:** model, organize, and present the product range as a premium
  business asset; own taxonomy, products, variants, collections, and how they are
  surfaced to convert.
- **Owns:** categories, products, variants/SKUs, attributes, collections, badges,
  product content & media references, size guide.
- **Does NOT own:** stock counts (Inventory), price-rule discounts (Promotions),
  search index (Discovery consumes the catalog).
- **Key processes:** onboarding/curation, collection building, merchandising
  placement, lifecycle (draft → active → out-of-stock → archived).
- **KPIs:** PDP view rate, add-to-cart rate, catalog coverage, % with rich media,
  new-arrival velocity.
- **Detail:** [03](./03-product-catalog-architecture.md), [04](./04-merchandising-strategy.md).

### 2.2 Search & Discovery

- **Responsibility:** help customers find product fast — search, browse, filter,
  sort, recommend.
- **Owns:** search experience & relevance (Meilisearch), filters/facets, sort,
  suggestions, recommendation surfaces, recently-viewed.
- **Does NOT own:** the catalog truth (it indexes it) or merchandising curation
  rules (it executes them).
- **KPIs:** search conversion, zero-result rate, search-exit rate, filter usage.
- **Detail:** [05](./05-search-and-discovery.md).

### 2.3 Cart & Checkout

- **Responsibility:** convert intent into a paid, GST-compliant order with the
  least friction.
- **Owns:** cart lifecycle, line items, price/tax/coupon/shipping computation,
  checkout session, payment orchestration (via Payments), invoice trigger.
- **Does NOT own:** payment processing internals (Razorpay), fulfillment (Orders).
- **KPIs:** cart abandonment, checkout completion, payment success, AOV.
- **Detail:** [06](./06-shopping-cart-strategy.md), [07](./07-checkout-architecture.md).

### 2.4 Order Management & Fulfillment

- **Responsibility:** take an order from placement to delivery (or return/refund)
  reliably; the operational backbone.
- **Owns:** order state machine, fulfillment workflow, shipment hand-off
  (Shiprocket), cancellations, delivery tracking.
- **Does NOT own:** courier networks (Shiprocket), money movement (Payments).
- **KPIs:** order processing time, on-time delivery, RTO rate, cancellation rate.
- **Detail:** [08](./08-order-lifecycle.md).

### 2.5 Customer Experience & Identity

- **Responsibility:** the customer relationship — identity, profile, addresses,
  wishlist, order history, trust.
- **Owns:** account, addresses, wishlist, preferences, consent.
- **Does NOT own:** authentication mechanism internals (Generic/Auth — see C1).
- **KPIs:** registration rate, returning-customer rate, NPS, CLV.
- **Detail:** [02](./02-customer-journey.md).

## 3. Supporting domains

| Domain | Responsibility | Owns | KPIs | Detail |
| --- | --- | --- | --- | --- |
| **Inventory** | Accurate, never-oversold stock | stock levels, SKU, reservations, low-stock alerts | stockout rate, oversell incidents, inventory accuracy | [03](./03-product-catalog-architecture.md), [09](./09-admin-workflows.md) |
| **Promotions & Pricing** | Coupons, offers, discount rules | coupons (%/flat, min-order, max-discount, expiry, usage limit), price display | redemption rate, discount margin impact, coupon-abuse rate | [04](./04-merchandising-strategy.md), [07](./07-checkout-architecture.md) |
| **Returns & Refunds** | Trustworthy 7-day returns | return requests, QC outcomes, refund/RTO handling | return rate, return-processing time, refund SLA | [08](./08-order-lifecycle.md) |
| **Content, Brand & SEO** | Editorial, blog, SEO, brand voice | blog/CMS, SEO metadata, schema, sitemaps | organic traffic, ranking, content-assisted conversion | [04](./04-merchandising-strategy.md), [10](./10-growth-and-marketing.md) |
| **Reviews & Social Proof (UGC)** | Trust via ratings/reviews | reviews, ratings, (future photos) | review coverage, avg rating, review-influenced conversion | [02](./02-customer-journey.md), [10](./10-growth-and-marketing.md) |
| **Customer Engagement** | Lifecycle messaging | notifications (email/SMS/push), campaigns | open/click rate, recovery rate, opt-out rate | [10](./10-growth-and-marketing.md) |
| **Analytics & Insights** | Decisions from data | dashboards, funnels, reports | data freshness, decision coverage | [09](./09-admin-workflows.md) |
| **Administration & Operations** | Run the store; RBAC, audit | admin workflows, roles, audit logs, settings/GST | order-processing time, ops error rate | [09](./09-admin-workflows.md) |

## 4. Generic domains (integrate, don't build)

| Domain | Provider (per docs) | Note |
| --- | --- | --- |
| Identity / Auth | TRD §4 "Better Auth" (⚠ C1) | OTP/Email/Google/Apple/Guest per BRD/PRD |
| Payments | Razorpay | UPI, cards, net-banking; COD ⚠ C2 |
| Shipping & Logistics | Shiprocket | multi-courier, COD, tracking, returns |
| Notifications | Resend (email); MSG91 (SMS, future) | transactional + lifecycle |
| Media / CDN | Cloudflare R2 + CDN | product imagery delivery |
| Search engine | Meilisearch | powers Discovery |

## 5. Future domains (extensibility)

Reserved as **distinct domains** so they can be added without disturbing core
boundaries (BRD §19, PRD §7, Roadmap Phase 8):

- **Loyalty & Rewards**, **Referral**, **Gift Cards**, **Wallet** — engagement/
  monetization domains layered on Customer + Payments.
- **Subscriptions** — recurring commerce on top of Orders + Payments.
- **Personalization & AI** — recommendations, AI search, outfit building;
  consumes Catalog + behavioral Analytics.
- **Internationalization** — currency, language, cross-border tax/shipping.
- **Marketplace / Multi-vendor** — a major future pivot (explicitly out of V1).
- **Omnichannel / Retail** — store + online inventory unification (BRD long-term).

## 6. Domain boundaries & dependencies (rules)

- A domain **owns its data and language**; others reference it by contract, not by
  reaching into it.
- **Inventory is the single source of truth for availability**; Catalog shows it,
  Cart checks it, Checkout reserves it — none of them redefine it.
- **Payments and Shipping are external** capabilities; FWorld owns the *workflow*
  around them, not their internals.
- **Trust & Compliance (GST, privacy, authenticity)** is a cross-cutting concern
  every transactional domain must honor (BRD §20).
- New capability → first decide **which domain owns it** (or whether it is a new
  domain) before any technical work.
