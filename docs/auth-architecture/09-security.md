# 09 · Security Considerations (Q9)

**Status:** ✅ CTO Approved — Frozen for MVP (Q9). **Cross-refs:** TRD §14,
api-architecture/08, D1 (cookie sessions).

**Approved (Q9) — mandatory for MVP:** CSRF protection · HttpOnly cookies · Secure
cookies · SameSite=Lax · CSP headers · Origin validation · **session-ID rotation
after login** · rate limiting · OTP-abuse prevention · no user enumeration · audit
logging.

## 1. CSRF (required — cookies)

Because sessions ride in cookies (D1), state-changing requests need CSRF defense.
**Layered (recommended):**

1. **`SameSite=Lax` cookies** (feasible via the same-site domain strategy,
   [03](./03-cross-origin.md)) — blocks most cross-site form/CSRF.
2. **Origin/Referer validation** on all unsafe methods (`POST/PUT/PATCH/DELETE`):
   reject if `Origin` is not the allow-listed storefront.
3. **CSRF token** for unsafe requests where needed — Better Auth's CSRF protection
   / a double-submit token (cookie + `X-CSRF-Token` header). **Mandatory if the
   API is cross-site** (Option B domain in [03](./03-cross-origin.md)).

> **Approved (Q9):** all three layers are **mandatory** — `SameSite=Lax` cookies,
> **Origin validation** on unsafe methods, and **CSRF protection** (Better Auth
> CSRF / double-submit token). Same-site (Q3) makes this robust without relying on
> any single layer.

## 2. XSS

- **HttpOnly cookies** mean an XSS payload cannot read the session token (primary
  mitigation). Defense in depth:
  - **CSP** headers (via Helmet config), restrict scripts.
  - **Output encoding / sanitization** of all user/UGC content (reviews, blog) —
    prevents stored XSS (TRD §14).
  - React's default escaping; avoid `dangerouslySetInnerHTML` except sanitized
    CMS content.

## 3. Session fixation

- **Rotate the session id on authentication** and on **privilege change**
  (login, role change) — never reuse a pre-auth session id post-auth. Better Auth
  issues a fresh session on sign-in.

## 4. OTP / credential abuse

- OTP: hashed codes, short expiry, attempt caps + lockout, resend cooldown,
  per-phone + per-IP throttles (anti SMS-bombing/cost abuse) — [05](./05-credentials-and-otp.md).
- Login: **20/min auth tier** (api-architecture/08) + backoff/lockout on repeated
  failure; **generic messages** (no account enumeration).
- Passwords: strong KDF (Better Auth), breach-list check optional later.

## 5. Cookie & transport hardening

- `HttpOnly`, `Secure`, `SameSite`, `__Host-`/`__Secure-` prefixes where possible
  ([02](./02-session-strategy.md)); HSTS in prod; TLS everywhere.

## 6. Authorization & data protection

- Deny-by-default guards; **ownership checks** in services
  ([04](./04-rbac.md)) — prevents IDOR (UUID v7 ids are non-enumerable but
  ownership is still enforced).
- **Audit** auth + admin events to `audit_logs` (database-blueprint/06).
- **PII/logging:** never log passwords, OTP codes, tokens, or full session ids;
  redact; correlation id only ([api-architecture/04](../api-architecture/04-idempotency-and-correlation.md)).
- Secrets in vault (TRD §14); rotate OAuth/Apple keys.

## 7. Account lifecycle security

- Email/phone verification gates sensitive actions ([05](./05-credentials-and-otp.md)).
- Account block (`BLOCKED`) revokes sessions ([08](./08-session-lifecycle.md)).
- Erasure/anonymization per database-blueprint/09 (DPDP) while retaining financial
  records.

> **CTO decision (Q9): APPROVED** — the full control list above is **mandatory for
> MVP**, including **session-ID rotation after login** and rotation on
> privilege change.
