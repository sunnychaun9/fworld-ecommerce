# 06 · Shopping Cart Strategy

**Status:** Specification (no implementation).
**Anchors:** PRD FR-030 (cart), `007` Cart, BRD §20 (no overselling, pricing).

The cart is where **intent becomes a basket**. It is also the single biggest
leak in e-commerce (cart abandonment is a named KPI in BRD §16/PRD §4), so it is
treated as its own strategy, not a UI screen.

## 1. Cart lifecycle (states)

| State | Meaning | Trigger |
| --- | --- | --- |
| **Empty** | No items | New session / cleared |
| **Active** | Has items, being edited | Add to cart |
| **Saved/Persisted** | Stored for later/cross-device | Login / explicit save |
| **Abandoned** | Inactive with items, no checkout | Inactivity threshold |
| **Converted** | Became an order | Successful checkout |
| **Merged** | Guest cart folded into account | Login |

## 2. Guest vs customer carts

- **Guest cart:** held locally (device) so guests can shop frictionlessly.
- **Customer cart:** persisted and **synced cross-device** (parallels FR-022 for
  wishlist).
- **Merge on login:** guest (local) cart merges into the account cart — union of
  items, quantities reconciled, duplicates combined. (Same recommended pattern
  applies to guest wishlist — ⚠ **C4**.)

## 3. Line item & quantity rules

- A line item is a **variant (SKU)** + quantity (color/size resolved before add).
- Quantity bounded by **available stock** and optional per-order limits (anti-
  hoarding for drops).
- Adding an already-present variant increments quantity (no duplicate lines).

## 4. Price computation (order of operations)

A transparent, deterministic sequence (final authority is server-side at
checkout — [07](./07-checkout-architecture.md)):

```text
1. Line subtotal      = Σ (variant price × qty)
2. Item/coupon discount applied  (Promotions rules: %/flat, min-order, max-discount)
3. Taxable value      = subtotal − discount
4. GST                = per applicable rate (India; shown, invoice at checkout)
5. Shipping charge    = rule-based (e.g. free over threshold)
6. Order total        = taxable value + GST + shipping
```

- **GST is always itemized** for transparency and to support the compliant
  invoice generated at checkout (BRD §20).
- **Estimated delivery** shown in cart (FR-030) using serviceability.

## 5. Inventory interaction

- Cart reflects **current availability**; it does **not** by itself reserve stock.
- **Reservation strategy** (hold stock at checkout/payment vs. only verify) is a
  key decision deferred to [07](./07-checkout-architecture.md)/an ADR — the
  **rule** here is: *never oversell* (BRD §20), so stock is re-validated before
  payment capture.
- If a carted item's stock drops/zeroes, the cart must surface it (not silently
  drop) before checkout.

## 6. Persistence, recovery & interplay

- **Persistence:** customer carts survive sessions/devices; guest carts survive
  on-device.
- **Abandoned-cart recovery:** inactivity triggers a re-engagement nudge
  (email/SMS) — a retention lever ([10](./10-growth-and-marketing.md)),
  consent-respecting.
- **Wishlist ↔ cart:** move-to-cart and save-for-later flows (`007` Wishlist).
- **Mini-cart:** quick review without leaving the page (`007`).

## 7. KPIs

| KPI | Signal |
| --- | --- |
| Add-to-cart rate | upper-funnel intent |
| Cart abandonment rate | friction/cost transparency |
| Cart → checkout rate | basket health |
| Recovery rate (abandoned-cart) | retention effectiveness |
| Avg items/cart, cart value | AOV potential |

## 8. Edge cases

- **Stock change** post-add (reduced/zero) → notify, adjust, block checkout of
  unavailable lines.
- **Price/coupon change** between add and checkout → re-price transparently;
  coupon re-validated.
- **Expired/invalid coupon** at checkout → clear messaging, recompute.
- **Merge conflicts** on login (same variant in both carts) → combine quantities
  within stock limits.
- **Stale cart** (weeks old) → re-validate prices, stock, and promos on return.

## 9. Future extensibility

- **Saved carts / multiple carts**, gifting, "buy again".
- **Threshold gamification** (free shipping/gift over ₹X) tied to Promotions.
- **Loyalty/points preview** in cart (future Loyalty domain).
