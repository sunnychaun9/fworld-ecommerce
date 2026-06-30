# FWorld Authentication Architecture

**Status:** ✅ **CTO Approved — Frozen for MVP** (ratified 2026-06-29)
**Date:** 2026-06-29
**Author role:** Staff Backend Architect
**Provider:** Better Auth · **Session transport:** HTTP-only cookie (API D1 / Auth Q2)

> 🔒 **Frozen for MVP.** All authentication decisions (Q1–Q10) are CTO-approved and
> authoritative. There are **no unresolved authentication architecture questions
> for the MVP.** Any change requires a new ADR and CTO approval. This document is
> documentation only — no implementation.

## Fixed inputs (approved)

| Constraint | Source |
| --- | --- |
| **Better Auth**, running **inside NestJS** (single authentication authority) | Auth **Q1** |
| **Database-backed sessions**; **HttpOnly + Secure + SameSite=Lax** cookies; server-side validation; **no browser JWT** | Auth **Q2** / API D1 |
| Prod: `https://fworld.com` (frontend) + `https://api.fworld.com` (backend) = **same-site**; dev `localhost:3000/4000` with `credentials:true` | Auth **Q3** |
| Roles **Guest · Customer · Support · Manager · Admin · Super Admin** | Auth **Q4** |
| Methods: email/password, **phone OTP (MSG91)**, **email OTP (Better Auth verification)**, **Google**, **Apple**, **guest** | Auth **Q6/Q7**, BRD §12 |
| Guests **never** become DB users; guest state in **cookie / localStorage / Redis (temporary)**; merge **cart + wishlist + recently viewed** on auth | Auth **Q5** |
| Better Auth owns **User · Session · Account · Verification**; extend User via Prisma; **no parallel users table** | Auth **Q10** |
| Modular monolith; backend owns Prisma/DB | ADR-0001, CTO |

## Decisions (all approved)

| # | Decision | Ruling | Doc |
| - | -------- | ------ | --- |
| Q1 | Deployment topology | **Better Auth inside NestJS**; Next.js is frontend client only; NestJS owns Better Auth, Prisma, sessions, OAuth callbacks, RBAC, user management — **one authentication authority** | [01](./01-deployment-topology.md) |
| Q2 | Session strategy | **DB-backed sessions**; HttpOnly + Secure + SameSite=Lax cookie; server-side validation; **no browser JWT** | [02](./02-session-strategy.md) |
| Q3 | Cross-origin | `fworld.com` + `api.fworld.com` = same-site; cookies primary; dev `credentials:true` | [03](./03-cross-origin.md) |
| Q4 | RBAC | Roles **Guest, Customer, Support, Manager, Admin, Super Admin**; **controller guards AND service ownership**; never trust frontend permissions | [04](./04-rbac.md) |
| Q5 | Guest merge | No anonymous DB users; guest state in cookie/localStorage/Redis; merge **cart + wishlist + recently viewed**; never duplicate users | [07](./07-guest-to-user-merge.md) |
| Q6 | OTP | Phone OTP **MSG91**; email OTP **Better Auth email verification**; **5-min** lifetime; **max 5** retries; rate limited | [05](./05-credentials-and-otp.md) |
| Q7 | OAuth | **Google + Apple**; callbacks terminate **inside NestJS**; provider secrets never exposed to frontend | [06](./06-oauth-google-apple.md) |
| Q8 | Session lifecycle | **Sliding expiration**; logout revokes the DB session; **password reset** + **admin force-logout** revoke **all** sessions; inactive sessions auto-cleaned | [08](./08-session-lifecycle.md) |
| Q9 | Security | CSRF, HttpOnly, Secure, SameSite=Lax, CSP, Origin validation, **session-ID rotation after login**, rate limiting, OTP-abuse prevention, no user enumeration, audit logging — **mandatory for MVP** | [09](./09-security.md) |
| Q10 | User model | Better Auth owns User/Session/Account/Verification; **extend User via Prisma**; **no parallel users table**; single source of truth (**resolves DB-5**) | [10](./10-data-model-and-decisions.md) |

## Contents

01 [Deployment Topology](./01-deployment-topology.md) ·
02 [Session Strategy](./02-session-strategy.md) ·
03 [Cross-Origin](./03-cross-origin.md) ·
04 [RBAC](./04-rbac.md) ·
05 [Credentials & OTP](./05-credentials-and-otp.md) ·
06 [OAuth Google & Apple](./06-oauth-google-apple.md) ·
07 [Guest → User Merge](./07-guest-to-user-merge.md) ·
08 [Session Lifecycle](./08-session-lifecycle.md) ·
09 [Security](./09-security.md) ·
10 [Data Model & Decisions](./10-data-model-and-decisions.md)

> External prerequisites (start now): **MSG91 DLT** registration, Google/Apple
> OAuth credentials, and the `api.fworld.com` custom domain. See [10](./10-data-model-and-decisions.md) §5.
