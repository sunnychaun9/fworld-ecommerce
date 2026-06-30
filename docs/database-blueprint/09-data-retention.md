# 09 · Data Retention

**Status:** Blueprint (no implementation).
**Basis:** `004` Backup, BRD §20 (privacy, Indian regulations), TRD §13/§22.
**Legal context:** India **DPDP Act 2023** (data-principal rights incl. erasure)
and **GST/Income-Tax** record-keeping obligations.

> Retention is a balance between **two opposing duties**: the right to erase
> personal data, and the legal duty to retain financial/tax records. The
> resolution is **anonymize PII, retain financial facts**.

## 1. Retention matrix

| Data class | Examples | Retention | Mechanism |
| --- | --- | --- | --- |
| **Financial / order records** | orders, order_items, payments, invoices, GST data | **Long (≈8 yrs)** per Indian tax/GST law | Retain even after user erasure; **anonymize linked PII** |
| **Customer PII** | users (name/email/phone), addresses | While account active + short grace; erase on request | Soft delete → **anonymize** when erasure requested |
| **Auth/security** | sessions, OTP, login audit | Short (sessions/OTP minutes–days; login audit longer) | Expire/purge |
| **Cart (guest)** | guest cart state in cookie/localStorage/**Redis** (no DB rows — auth-architecture/07) | Short (Redis **TTL**) | **TTL expiry** (no DB purge needed) |
| **Cart (customer)** | persisted DB carts (auth users only) | Until converted/abandoned + window | Soft delete then purge |
| **Wishlist** | wishlist | While account active | Soft delete with account |
| **Reviews / UGC** | reviews | Retained (anonymize author on erasure) | Keep content, detach PII |
| **Notifications** | notifications | Medium (e.g. 6–12 months) | Purge old |
| **Analytics / behavioral** | events, funnels | Aggregated long; raw short | Aggregate, then purge raw |
| **Audit logs** | audit_logs | Long (compliance/forensics) | Append-only, then archive |
| **Media** | product images, UGC images | While referenced; orphans purged | Reference-counted cleanup |
| **Backups** | daily/weekly/monthly | 30-day / weekly / monthly archive (`004`) | Rotation |

> Exact durations are **legal/finance decisions** (CTO/counsel) — the table sets
> the **policy shape**, not final numbers.

## 2. Erasure (DPDP / GDPR-style) vs financial retention

When a customer requests deletion:

1. **Anonymize PII in place** — replace name/email/phone/address with
   irreversible tokens on `users`/`addresses`; set `deletedAt`.
2. **Retain financial rows** — `orders`, `payments`, `invoices`, `order_items`
   stay (legal duty), now linked to an anonymized customer.
3. **Detach UGC PII** — reviews keep content, lose author identity.
4. **Record the erasure** in `audit_logs`.

**Why not hard-delete the user:** deleting a customer with orders would orphan or
destroy GST-mandated financial records. Anonymization satisfies erasure *and*
retention simultaneously.

## 3. Order & invoice retention

- Orders and **GST invoices are immutable** and retained for the statutory period
  even after product archival or customer erasure (ties to invoice-immutability,
  [business-architecture/08](../business-architecture/08-order-lifecycle.md)).
- `order_items` and `order_addresses` snapshots preserve exactly what was sold and
  shipped, independent of later catalog/address changes.

## 4. Analytics retention

- **Raw behavioral events** kept short; **aggregates/cohorts** kept long (TRD §22,
  013). Marketing/analytics processing is **consent-gated** (BRD §20).
- PII minimized in analytics; prefer pseudonymous IDs.

## 5. Audit retention

- `audit_logs` retained long for compliance and incident forensics, then moved to
  cold **archive** (monthly, per `004`). Never edited or soft-deleted ([06](./06-audit-soft-delete.md)).

## 6. Media retention

- Product/UGC media on Cloudflare R2 retained while referenced; **orphan media**
  (no referencing row) reclaimed by a scheduled job. Deleting a product soft-deletes
  the row but media cleanup is deferred until no order/history references remain.

## 7. Purge jobs

- Scheduled jobs perform **hard deletes** of expired, non-financial, non-audit data
  (abandoned **customer** DB carts, old notifications, expired sessions/OTP). Each
  purge is itself audited. Guest cart state is **not** a DB row — it expires by
  Redis TTL (auth-architecture/07). **Why:** soft delete alone grows tables
  unbounded; purge keeps hot tables lean (supports [05](./05-indexing-strategy.md)
  performance).
