# 05 · Email/Password & OTP Flows (Q5)

**Status:** ✅ CTO Approved — Frozen for MVP (Q6). **Cross-refs:** BRD §12, PRD
FR-001/002/005, CTO (MSG91, Resend), api-architecture/08 (auth throttle).

**Approved (Q6):** **phone OTP via MSG91**; **email OTP via Better Auth email
verification**; **OTP lifetime 5 minutes**; **max 5 retries**; **rate limited**.
(MSG91 **DLT** template/sender-ID registration is an external prerequisite — start
now.)

> Flows are described at the **contract/sequence level only** — no code.

## 1. Email + password

```text
Register:  POST /auth/register {email,password,name}
           → create user (CUSTOMER) → send verification email (Resend)
           → establish session (cookie)  [or require verify-first — see note]
Login:     POST /auth/login {email,password} → verify hash → session cookie
Verify:    email link / token → mark emailVerified
Reset:     POST /auth/password/forgot → email token (Resend) → POST .../reset
```

- Passwords hashed by Better Auth (modern KDF); never stored/echoed/logged.
- Email verification uses **Better Auth email verification** (transport: Resend).
  Login is allowed with sensitive actions gated on verification — a UX/
  implementation detail of the auth sprint, not an architecture question.

## 2. Phone OTP (MSG91) — primary for India

```text
Send:   POST /auth/otp/send {phone}      → generate code → MSG91 (DLT template) → SMS
Verify: POST /auth/otp/verify {phone,code}
        → check code (hash, expiry, attempts) → find/create user → session cookie
```

- Implemented via Better Auth's **phone-number / OTP plugin** with a **custom SMS
  sender bound to MSG91**.
- **Codes:** short-lived (e.g. 5 min), single-use, **hashed at rest**, max attempts
  (e.g. 5) then lockout; resend cooldown.
- **MSG91 specifics (decision / lead time):** transactional OTP requires
  **DLT-registered templates and sender ID** in India — this has **procurement
  lead time** and must start now (flagged in the implementation backlog B7).
- **Rate limits:** OTP send/verify on the **20/min auth tier**
  ([api-architecture/08](../api-architecture/08-rate-limiting-and-security.md))
  plus per-phone throttles to prevent SMS-bombing / cost abuse.

## 3. Email OTP (Better Auth email verification)

- **Email OTP = Better Auth email verification** (Q6), with **Resend** as the
  delivery transport. Same 5-minute lifetime / 5-retry / rate-limit rules as phone
  OTP.

## 4. Guest

- Guest principals transact via guest checkout; on first auth they merge
  ([07](./07-guest-to-user-merge.md)).

## 5. Anti-abuse (cross-ref [09](./09-security.md))

- Generic responses (no account enumeration): "invalid credentials", "if an
  account exists…".
- Throttling + lockout/backoff on repeated failures; CAPTCHA is a future option if
  abuse warrants.
- All auth attempts logged with correlation id (no secrets/PII in logs).

> **CTO decision (Q6): APPROVED** — phone OTP (MSG91), email OTP (Better Auth email
> verification), 5-min lifetime, max 5 retries, rate limited. **MSG91 DLT
> registration is an external prerequisite — start now.**
