# 04 · Idempotency & Correlation IDs

**Status:** ✅ CTO Approved / Frozen for MVP (D6, D7). **Cross-refs:**
business-architecture/07 (checkout idempotency), database-blueprint (payments
`transactionId` unique), TRD §13 (logging).

## 1. Idempotency strategy — **RATIFIED (D6)**

**Problem:** `POST` is not idempotent. Network retries, double-taps, and gateway
callbacks can create duplicate orders or double charges — unacceptable for
payments/checkout (business-architecture/07 §5).

**Contract:** an **`Idempotency-Key`** request header (client-generated UUID) is
**required** on these operations (D6):

| Operation | Endpoint (illustrative) |
| --- | --- |
| Checkout | `POST /checkout` |
| Payment creation | `POST /payment` |
| Payment capture | `POST /payment/capture` |
| Refunds | `POST /refunds` |
| Return requests | `POST /orders/{id}/return` |
| Exchange requests | `POST /orders/{id}/exchange` |

- The server stores `(idempotencyKey → first result + status)` in **Redis with a
  TTL** (D6; e.g. 24h). A repeat with the same key returns the **original** result
  (same status/body), performing the operation **once**. A missing key on these
  endpoints is rejected (`422 IDEMPOTENCY_KEY_REQUIRED`).
- Keys are scoped per authenticated principal (or guest session) to prevent
  cross-user collisions.
- Complements DB-level guards: unique `payments.transactionId`, unique
  `orders.orderNumber`, and inventory reservation (database-blueprint).

**Internal idempotency** (no client key): **webhooks** ([07](./07-files-and-webhooks.md))
dedupe on the provider event id; queue **consumers** must be idempotent (BullMQ
retries, [10](./10-modules-and-events.md)).

## 2. Request ID / Correlation ID strategy — **RATIFIED (D7)**

**Goal:** trace a single logical request across the API, queues, and external
calls — essential for support, Sentry, and audit (TRD §13).

**Contract (D7):** every request carries **both**:

| Header | Meaning |
| --- | --- |
| `X-Request-Id` | identifies **this single API request/hop**; server generates one (UUID v7) if the client omits it |
| `X-Correlation-Id` | identifies the **whole logical flow** across hops, queues, and async work; generated at the entry point if absent and preserved end-to-end |

- **Echo:** both are returned on every response.
- **Propagate (D7):** both IDs flow through **API → BullMQ → Meilisearch →
  Notifications → Webhooks → Logs → Sentry**. A job spawned from a request inherits
  the originating `X-Correlation-Id`; each processing hop may stamp its own
  `X-Request-Id`.
- Outbound calls to Razorpay/Shiprocket carry the correlation id where the provider
  supports it.

**Why now:** the header names and propagation contract are fixed so features add
async work consistently; the wiring lands with the Observability epic.

## 3. Logging linkage (TRD §13)

- Every log line and error carries the correlation id.
- `5xx` responses are sanitized to the client ([02](./02-response-envelope-and-errors.md))
  but the **server log + Sentry event** include the correlation id so support can
  map a user's report to the exact trace.

## 4. Client guidance (documented in OpenAPI)

- Generate one `Idempotency-Key` per logical attempt; **reuse** it on retries of
  the *same* attempt, generate a **new** one for a genuinely new attempt.
- Always send `X-Request-Id` from the frontend (one per user action) to aid
  end-to-end tracing.
