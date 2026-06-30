# 02 · Session Strategy (Q2)

**Status:** ✅ CTO Approved — Frozen for MVP (Q2).

**Approved (Q2):** **database-backed sessions** managed by Better Auth; browser
authentication uses **only** an **HttpOnly + Secure + SameSite=Lax** cookie with
**server-side session validation**. **No JWT access tokens** for browser auth.

## 1. Cookie sessions vs JWT (why D1 is right)

| | **Cookie + DB session (chosen, D1)** | JWT in browser (rejected for browser) |
| --- | --- | --- |
| Token in JS reach | **No** (HTTP-only) → XSS can't steal it | Yes (localStorage/JS) → XSS exfiltration risk |
| Revocation | **Immediate** (delete session row) | Hard (stateless until expiry) |
| Server state | session row (acceptable; Postgres) | none (but revocation/refresh complexity) |
| CSRF | needs CSRF defense ([09](./09-security.md)) | not cookie-bound, but XSS-exposed |

**Conclusion:** browser auth uses **opaque, HTTP-only cookie sessions backed by a
DB session table** (Better Auth default). **JWTs are reserved for future
machine-to-machine** only (D1) and never placed in the browser.

## 2. Session token & cookie attributes

- **Session token:** opaque, high-entropy, random (Better Auth-managed); stored
  **hashed** in the `session` table; the raw value only ever lives in the cookie.
- **Cookie attributes (recommended):**

| Attribute | Value | Why |
| --- | --- | --- |
| `HttpOnly` | true | JS cannot read it (anti-XSS theft) |
| `Secure` | true (all envs except plain-localhost) | TLS-only |
| `SameSite` | **Lax** (same-site prod via subdomain — [03](./03-cross-origin.md)) | CSRF mitigation; works for top-level nav |
| `Path` | `/` | app-wide |
| `Domain` | parent domain in prod (`.fworld.com`) | shared across storefront + API subdomain |
| `Max-Age` | session TTL ([08](./08-session-lifecycle.md)) | bounded lifetime |
| name | Better Auth default (prefix `__Secure-`/`__Host-` where applicable) | hardening |

> If the API ends up on a **different registrable domain** than the storefront,
> `SameSite=None; Secure` is forced (cross-site) with stronger CSRF — see
> [03](./03-cross-origin.md). The recommendation avoids this.

## 3. Session storage

- **Database-backed sessions** via the **Prisma adapter** (Better Auth `session`
  table) — enables revocation, "log out everywhere", device/session listing, and
  audit. UUID v7 ids, audit columns per database-blueprint conventions.
- Optional later: a **Redis** cache in front of session reads for hot-path
  performance at scale (CTO Redis is available) — an optimization, not required
  for MVP.

## 4. What the browser stores

- **Only the cookie.** No access token, no refresh token, no user object in
  `localStorage`. The frontend learns identity by calling `GET /me`
  (`/api/v1/me`, the FWorld application-user endpoint) or the Better Auth client's
  session hook, which reads the cookie server-side.

> **CTO decision (Q2): APPROVED** — DB-backed sessions + the cookie attribute
> table above (`SameSite=Lax`, enabled by the same-site domain strategy in
> [03](./03-cross-origin.md)). No browser JWT.
