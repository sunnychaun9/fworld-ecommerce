# 07 · Checkout Architecture (Business View)

**Status:** Specification (no implementation — no APIs).
**Anchors:** PRD FR-040 (checkout), BRD §14 (payments), `007` Checkout,
TRD §11/§14 (API/security), BRD §20 (GST).

Checkout converts a basket into a **paid, GST-compliant order**. It is the
highest-stakes, highest-drop-off flow; every step must reduce friction while
preserving trust and correctness.

## 1. Checkout steps (business flow)

```text
Identify → Address → Shipping/Serviceability → Payment → Review → Confirm
```

| Step | Goal | Notes |
| --- | --- | --- |
| **Identify** | Login or guest | Guest checkout mandatory (BRD §9, PRD FR-005); capture contact for updates/invoice. Auth method ⚠ **C1**. |
| **Address** | Capture/select delivery address | Saved addresses for customers; pincode is pivotal for India. |
| **Shipping / serviceability** | Confirm deliverability & ETA | Pincode serviceability via Shiprocket; choose method if multiple; COD availability check (⚠ **C2**). |
| **Payment** | Choose & authorize | Razorpay: UPI, cards, net-banking; COD pending decision (⚠ **C2**). |
| **Review** | Final price & summary | Itemized price + GST + shipping − discount; coupon visible. |
| **Confirm** | Place order, show confirmation | Order created, GST invoice triggered, confirmation + notification. |

Design intent: as **few steps and fields as possible** (BRD §21 "cleaner
checkout"), single-page where feasible, mobile-first sticky CTA (`007`).

## 2. Pricing authority

- The **server is the pricing authority** at checkout: it recomputes subtotal,
  re-validates the coupon, recalculates GST and shipping, and confirms stock
  **before** payment. The cart's numbers are indicative; checkout's are binding
  (prevents tampering — TRD §14 "never trust client").

## 3. Payment methods (BRD §14)

| Method | Launch | Note |
| --- | --- | --- |
| UPI | ✅ | Dominant in India; prioritize |
| Credit / Debit card | ✅ | Via Razorpay |
| Net banking | ✅ | Via Razorpay |
| **COD** | ⚠ **C2** | Listed as Shiprocket benefit (§13) but absent from §14 method list — **decision required**; high RTO risk |
| Wallet / EMI / BNPL | Future | BRD §14 future |

## 4. Coupons & GST

- **Coupon validation** at checkout: eligibility, min-order, max-discount, expiry,
  usage limit (012 Coupons); invalid coupons fail clearly and recompute totals.
- **GST invoice** generated on order placement, compliant with Indian rules
  (BRD §20) — itemized tax, seller GSTIN, invoice number sequence (an Ops/Finance
  rule, mechanism deferred).

## 5. Reliability & correctness (critical)

| Concern | Business rule |
| --- | --- |
| **Idempotency** | A single intent must never create duplicate orders or double charges (e.g. retries, double-tap). |
| **Stock at payment** | Re-validate availability immediately before capture; never oversell (BRD §20). |
| **Payment state truth** | The order's paid state is driven by Razorpay confirmation/webhook, not the client redirect alone. |
| **Failure recovery** | Failed/abandoned payment keeps the cart intact and offers retry; pending payments resolve via webhook. |
| **Serviceability** | Block checkout for non-serviceable pincodes with a clear message. |

## 6. Checkout session states

| State | Meaning |
| --- | --- |
| Initiated | Checkout started from cart |
| Address/Shipping set | Delivery resolved |
| Payment pending | Awaiting gateway outcome |
| Paid | Confirmed by gateway (prepaid) / placed (COD) |
| Failed | Payment failed — recoverable |
| Confirmed | Order created, invoice issued |
| Abandoned | Left before completion |

## 7. KPIs

| KPI | Signal |
| --- | --- |
| Checkout completion rate | overall friction |
| Step-level drop-off | where trust/effort breaks |
| Payment success rate (by method) | gateway/method health |
| COD share & COD RTO rate | margin & risk (if COD enabled) |
| Coupon application rate | promo effectiveness |
| Time-to-complete checkout | premium fast experience |

## 8. Edge cases

- **Payment timeout / pending** → don't double-charge; reconcile via webhook;
  inform customer.
- **Stock gone at payment** → fail gracefully, refund/void if charged, offer
  alternatives.
- **Coupon expires mid-checkout** → re-validate, recompute, notify.
- **Address non-serviceable** → block with reason, suggest alternate pincode.
- **Network drop on confirm** → idempotent retry yields one order.
- **Partial COD eligibility** (some pincodes/values) → enforce COD rules per order.

## 9. Future extensibility

- **Express/one-click checkout**, saved cards/UPI handles, wallet, EMI/BNPL.
- **Loyalty/points redemption** and **gift cards** at payment (future domains).
- **Address autofill / pincode intelligence**; partial payments; gifting options.
