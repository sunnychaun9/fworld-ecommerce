# 07 · Guest → User Account Merge (Q7)

**Status:** ✅ CTO Approved — Frozen for MVP (Q5). **Cross-refs:** BRD §9 (guest
checkout), business-architecture/02/06, CTO (Redis).

**Approved (Q5):** **Guests never become anonymous database users.** Guest state
exists only in the **cookie**, **localStorage**, and **Redis (temporary)**. After
authentication, **merge cart + wishlist + recently viewed** into the account.
**Never duplicate users.**

## 1. Model (approved — ephemeral guest state)

- A guest is identified by an **opaque guest token** (cookie); their **cart,
  wishlist, and recently-viewed** live in **Redis (temporary, TTL'd)** and/or
  **localStorage** — **no `user` row, no DB cart row** for guests.
- On **first authentication** (login/register/social/OTP), an **auth-success
  event** triggers a merge of the guest's Redis/local state into the
  authenticated user's persistent records.

> **Rejected:** the Better Auth *anonymous* plugin (would create throwaway DB user
> rows — contradicts "never become DB users" / "never duplicate users").

## 2. Merge rules (business-architecture/06)

On authentication, merge **cart + wishlist + recently viewed**:

- **Union** cart line items; combine quantities for the same variant (bounded by
  stock / per-order limits).
- Merge wishlist and recently-viewed (de-duplicated).
- Re-validate **price and availability** at merge (guest state may be stale).
- Guest **checkout** that creates an account (post-purchase) associates the order
  with the new user.
- **Idempotent**: merging the same guest token twice must not duplicate items
  ([api-architecture/04](../api-architecture/04-idempotency-and-correlation.md)).

## 3. Lifecycle

- After a successful merge, the guest's Redis/local state is **cleared**; guest
  tokens and any temporary Redis keys expire by TTL — no retention/cleanup of guest
  *user rows* is needed because none are created.

## 4. Cross-doc note (reported, not changed here)

`database-blueprint/03` previously modeled a **guest cart as a DB row**
(`carts.sessionToken`, DB-9). Q5 supersedes that for guests: **guest carts are
ephemeral (Redis/cookie/localStorage)** and only become DB rows **after
authentication**. The blueprint needs an alignment note — flagged in the change
summary; not edited by this task.

> **CTO decision (Q5): APPROVED** — ephemeral guest state (cookie/localStorage/
> Redis), no anonymous DB users, merge cart + wishlist + recently viewed on auth,
> never duplicate users.
