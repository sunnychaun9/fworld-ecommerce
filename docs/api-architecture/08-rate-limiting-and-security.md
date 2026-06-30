# 08 · Rate Limiting & API Security

**Status:** ✅ CTO Approved / Frozen for MVP. **Cross-refs:** TRD §14, `005_API.md`,
Sprint 1 (`ThrottlerModule`), CTO (Redis), Sprint 1 audit (M1/M2).

## 1. Rate limiting strategy

`005` defines **100 req/min** general, **20 req/min** auth. Sprint 1 ships a global
100/min guard. Production tiers:

| Tier | Limit | Scope |
| --- | --- | --- |
| **Global default** | 100 / min | per principal (or IP for guests) — live (S1) |
| **Auth-sensitive** | 20 / min | `/auth/*` (login, OTP send/verify, register) — per IP+identifier; throttles credential stuffing / OTP abuse |
| **Expensive/abusable** | tighter, per-route | `/products/search`, coupon apply, OTP send |
| **Webhooks** | exempt from user throttle | protected by signature + provider allow-list ([07](./07-files-and-webhooks.md)) |

**Required corrections (from Sprint 1 audit):**
- **M1** — drive limits from validated config (`RATE_LIMIT_*`), not hardcoded
  literals.
- **M2** — use a **Redis-backed** throttler store (CTO: Redis) so limits hold
  across horizontally-scaled instances (Railway, TRD §23). In-memory is per-instance
  and insufficient at scale.
- Apply the **20/min** auth tier in Sprint 2 via per-route throttle metadata.

**Behavior:** exceeding a limit returns **`429`** (`RATE_LIMITED`,
[02](./02-response-envelope-and-errors.md)) with a `Retry-After` header.

## 2. API security requirements (TRD §14)

| Control | Requirement | Status |
| --- | --- | --- |
| **HTTPS only** | TLS in all environments; HSTS in prod | infra (Vercel/Railway) |
| **Helmet** | security headers on every response | live (S1) |
| **CORS** | allow-list the storefront origin(s); `credentials` per auth design | live (S1); finalized with cross-origin auth |
| **Input validation** | global pipe + DTOs ([06](./06-validation-and-dto.md)) | live (S1) |
| **Output encoding** | escape user/UGC HTML (blog/reviews) — anti-XSS | per feature |
| **SQL injection** | Prisma parameterization; no string-built SQL | by ORM |
| **CSRF** | **required** — sessions are HTTP-only cookies (D1); strategy finalized in the Auth Design Review | mandated; design pending |
| **AuthN/AuthZ** | deny-by-default; RBAC + ownership ([05](./05-auth-flows-highlevel.md)) | S2 |
| **Rate limiting / throttling** | tiers above | partial (S1) |
| **Secrets** | env/vault only; never in code, logs, or responses | live (S1 hygiene) |
| **PII protection** | minimize in logs; never log passwords/tokens/full card/UPI; redact `payments.response` | policy ([04](./04-idempotency-and-correlation.md)) |
| **Idempotency** | payment/checkout/refund ([04](./04-idempotency-and-correlation.md)) | S8 |
| **Body limits** | max JSON/file size; reject oversized | bootstrap |
| **Webhook verification** | signature + raw-body + idempotency | [07](./07-files-and-webhooks.md) |
| **Audit logging** | admin/state changes to `audit_logs` (immutable) | database-blueprint/06 |
| **Dependency/security scanning** | Dependabot + CodeQL (already in CI) | live |

## 3. Sensitive-endpoint policy

- **Auth** endpoints: strict throttle, generic failure messages (no user
  enumeration — "invalid credentials", not "no such email"), lockout/backoff on
  repeated failures (auth design).
- **Payment** endpoints: idempotent, signature-verified webhooks are the source of
  truth; never trust client-reported payment success.
- **Admin** endpoints: `ADMIN`+ only, audited, optionally IP-restricted later.
- **PII/data-subject** endpoints (profile, erasure): ownership-checked; erasure
  follows the anonymize-retain-financial policy (database-blueprint/09).

## 4. Transport & headers

- Standard security headers via Helmet; `X-Request-Id` echoed
  ([04](./04-idempotency-and-correlation.md)); `Retry-After` on `429`;
  `Deprecation`/`Sunset` on deprecated versions ([01](./01-rest-conventions.md)).
- No sensitive data in URLs/query strings (tokens go in headers/body) — also avoids
  the Sprint 1 audit L3 (URL logging) leaking secrets.
