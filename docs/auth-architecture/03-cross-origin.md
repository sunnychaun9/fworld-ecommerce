# 03 · Cross-Origin Behavior `:3000 ↔ :4000` (Q3)

**Status:** ✅ CTO Approved — Frozen for MVP (Q3).

**Approved (Q3):** Production is **`https://fworld.com`** (frontend) +
**`https://api.fworld.com`** (backend) — treated as **same-site**; cookies are the
**primary** authentication mechanism. Development is `localhost:3000` +
`localhost:4000` with **`credentials: true`**.

The storefront and API are **different origins**; cookie sessions must be sent on
API calls — this is the crux of the integration, solved by the same-site domain
strategy below.

## 1. Key distinction: "same-site" ≠ "same-origin"

- **Cookies** care about **site** = registrable domain (eTLD+1). **Ports do not
  affect site.** So `localhost:3000` and `localhost:4000` are **same-site** →
  `SameSite=Lax` cookies are sent in dev. ✔
- **CORS** cares about **origin** (scheme+host+**port**). 3000≠4000 → cross-origin
  → the API must send `Access-Control-Allow-Origin: <storefront>` +
  `Access-Control-Allow-Credentials: true`, and the client must send
  `credentials: 'include'`.

## 2. Development

- Storefront `http://localhost:3000`, API `http://localhost:4000` → **same-site**
  (localhost), **cross-origin** (ports).
- CORS: allow the storefront origin with credentials (Sprint 1 already enables
  CORS with `credentials: true`; origin is config-driven).
- Cookies: `SameSite=Lax`, `Secure=false` on plain-localhost (or use HTTPS proxy).

## 3. Production — domain strategy (**APPROVED — Option A**)

| Option | Layout | Cookie posture | Status |
| --- | --- | --- | --- |
| **A (approved)** | storefront `fworld.com`, API `api.fworld.com` (custom domain on Railway) | **same-site** → `SameSite=Lax`, `Domain=.fworld.com`; simplest CSRF | ✅ Q3 |
| B | storefront `fworld.com`, API on `*.railway.app` | **cross-site** → `SameSite=None; Secure`; stronger CSRF required; more tracking-prevention risk | ✗ rejected |

The API is on a **subdomain of the storefront's registrable domain**
(`api.fworld.com`). This keeps sessions **same-site**, lets cookies use
`SameSite=Lax`, simplifies CSRF, and survives browser third-party-cookie
restrictions. Requires a custom domain mapping on Railway (infra prerequisite).

## 4. CORS policy (both envs)

- **Allow-list** the exact storefront origin(s) — never `*` with credentials.
- `Access-Control-Allow-Credentials: true`; allow methods/headers incl.
  `Idempotency-Key`, `X-Request-Id`, `X-Correlation-Id`
  ([api-architecture/04](../api-architecture/04-idempotency-and-correlation.md)),
  and the CSRF header ([09](./09-security.md)).
- Preflight (`OPTIONS`) cached.

## 5. Frontend client

- Better Auth **client** configured with the API base URL and `credentials:
  'include'`; TanStack Query fetchers also send credentials.
- No token handling in the client (cookies are automatic).

> **CTO decision (Q3): APPROVED** — `fworld.com` + `api.fworld.com` (same-site),
> cookies primary, dev `credentials:true`. Drives `SameSite=Lax` in
> [02](./02-session-strategy.md) and the CSRF approach in [09](./09-security.md).
