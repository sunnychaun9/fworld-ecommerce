# 05 · Authentication & Authorization Flows (High Level)

**Status:** ✅ CTO Approved / Frozen for MVP (transport via D1) — **high level
only**. **Cross-refs:** CTO (Better Auth), TRD §9/§10, PRD §5, `005_API.md`,
business-architecture/02.

> **Session transport is RATIFIED (D1):** Better Auth with **HTTP-only, Secure
> cookie sessions**. The **browser never stores access tokens**; the backend
> trusts Better Auth sessions; **JWTs are reserved for future machine-to-machine**
> use only. This resolves conflict **API-1**.
>
> ⚠ The remaining auth specifics (deployment topology, cross-origin `:3000 ↔
> :4000`, **CSRF** strategy, OAuth callback handling, OTP, refresh/logout,
> session lifecycle/fixation) are finalized in the separate **Authentication
> Architecture Design Review** (next deliverable). This page fixes only the
> **API-contract shape**.

## 1. Authentication — flow shape (high level)

```text
Client ──▶ [Auth boundary: Better Auth] ──▶ session established
       ──▶ [API request] ──▶ AuthN middleware/guard ──▶ principal resolved ──▶ handler
```

- **Provider:** Better Auth (CTO) handles credential verification, OAuth, OTP,
  and session issuance. The exact runtime location (Next.js vs NestJS) and
  transport are **TBD in the Auth Design Review**.
- **AuthN guard (NestJS):** every protected route passes a guard that validates
  the session/token and attaches a typed **principal** (`userId`, `role`,
  `isGuest`) to the request context. Public routes are explicitly marked
  (`@Public`-style metadata) — **deny by default** is the rule.
- **Methods (BRD §12 / PRD FR-001..005):** email/password, email + phone **OTP**
  (MSG91), **Google**, **Apple**, and **guest**. Guest principals can browse/cart
  and check out (guest checkout), then optionally upgrade.

### Endpoint surface (from `005`, contract only)

```text
POST /auth/register   POST /auth/login    POST /auth/logout
POST /auth/otp/send   POST /auth/otp/verify
POST /auth/google     POST /auth/apple
GET  /auth/me         PUT  /auth/profile
```

> Whether these are served by NestJS controllers or proxied to a Better Auth
> handler is an Auth-Design-Review decision (API-1).

## 2. Authorization — flow shape (high level)

```text
principal(role, ownership) ──▶ AuthZ guard ──▶ allow | 403 FORBIDDEN
```

- **RBAC** (auth-architecture/04): the approved MVP roles are
  `GUEST · CUSTOMER · SUPPORT · MANAGER · ADMIN · SUPER_ADMIN` (database-blueprint/04
  `UserRole`).
- **Two checks**, both required where relevant:
  1. **Role check** — does the principal's role permit this operation?
     (`@Roles(ADMIN)`-style metadata on admin routes.)
  2. **Ownership check** — does the principal own this resource? (a customer may
     only read **their** orders/addresses). Enforced in the service layer, not
     just the guard, because ownership is data-dependent.
- **Status codes:** unauthenticated → `401 UNAUTHENTICATED`; authenticated but
  not allowed → `403 FORBIDDEN` ([02](./02-response-envelope-and-errors.md)).
- **Admin surface** (`/admin/*`, `005`) requires `ADMIN`+; isolated from customer
  routes.

## 3. Guest → customer continuity (high level)

- Guests transact via guest checkout (BRD §9). On login/registration, the guest's
  cart (and recommended wishlist) **merge** into the account
  (business-architecture/02/06). The merge **mechanism** is an auth/session detail
  for the Auth Design Review; the **contract guarantee** (no lost cart on login)
  is fixed here.

## 4. Decided vs deferred

- **Decided (D1):** session transport = **HTTP-only Secure cookie sessions**; no
  browser token storage; JWT for future M2M only.
- **Deferred to the Authentication Architecture Design Review:** cookie attributes
  (`SameSite`, domain), cross-origin `:3000 ↔ :4000` behavior, **CSRF** strategy
  (now required because sessions are cookie-based), token/session refresh,
  logout/session-revocation, session lifecycle/fixation, and OAuth callback
  handling. Webhook/callback **transport** conventions (e.g. Better Auth OAuth
  callbacks) are in [07](./07-files-and-webhooks.md).
