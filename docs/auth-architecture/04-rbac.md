# 04 · RBAC Model (Q4)

**Status:** ✅ CTO Approved — Frozen for MVP (Q4). **Cross-refs:** TRD §10,
database-blueprint/04 (`UserRole`), api-architecture/05.

**Approved (Q4):** the role set is **Guest, Customer, Support, Manager, Admin,
Super Admin**. Authorization happens in **controller guards AND service-layer
ownership validation**; **frontend permissions are never trusted**.

## 1. Roles (approved hierarchy)

| Role | Scope (illustrative; per-capability matrix finalized in the Admin sprint) |
| --- | --- |
| `GUEST` | browse, search, cart, wishlist (local), **guest checkout** |
| `CUSTOMER` | guest + place/track orders, returns/exchange, reviews, profile, addresses |
| `SUPPORT` | read & assist on customers and orders (support desk); no catalog/settings writes |
| `MANAGER` | operations: inventory, fulfilment, orders, returns/exchange processing |
| `ADMIN` | full back-office (012) |
| `SUPER_ADMIN` | admin + user/role management + settings |

`role` is a single enum on the (Better Auth) user ([10](./10-data-model-and-decisions.md)).

## 2. Two-layer authorization

Per api-architecture/05, **both** checks apply where relevant:

1. **Role check (coarse):** a NestJS **role guard** reads the session principal's
   `role` and allows/denies the route (`@Roles(ADMIN)`-style metadata). Default is
   **deny** for protected routes; public routes are explicitly marked.
2. **Ownership check (fine, data-dependent):** in the **service layer**, verify the
   principal owns the resource (a `CUSTOMER` may read only **their** orders/
   addresses/returns). Cannot be expressed by role alone.

Status mapping: unauthenticated → `401 UNAUTHENTICATED`; authenticated but not
permitted → `403 FORBIDDEN`
([api-architecture/02](../api-architecture/02-response-envelope-and-errors.md)).

## 3. Permission matrix (illustrative; finalized in the Admin sprint)

| Capability | GUEST | CUSTOMER | SUPPORT | MANAGER | ADMIN | SUPER_ADMIN |
| --- | :-: | :-: | :-: | :-: | :-: | :-: |
| Browse / search / view reviews | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| Cart / wishlist | ✔ (local) | ✔ (synced) | ✔ | ✔ | ✔ | ✔ |
| Checkout | ✔ (guest) | ✔ | — | — | — | — |
| View **own** orders/returns | — | ✔ | — | — | — | — |
| Assist customers / view all orders | — | — | ✔ | ✔ | ✔ | ✔ |
| Process orders/returns, inventory/fulfilment | — | — | — | ✔ | ✔ | ✔ |
| Manage catalog / coupons / content | — | — | — | — | ✔ | ✔ |
| Manage settings / users / roles | — | — | — | — | — | ✔ |

> Exact per-role capabilities are confirmed in the Admin sprint (S13); the
> **role set and two-layer authorization model** are the frozen architecture.

## 4. Implementation notes (high level, no code)

- Better Auth supports an **admin/role** concept and **additional user fields**;
  FWorld's `role` lives on the (extended) Better Auth user
  ([10](./10-data-model-and-decisions.md)).
- Admin surface (`/api/v1/admin/*`) requires `ADMIN`+ and is **audited**
  (database-blueprint/06 `audit_logs`).
- Role changes are admin-only, audited, and **rotate the session** (privilege
  change → new session id, [09](./09-security.md)).
- Guests are represented per the guest-merge decision ([07](./07-guest-to-user-merge.md)).

> **CTO decision (Q4): APPROVED** — six-role set + two-layer (controller guard +
> service ownership) authorization; frontend permissions never trusted. Granular
> per-role permissions are finalized in the admin sprint (S13).
