# FWorld Business Architecture

**Status:** Specification (documentation only — no implementation)
**Date:** 2026-06-29
**Audience:** Product, Business, Engineering, Operations
**Scope:** Indian D2C **premium men's fashion** brand, treated as a long-term,
scalable business — not merely an e-commerce website.

This section defines **what the business does and why**, in business terms,
**before** any technical implementation. It is the bridge between the business
intent in [`001_BRD.md`](../001_BRD.md) / [`002_PRD.md`](../002_PRD.md) and the
technical architecture in [`003_TRD.md`](../003_TRD.md). Where those documents
own the requirements, this section owns the **business-capability model**.

> No React components, APIs, database schemas, or implementation code appear
> here. Conflicts found with BRD/PRD/TRD are **reported** (see §Conflict register
> and [`README` → Conflicts](#conflict-register)) — never silently resolved.

## How to read this section

| #  | Document | Question it answers |
| -- | -------- | ------------------- |
| 01 | [Business Domains](./01-business-domains.md) | What are the bounded business capabilities, and who owns what? |
| 02 | [Customer Journey](./02-customer-journey.md) | How does a person move from stranger to repeat advocate? |
| 03 | [Product Catalog Architecture](./03-product-catalog-architecture.md) | How is the catalog modeled as a business asset? |
| 04 | [Merchandising Strategy](./04-merchandising-strategy.md) | How are products presented to drive conversion? |
| 05 | [Search & Discovery](./05-search-and-discovery.md) | How do customers find what they want? |
| 06 | [Shopping Cart Strategy](./06-shopping-cart-strategy.md) | How does intent become a basket? |
| 07 | [Checkout Architecture](./07-checkout-architecture.md) | How does a basket become a paid order? |
| 08 | [Order Lifecycle](./08-order-lifecycle.md) | What happens to an order from placement to closure? |
| 09 | [Admin Workflows](./09-admin-workflows.md) | How does the business operate the store day to day? |
| 10 | [Growth & Marketing](./10-growth-and-marketing.md) | How does the business acquire, retain, and grow? |

## Business positioning (from BRD/PRD)

- **Who:** Indian men, 18–40, middle / upper-middle class, mobile-first, value
  quality over lowest price ([`001_BRD.md`](../001_BRD.md) §6–7).
- **What:** premium men's apparel (jeans, shirts, tees, oversized/polo tees,
  cargos, trousers, shorts, hoodies, jackets).
- **Promise:** premium presentation + fast experience + trust, beating
  Bewakoof / Snitch / Souled Store / Myntra / Ajio on UI, speed, SEO, and
  checkout simplicity.
- **Model:** single-seller, owned inventory, single warehouse, INR-only, India
  only at launch; **no marketplace** in V1.

## India-specific business context (applies across all domains)

- **GST-compliant invoicing** is mandatory on every order ([`001_BRD.md`](../001_BRD.md) §20).
- **UPI-first** payments; cards and net-banking via Razorpay; **COD** is a
  market expectation (handled through Shiprocket) — see [Conflict C2](#conflict-register).
- **Pincode serviceability & COD availability** vary by courier (Shiprocket).
- **RTO (Return-to-Origin)** risk, especially on COD, is a first-class
  operational concern (see [08](./08-order-lifecycle.md)).
- **Festive/seasonal cycles** (Diwali, end-of-season sales) drive demand spikes.
- **Regional languages** and **tier-2/3** reach are future growth levers.

## Domain map (high level)

```text
                         ┌─────────────────────────────┐
        Discovery        │  Catalog & Merchandising    │   Trust & Compliance
   (Search & Discovery)  │  (Products, Collections)    │   (GST, Privacy, Reviews)
            │            └──────────────┬──────────────┘            │
            ▼                           ▼                           ▼
   ┌─────────────┐   add    ┌─────────────┐  pay   ┌─────────────────────┐
   │  Customer   │ ───────▶ │    Cart     │ ─────▶ │  Checkout & Payments │
   │  & Identity │          │ & Promotions│        │  (GST invoice)       │
   └─────────────┘          └─────────────┘        └──────────┬──────────┘
            ▲                                                  ▼
            │                                       ┌─────────────────────┐
   ┌─────────────────┐   notify / re-engage         │  Orders, Fulfillment │
   │ Engagement &    │ ◀─────────────────────────── │  Shipping, Returns   │
   │ Growth          │                              │  (Shiprocket)        │
   └─────────────────┘                              └──────────┬──────────┘
            ▲                                                  ▼
            │                  ┌──────────────────────────────────────────┐
            └───────────────── │ Administration, Inventory, Analytics, CMS │
                               └──────────────────────────────────────────┘
```

## Glossary (selected)

| Term | Meaning |
| --- | --- |
| **Domain** | A bounded area of business capability with clear ownership. |
| **SKU** | Stock-keeping unit — a sellable variant (e.g. *Shirt X / Navy / M*). |
| **AOV** | Average order value. |
| **CAC / CLV** | Customer acquisition cost / customer lifetime value. |
| **RTO** | Return-to-origin — a shipment returned undelivered (common on COD). |
| **COD** | Cash on delivery. |
| **PDP / PLP** | Product detail page / product listing page. |
| **UGC** | User-generated content (reviews, ratings, photos). |
| **EOSS** | End-of-season sale. |

## Conflict register

Conflicts discovered against BRD/PRD/TRD are listed here and **not** resolved in
these documents. See each linked doc for context.

| ID | Conflict | Sources | Where it bites |
| --- | --- | --- | --- |
| C1 | **Auth provider**: TRD §4 names "Better Auth"; BRD §12 / PRD FR-001..005 list OTP/Email/Google/Apple/Guest; repo placeholders imply JWT. | TRD §4/§9, BRD §12, PRD §8 | [02](./02-customer-journey.md), [07](./07-checkout-architecture.md) |
| C2 | **COD ambiguity**: BRD §14 payment list omits COD, but BRD §13 lists "COD Support" as a Shiprocket benefit. Is COD offered at launch? | BRD §13 vs §14 | [07](./07-checkout-architecture.md), [08](./08-order-lifecycle.md) |
| C3 | **Catalog taxonomy drift**: BRD §10 launch list (10 incl. Oversized/Polo tees) differs from TRD/master-instructions launch lists (Accessories "future-ready", no Oversized/Polo split). | BRD §10, TRD §4, 000 Part 1 | [03](./03-product-catalog-architecture.md) |
| C4 | **Guest wishlist**: PRD says Guest "Add Wishlist (Prompt Login)"; FR-020/022 imply persisted, cross-device wishlist. Guest behavior undefined. | PRD §5 vs FR-020/022 | [02](./02-customer-journey.md), [06](./06-shopping-cart-strategy.md) |
| C5 | **Single vs multi-warehouse**: PRD §15 constraint "Single warehouse"; Admin Inventory has a "Warehouse" field and TRD §23 targets multi-warehouse. | PRD §15 vs 012, TRD §23 | [09](./09-admin-workflows.md) |
| C6 | **Refund mechanics for COD** are unspecified (no prepaid instrument to reverse). | BRD §15, 012 Orders | [08](./08-order-lifecycle.md) |
| C7 | **Exchange vs return**: exchange is "future" (BRD §15) yet apparel returns are dominated by size exchanges — a business gap at launch. | BRD §15 | [08](./08-order-lifecycle.md) |

These are echoed, with recommendations, in the final report accompanying this
section.
