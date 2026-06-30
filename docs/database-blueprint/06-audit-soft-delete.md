# 06 · Audit & Soft Delete

**Status:** Blueprint (no implementation).
**Basis:** `004` Common Columns + Soft Delete, TRD §8, `012` Audit Logs.

## 1. Audit columns (every table except `audit_logs`)

| Column | Type | Null | Meaning / Why |
| --- | --- | --- | --- |
| `createdAt` | timestamptz | no | When the row was created. **`timestamptz`** (UTC) — never naive timestamps, so India/UTC and future regions are unambiguous. |
| `updatedAt` | timestamptz | no | Last modification; bumped on every update (app- or trigger-driven). |
| `deletedAt` | timestamptz | yes | Soft-delete marker; `NULL` = live. |
| `createdBy` | uuid | yes | Actor (user/admin) who created it; FK → users, `ON DELETE SET NULL`. |
| `updatedBy` | uuid | yes | Actor who last changed it. |

**Why both `*At` and `*By`:** `004`/TRD require accountability ("who + when") for a
multi-admin, GST-regulated business. `*By` is nullable because system/automated
and guest-origin rows may have no human actor.

## 2. Soft-delete strategy

- **Rule (`004`):** every table **except append-only logs** has `deletedAt`.
  Deleting = setting `deletedAt = now()`; rows are never physically removed by the
  application.
- **Why soft delete:** preserves referential history (orders referencing a
  "deleted" product), supports undo/restore, audit, and analytics, and prevents
  accidental destruction of financial records (BRD §20).
- **Global read filter:** all queries implicitly add `WHERE deletedAt IS NULL`
  (Prisma middleware/extension at implementation time). **Why:** one missed filter
  leaks deleted data — it must be centralized, not per-query.
- **Uniqueness under soft delete:** business-unique columns use **partial unique
  indexes** `WHERE deletedAt IS NULL` (see [05](./05-indexing-strategy.md)). **Why:**
  a customer who deletes then re-registers the same email must not collide with the
  tombstoned row.
- **Cascade semantics:** soft delete cascades only into **live owned children**
  (e.g. user → addresses/cart), **never** into financial/historical records
  (orders, payments, invoices, audit_logs). See
  [02 §3.2](./02-entity-relationship.md).
- **Restore:** set `deletedAt = NULL` (subject to uniqueness re-check).

### Soft delete vs anonymization vs hard delete

| Need | Mechanism |
| --- | --- |
| Routine "delete" | Soft delete (`deletedAt`) |
| Right-to-erasure of PII (DPDP/GDPR-style) on a customer with order history | **Anonymize PII**, retain financial rows ([09](./09-data-retention.md)) |
| True purge (expired logs, abandoned **customer** carts, expired sessions/OTP) | Scheduled **hard delete** job (guest cart state expires by Redis TTL, not a DB purge) |

## 3. Audit trail (`audit_logs`)

- **Append-only, immutable**: only `createdAt`; **no** `updatedAt`/`deletedAt`
  (exempt from soft delete per `004`). **Why:** an audit record you can edit or
  delete is not an audit record.
- **Captures** (012): product updates, order updates, user login, admin activity —
  generalized to `actorId`, `action`, `entity`, `entityId`, `diff (jsonb
  before/after)`, `ip`, `createdAt`.
- **Population:** written by the application service layer (and/or DB triggers) on
  state-changing operations — mechanism deferred to implementation.
- **Why separate from row audit columns:** `*By/*At` answer "who last touched this
  row"; `audit_logs` answer "what was the full history of changes" — both are
  needed for compliance and incident forensics.
- **Retention:** see [09](./09-data-retention.md) (audit logs kept long, then
  archived).

## 4. Timestamp & timezone policy

- All timestamps are **`timestamptz` in UTC**; presentation converts to IST.
- `createdAt`/`updatedAt` default at the DB layer (`now()`), not the app, so they
  are authoritative even for direct writes.
