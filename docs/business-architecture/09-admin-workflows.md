# 09 · Admin Workflows

**Status:** Specification (no implementation).
**Anchors:** `012_ADMIN_PANEL.md`, PRD §5 (Admin), TRD §10 (roles).

The admin/back-office is how the business **operates** day to day. These are the
operational workflows, their controls, and the operational KPIs — the engine room
behind the storefront.

## 1. Roles & access (RBAC)

| Role | Status | Scope |
| --- | --- | --- |
| **Guest** | MVP | Browse/search/cart (pre-auth); no back-office |
| **Customer** | MVP | Own orders, returns/exchange, reviews, profile |
| **Support** | MVP | Customers, orders (read/assist), returns |
| **Manager** | MVP | Inventory, fulfillment, orders, returns |
| **Admin** | MVP | Full back-office (012) |
| **Super Admin** | MVP | Admin + user/role management, settings |

- These are the approved MVP roles (auth-architecture/04). Launch remains a
  **single admin portal / single seller** (PRD §15). ⚠ **C5** (single vs
  multi-warehouse) affects **Manager** scope.
- **Audit logs** (012) record product/order updates, logins, and admin activity —
  a control and compliance requirement.

## 2. Catalog & merchandising operations

| Workflow | Steps | Controls | KPI |
| --- | --- | --- | --- |
| Create/enrich product | draft → add variants/media/SEO → activate | required fields, image standards, approval | time-to-publish, content completeness |
| Bulk import/export | upload → validate → commit | validation, dry-run, rollback | import error rate |
| Category management | CRUD, hierarchy, sort, SEO | no orphan products, redirect on remove | taxonomy health |
| Collections/badges | build, schedule, assign | time-boxing, no empty rails | collection revenue share |

## 3. Inventory operations

| Workflow | Steps | Controls | KPI |
| --- | --- | --- | --- |
| Stock updates | adjust per SKU/warehouse | never below committed; audit trail | inventory accuracy |
| Low-stock alerts | threshold breach → alert | restock workflow | stockout rate |
| SKU/barcode mgmt | assign/track | uniqueness | mismatch incidents |

- **Core rule:** Inventory is the **single source of truth**; do not oversell
  (BRD §20). Out-of-stock on the storefront is derived from here.

## 4. Order operations (ties to [08](./08-order-lifecycle.md))

| Workflow | Steps | Controls | KPI |
| --- | --- | --- | --- |
| Process order | Confirmed → Packed → Shipped (Shiprocket) | pick/pack accuracy, label generation | processing time |
| Cancellation | validate stage → cancel → restock/refund | only pre-ship; reason capture | cancellation rate |
| Returns/refunds | request → approve → pickup → QC → refund/RTO | policy checks (7-day, condition), QC | return-processing & refund SLA |
| Exception handling | lost/damaged/RTO reconciliation | claims, manual refund | exception resolution time |

## 5. Promotions, customers & content

| Workflow | Notes | KPI |
| --- | --- | --- |
| Coupons | %/flat, min-order, max-discount, expiry, usage limit (012) | redemption, abuse rate |
| Customer management | profile, orders, addresses, wishlist, CLV (012) | support resolution, CLV |
| Blog/CMS | author → SEO → publish (012 Blog) | content output, organic assist |
| SEO management | meta, redirects, schema, sitemap, robots (012) | ranking, crawl health |

## 6. Settings, GST & compliance

- **Store/GST/Shipping/Payment/Email/SMS** settings (012), incl. GSTIN and tax
  configuration powering compliant invoices (BRD §20).
- **Notifications & roles/permissions** management (012 Settings).
- Compliance posture: GST invoices, data privacy, Indian e-commerce rules
  (BRD §20) — operational responsibility of Admin/Ops.

## 7. Analytics & reporting

- Dashboard: revenue, orders, visitors, conversion, low-stock, top products,
  latest orders, sales graph (012 Dashboard).
- Reports across revenue/orders/products/customers/traffic/search/cart/conversion
  (012 Analytics) — fed by the Analytics domain ([10](./10-growth-and-marketing.md)).

## 8. Operational KPIs (roll-up)

| KPI | Target intent |
| --- | --- |
| Order-processing time (Confirmed→Shipped) | fast, reliable fulfillment |
| Stockout / oversell incidents | zero oversell (BRD §20) |
| Inventory accuracy | trustable availability |
| Return-processing & refund SLA | customer trust |
| RTO rate | cost control (India/COD) |
| Catalog publish throughput | merchandising agility |
| Audit completeness | governance |

## 9. Edge cases

- **Oversell / inventory mismatch** → reconciliation + reservation discipline.
- **Concurrent edits** to the same product/order → last-writer controls + audit.
- **Fraud/abuse** (coupon stacking, serial returns) → flags, limits, review.
- **Bulk-import errors** → validation + rollback, never partial corruption.
- **Festive surge** → ops scaling, prioritized fulfillment, honest ETAs.
- **Mis-priced product** → quick correction with pricing-consistency guardrails.

## 10. Future extensibility

- **Granular per-role permissions** for the approved roles (Support, Manager,
  Admin, Super Admin) — finalized in the Admin sprint (auth-architecture/04).
- **Multi-warehouse** operations & routing (TRD §23; resolves ⚠ C5).
- **Advanced ops**: demand forecasting, automated reordering, bulk merchandising.
- **Omnichannel** store+online inventory unification (BRD long-term).
