# 08 · Order Lifecycle

**Status:** Specification (no implementation).
**Anchors:** 012 (Order statuses), BRD §13/§15 (shipping/returns), PRD FR-050.

An order is the **system of record for a commercial commitment**. This document
defines its state machine, who can move it, the parallel payment/fulfillment
tracks, and the return/refund flow — with India-specific COD/RTO handling.

## 1. Order states (012)

`Pending → Confirmed → Packed → Shipped → Delivered`, with terminal/branch states
`Cancelled`, `Returned`, `Refunded`.

| State | Meaning |
| --- | --- |
| **Pending** | Order placed; awaiting payment confirmation (prepaid) or acceptance (COD) |
| **Confirmed** | Payment confirmed (prepaid) / COD accepted; ready to fulfill |
| **Packed** | Items picked & packed at warehouse |
| **Shipped** | Handed to courier (Shiprocket); tracking active |
| **Out for Delivery** | Last-mile (sub-state of Shipped) |
| **Delivered** | Received by customer |
| **Cancelled** | Stopped before delivery (by customer/admin/system) |
| **Returned** | Returned after delivery within policy |
| **Refunded** | Money returned to customer |

## 2. Primary state transitions

| From | To | Trigger | Actor |
| --- | --- | --- | --- |
| — | Pending | Order placed at checkout | Customer/System |
| Pending | Confirmed | Payment confirmed / COD accepted | Payments (webhook) / System |
| Pending | Cancelled | Payment failed/expired or customer cancels | System/Customer |
| Confirmed | Packed | Fulfillment picks & packs | Admin/Ops |
| Packed | Shipped | Courier pickup (Shiprocket) | Ops/Courier |
| Shipped | Delivered | Successful delivery | Courier (webhook) |
| Shipped | Cancelled→RTO | Undelivered / refused → return-to-origin | Courier/System |
| Confirmed/Packed | Cancelled | Customer/admin cancels before ship | Customer/Admin |
| Delivered | Returned | Return request approved & picked up | Customer→Admin |
| Returned/Cancelled | Refunded | Refund issued (prepaid) | Payments/Admin |

> Cancellation is allowed **up to "Shipped"**; after shipping it becomes a return
> or an RTO. Exact cut-offs are a business rule to confirm with Ops.

## 3. Parallel tracks

An order advances on three coordinated tracks:

| Track | States | Owner |
| --- | --- | --- |
| **Order/fulfillment** | Pending→…→Delivered | Orders/Ops |
| **Payment** | Pending → Paid → (Refund Pending → Refunded) / Failed | Payments (Razorpay) |
| **Shipment** | Created → Picked → In-transit → Delivered / RTO | Shipping (Shiprocket) |

The order status is a **business roll-up** of these; payment and shipment truths
come from gateway/courier webhooks, not manual edits.

## 4. COD specifics (India) ⚠ C2 / C6

- **COD order** is `Confirmed` without prepayment; **payment realized on
  delivery**. If COD isn't offered at launch, this branch is dormant (decision C2).
- **RTO (return-to-origin):** undelivered COD/prepaid shipments return to
  warehouse → restock + (for prepaid) refund. RTO rate is a first-class KPI and
  cost driver.
- **COD refund (C6):** with no prepaid instrument, refunds (e.g. for a returned
  COD order) require a **bank/UPI payout** — mechanism unspecified in BRD;
  flagged, not invented here.

## 5. Returns & refunds (BRD §15)

```text
Delivered → Return Requested → Approved → Pickup Scheduled → Picked Up
          → QC at Warehouse → (Pass) Refund Initiated → Refunded
                            → (Fail) Return Rejected → Item returned to customer
```

- **Window:** 7 days from delivery. **Conditions:** unused, original packaging,
  tags intact.
- **Refund path by payment method:** prepaid → reverse to source; COD → bank/UPI
  payout (C6).
- **Refund SLA** is a trust KPI; status visible to customer (PRD FR-050).
- ⚠ **C7 — Exchange gap:** apparel returns are dominated by **size exchanges**,
  but exchange is "future" (BRD §15). At launch this forces return→refund→re-buy,
  hurting conversion and CLV. Flagged for prioritization.

## 6. Notifications per transition

Each transition emits a customer notification (email/SMS/push as available):
order confirmed, packed, shipped (+tracking), out for delivery, delivered,
cancelled, return approved/picked/refunded. Drives trust and reduces "where is my
order" support contacts.

## 7. KPIs

| KPI | Signal |
| --- | --- |
| Order processing time (Confirmed→Shipped) | ops efficiency |
| On-time delivery rate | logistics quality |
| Cancellation rate (pre-ship) | demand/UX/payment issues |
| RTO rate (esp. COD) | address/COD risk & cost |
| Return rate (by category/size) | fit/quality signal |
| Return processing & refund SLA | trust |
| Delivery success rate | logistics partner quality |

## 8. Edge cases

- **Partial delivery / split shipment** (future multi-warehouse) — single order,
  multiple shipments.
- **Lost / damaged in transit** → claim, refund/replace.
- **Failed delivery attempts** → re-attempt → RTO.
- **Refund failure** (gateway/bank) → retry + manual reconciliation.
- **Return abuse** (worn/returned repeatedly) → flags, policy enforcement.
- **Cancellation after pack but before ship** → unpack/restock.
- **Invoice immutability** — issued GST invoices must remain valid even if the
  product is later archived (links to [03](./03-product-catalog-architecture.md)).

## 9. Future extensibility

- **Exchange module** (size/color) — high priority for apparel (C7).
- **Partial returns** (multi-item orders), **partial refunds**.
- **Multi-warehouse routing** & split fulfillment (TRD §23) — note PRD §15 single
  warehouse today (⚠ **C5**).
- **Self-serve returns** with instant refund-to-wallet (future Wallet domain).
- **Order editing** (address change pre-ship), subscription re-orders.
