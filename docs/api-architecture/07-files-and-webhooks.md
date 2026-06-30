# 07 · File Upload/Download & Webhook Conventions

**Status:** ✅ CTO Approved / Frozen for MVP (D12). **Cross-refs:** CTO (Cloudflare
R2, Razorpay, Shiprocket, Better Auth, BullMQ), TRD §17 (images),
design-foundation/10, business-architecture/07–08.

## 1. File upload conventions

Media lives in **Cloudflare R2** (CTO; S3-compatible). Two patterns:

| Pattern | Use | Why |
| --- | --- | --- |
| **Presigned direct upload (preferred)** | admin product images, large media | client uploads straight to R2 via a short-lived presigned URL the API issues — keeps large bytes off the API server (performance, TRD §15) |
| **Proxied upload** | small/controlled cases | client → API → R2 when transformation/validation must happen server-side |

**Rules:**
- **Upload flow (presigned):** `POST /media/uploads` (auth + RBAC) returns a
  presigned URL + target key + constraints; client `PUT`s to R2; client confirms;
  the owning resource stores the **R2 reference** (not the binary) per
  database-blueprint/03 (`product_images.url`).
- **Validation:** allow-list **content types** (image/jpeg, png, webp, avif),
  enforce **max size**, verify magic bytes (not just extension), generate a
  server-side **key** (never trust client filename), strip the path.
- **Image strategy:** delivery formats AVIF/WebP, responsive, CDN — per
  design-foundation/10 and `next.config` (already configured). `dangerouslyAllowSVG`
  stays off.
- **Ownership & cleanup:** uploads are linked to a resource; orphaned media is
  reclaimed by a scheduled job (database-blueprint/09).
- **Access control:** product media is public-via-CDN; any private media (e.g.
  invoices) uses **short-lived presigned download URLs**, never public buckets.

## 2. File download conventions

- Public assets: served from the **CDN** (R2 public URL), cache-friendly.
- Private/financial assets (**GST invoice PDF**, `GET /orders/invoice` in `005`):
  authorized endpoint returns a **short-lived presigned URL** or streams with
  `Content-Disposition: attachment` after an **ownership check** ([05](./05-auth-flows-highlevel.md)).
  Invoices are immutable (database-blueprint/09).

## 3. Webhook conventions (Razorpay, Shiprocket, Better Auth)

Inbound webhooks are **untrusted, public endpoints** — treat every one as hostile
until verified. Common contract for all providers (**RATIFIED — D12**):

| Rule | Detail |
| --- | --- |
| **Dedicated namespace** | `POST /api/v1/webhooks/{provider}` (e.g. `/webhooks/razorpay`, `/webhooks/shiprocket`) |
| **Signature verification** | verify the provider's HMAC/signature against the raw body **before** parsing; reject `401` on mismatch |
| **Raw body** | the body parser must preserve the **raw payload** for signature checks (a known NestJS gotcha — configured at bootstrap, not per-route) |
| **Idempotent** (D12) | dedupe on the provider's event id; a re-delivered event must not double-apply ([04](./04-idempotency-and-correlation.md)) |
| **Logged** (D12) | every webhook receipt + outcome is logged with the correlation id; failures alert via Sentry |
| **Success only after successful processing** (D12) | return `2xx` **only after** the event is verified and **durably accepted** — i.e. signature-checked, deduped, and **persisted/enqueued to BullMQ**. If verification, persistence, or enqueue fails, return a non-2xx so the provider **retries**. "Processing" = durable acceptance, not full downstream completion |
| **Queue heavy work** (D12) | once durably accepted, the slow/downstream work (reconciliation, notifications, indexing) runs in a **BullMQ** consumer ([10](./10-modules-and-events.md)), never inline — providers time out and retry on slow handlers |
| **No envelope** | webhook responses follow the **provider's** expected format/status, **not** the `{success,...}` envelope (they are not FWorld API consumers) |
| **Rate limiting** | exempt from the standard user throttle (provider-driven); protect via signature + provider IP allow-list where available |
| **Observability** | every webhook carries a correlation id; failures alert via Sentry |

### Provider specifics (contract level)

- **Razorpay** (`/webhooks/razorpay`): payment captured/failed/refunded; verify
  `X-Razorpay-Signature`; reconcile `payments` + order `paymentStatus`
  (business-architecture/07–08). The order's paid state is driven by this webhook,
  **not** the client redirect.
- **Shiprocket** (`/webhooks/shiprocket`): shipment/tracking status updates; map to
  `ShipmentStatus`, roll up to `OrderStatus`, handle **RTO** (database-blueprint/04,
  business-architecture/08).
- **Better Auth callbacks** (OAuth Google/Apple, OTP): handled within the **auth
  boundary**; their transport/placement is finalized in the **Auth Design Review**.
  Listed here only so the webhook/callback **conventions** (verification, raw body,
  idempotency) are known to apply.

## 4. Outbound calls to providers

- Wrapped behind a module service (`PaymentsService`, `ShippingService`,
  `NotificationsService`) — no controller calls a vendor SDK directly
  ([10](./10-modules-and-events.md), [11](./11-coding-conventions.md)).
- Timeouts, retries (BullMQ for async), and circuit-breaking on provider
  failures; secrets from env/config only (TRD §14).
