# 08 · Session Lifecycle, Refresh & Logout (Q8)

**Status:** ✅ CTO Approved — Frozen for MVP (Q8). **Cross-refs:**
[02](./02-session-strategy.md), D1.

**Approved (Q8):** **sliding session expiration**; **logout** revokes the DB
session; **password reset** and **admin force-logout** revoke **all** the user's
sessions; **inactive sessions are cleaned automatically.**

## 1. Lifecycle (DB-backed cookie sessions)

```text
authenticate → create session row (id v7, userId, expiresAt, ip, userAgent)
            → set HttpOnly cookie (opaque token)
request     → guard loads session by cookie → valid & not expired → principal
activity    → sliding expiry: extend expiresAt on use (rolling window)
logout      → delete session row + clear cookie
expiry/idle → session past expiresAt is invalid → 401 → re-auth
```

- **Sliding (idle) expiry** with automatic cleanup of inactive sessions (Q8).
  Concrete idle/absolute durations (e.g. 7-day rolling idle, 30-day absolute cap)
  are **configuration values** finalized at implementation — not an architecture
  question.
- Sessions are rows → **listable and revocable** (device/session management,
  "log out everywhere").

## 2. "Refresh" with cookie sessions (no browser refresh token)

- Because the browser uses **opaque DB sessions** (not JWT, D1), there is **no
  refresh-token rotation in the browser**. "Refresh" = **sliding expiry**: each
  authenticated request extends `expiresAt` (Better Auth `updateAge`), so active
  users stay logged in without token gymnastics.
- **Future M2M JWTs** (D1) — if/when introduced — would use short-lived access +
  refresh tokens, entirely server-to-server, never in the browser.

## 3. Logout

```text
POST /auth/logout → revoke current session (delete row) → clear cookie → 200
```
- **Global logout** (optional): revoke **all** sessions for the user (delete all
  rows) — useful after password change / suspected compromise.
- Logout is **idempotent** (logging out an already-dead session still 200s).

## 4. Revocation triggers (approved)

Server-side session revocation occurs on:

| Trigger | Scope |
| --- | --- |
| Logout | the **current** session (Q8) |
| **Password reset** | **all** of the user's sessions (Q8) |
| **Admin force-logout** | **all** of the user's sessions (Q8) |
| Role/privilege change | rotate + revoke (also rotates — [09](./09-security.md)) |
| Account block (`UserStatus=BLOCKED`) | all sessions |

Because sessions are DB rows, all revocations are **immediate**.

## 5. Concurrency / multi-device

- Multiple concurrent sessions per user are allowed (phone + desktop). Each is an
  independent row; revoking one doesn't affect others (unless global logout).

> **CTO decision (Q8): APPROVED** — sliding expiration; logout revokes the current
> session; password reset + admin force-logout revoke all sessions; inactive
> sessions auto-cleaned. Specific TTLs and any device-management UI are
> implementation/config details, not open architecture questions.
