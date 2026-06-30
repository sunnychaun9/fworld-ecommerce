# 10 · Module Interaction Rules & Event-Driven Boundaries

**Status:** ✅ CTO Approved / Frozen for MVP. **Cross-refs:** ADR-0001 + CTO
(modular monolith), CTO (BullMQ, Meilisearch async indexing, Notifications/Resend/
MSG91), TRD §6, business-architecture/01, database-blueprint/01.

## 1. Modular monolith — module interaction rules

The backend is **one deployable** with strong internal module boundaries
(bounded contexts, business-architecture/01). Rules:

1. **Public surface only.** A module exposes a **service interface** (its public
   API) and its DTOs/events. Other modules depend on that interface — never on
   another module's controllers, repositories, or Prisma models directly.
2. **No cross-module table reads.** A module owns its tables. To read another
   context's data, call its service (e.g. Orders asks `InventoryService` for
   availability; it does not query `inventory` itself). Enforces the single-source-
   of-truth rules (CTO: inventory; database-blueprint/01 §3).
3. **Reference by ID.** Cross-aggregate links are by UUID, not embedded objects
   (database-blueprint/01).
4. **Dependency direction.** Depend toward **stable, lower-level** modules
   (catalog, inventory, identity); higher-level orchestrators (checkout, orders)
   depend on them, not vice versa. **No cyclic module dependencies** (enforced like
   the Sprint 1 graph). When two modules would cycle, invert via a **domain event**
   (§3) or a shared `@fworld/types` contract.
5. **Shared kernel** is minimal: `common/` (envelope, errors, ids, filters) and the
   future `@fworld/types` (DTO/contract types). No business logic in the shared
   kernel.
6. **Transactions** stay within a single module/aggregate; cross-module
   consistency is achieved by events + idempotent handlers (§4), not distributed
   transactions.

## 2. Synchronous vs asynchronous

| Use **synchronous** (in-process service call) when… | Use **asynchronous** (event + BullMQ) when… |
| --- | --- |
| the caller needs the result now (checkout needs stock reserved) | the work can happen after the response (search reindex, email) |
| it is a read or a tightly-consistent write within a flow | it is a side effect, retryable, or slow/external |
| failure must block the user action | failure must not block the user action |

## 3. Domain events & event-driven boundaries

State changes publish **domain events** (e.g. `order.placed`, `order.shipped`,
`product.updated`, `inventory.changed`, `payment.captured`, `return.requested`).
Events decouple producers from consumers and break potential cycles.

**Queue/worker boundaries (BullMQ over Redis — CTO):**

| Event (producer) | Async consumer(s) | Outcome |
| --- | --- | --- |
| `product.created/updated`, `inventory.changed`, price change | **Meilisearch indexing** worker | (re)index the search projection — **asynchronous indexing** (CTO); the catalog is the source of truth, the index is derived (business-architecture/05) |
| `order.placed`, `order.shipped`, `order.delivered`, `return.*` | **Notifications** worker | email (**Resend**), SMS (**MSG91**), in-app (database-blueprint/04 channels) |
| `cart.abandoned` (scheduled) | Notifications worker | abandoned-cart recovery (business-architecture/06/10) |
| webhook received (Razorpay/Shiprocket) | provider-reconciliation worker | fast-ACK then process ([07](./07-files-and-webhooks.md)) |
| scheduled jobs | retention/purge, low-stock alerts, RTO reconciliation | database-blueprint/09, business-architecture/09 |

**Queue conventions:**
- **Idempotent consumers** — BullMQ retries; a job must be safe to run more than
  once ([04](./04-idempotency-and-correlation.md)).
- **Job payloads** are validated (Zod, [06](./06-validation-and-dto.md)) and carry
  the **correlation id**.
- **Retries + backoff**, a **dead-letter** path for poison jobs, and Sentry alerts
  on repeated failure.
- **Ordering**: do not assume global ordering; design handlers to tolerate
  out-of-order delivery (use entity state, not arrival order).
- **Indexing lag is bounded** (a search-freshness SLA, business-architecture/05);
  never block a write on reindexing.

## 4. Eventual consistency rules

- Reads that depend on async work (e.g. a just-created product appearing in
  search) are **eventually consistent** — the API contract states this for search
  and analytics. Transactional reads (cart totals, stock at checkout) are
  **strongly consistent** via synchronous service calls.
- Money/stock/order state are **never** eventually consistent within a single user
  flow — they use synchronous, transactional paths (no oversell — CTO/BRD §20).

## 5. Module registration

- Feature modules register in `AppModule` in their feature sprint (Sprint 1 keeps
  only shared infra + health). Each module is self-contained: controller(s),
  service(s), repository, DTOs, events, and tests (TRD §6,
  [11](./11-coding-conventions.md)).
