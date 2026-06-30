# 10 · Better Auth Data Model & Consolidated Decisions (Q10)

**Status:** ✅ CTO Approved — Frozen for MVP (Q10). **Resolves database-blueprint
DB-5.** **Cross-refs:** database-blueprint/01–04, CTO (Better Auth, UUID v7,
snake_case+@map).

**Approved (Q10):** Better Auth owns **User, Session, Account, Verification**.
**Extend Better Auth's User via Prisma** — **do NOT create a parallel users
table.** Single source of truth.

## 1. Better Auth-owned tables

Better Auth (via the **Prisma adapter**) owns and manages:

| Table | Purpose | Soft delete? |
| --- | --- | --- |
| `user` | identity + profile (**= the domain user**, extended) | yes (`deletedAt` + anonymize, database-blueprint/09) |
| `account` | one row per linked credential/provider (password, Google, Apple) | n/a (managed by Better Auth) |
| `session` | DB-backed sessions ([08](./08-session-lifecycle.md)) | no — ephemeral (hard-delete on logout/expiry), like logs |
| `verification` | email/OTP verification + reset tokens | no — ephemeral, TTL-purged |
| (plugin) phone/OTP | OTP challenge records (MSG91 flow) | no — ephemeral |

## 2. The user table reconciliation (resolves DB-5)

The Better Auth **`user` table IS the domain `users` table**, **extended** with
FWorld fields via Better Auth's additional-fields config:

| database-blueprint `users` column | Where it lives now |
| --- | --- |
| `name`, `email`, `emailVerified`, `avatar` | Better Auth `user` (native) |
| `phone`, `phoneVerified`, `role`, `status`, `lastLogin` | Better Auth `user` **additional fields** |
| **`password`** | **removed** → `account` row (provider `credential`, hashed) |
| **`provider`** | **removed** → **`account`** rows (one per linked identity) |

This **resolves DB-5**: a user can link email + Google + Apple simultaneously
(multiple `account` rows) — the single `provider` column is gone; passwords live
in `account`, never on `user`. Domain tables (`addresses`, `orders`, `reviews`, …)
FK to `user.id`.

## 3. Conventions alignment (CTO decisions)

| Concern | Rule | Note |
| --- | --- | --- |
| **IDs** | UUID v7 via Better Auth **custom `generateId` = `newId()`** (Sprint 1) | overrides Better Auth's default id; keeps app-layer v7 (CTO) |
| **Casing** | snake_case columns via Prisma **`@map`/`@@map`** (D10) | Better Auth field names stay camelCase in Prisma models |
| **Money/etc.** | n/a to auth tables | — |
| **Audit columns** | `createdAt`/`updatedAt` on `user`; `deletedAt` + anonymize on `user` only | `session`/`verification` are ephemeral (exempt, like logs) |
| **Migrations** | Better Auth schema generated, then **owned by Prisma Migrate** (forward-only, database-blueprint/08) | one migration history |

> **Integration risk to validate in S2 spike:** Better Auth's generated schema
> must accept (a) custom `generateId`, (b) `@map` snake_case, (c) extra user
> fields, and (d) coexistence with the webhook **raw-body** parser
> ([api-architecture/07](../api-architecture/07-files-and-webhooks.md)). Confirmed
> before writing migrations.

## 4. Consolidated decisions — **ALL APPROVED (CTO numbering)**

| Q | Topic | Approved ruling |
| - | --- | --- |
| **Q1** | Topology | Better Auth **in NestJS**; single authentication authority ([01](./01-deployment-topology.md)) |
| **Q2** | Session | **DB-backed sessions**; HttpOnly/Secure/`SameSite=Lax`; no browser JWT ([02](./02-session-strategy.md)) |
| **Q3** | Cross-origin | `fworld.com` + `api.fworld.com` (same-site); dev `credentials:true` ([03](./03-cross-origin.md)) |
| **Q4** | RBAC | **Guest, Customer, Support, Manager, Admin, Super Admin**; guards + service ownership ([04](./04-rbac.md)) |
| **Q5** | Guest merge | ephemeral guest state (cookie/localStorage/Redis); merge cart+wishlist+recently-viewed; no anon users ([07](./07-guest-to-user-merge.md)) |
| **Q6** | OTP | MSG91 phone OTP; Better Auth email verification; 5-min; max 5; rate limited ([05](./05-credentials-and-otp.md)) |
| **Q7** | OAuth | Google + Apple; backend-terminated callbacks; secrets never on frontend ([06](./06-oauth-google-apple.md)) |
| **Q8** | Lifecycle | sliding expiry; logout revokes session; reset + admin force-logout revoke all; auto-clean ([08](./08-session-lifecycle.md)) |
| **Q9** | Security | full control list **mandatory for MVP**; session-ID rotation after login ([09](./09-security.md)) |
| **Q10** | Data model | Better Auth owns user/session/account/verification; extend user via Prisma; no parallel table (this doc) |

**No unresolved authentication architecture questions remain for the MVP.**

## 5. External / lead-time prerequisites (start now)

- **MSG91 DLT** template + sender-ID registration (India SMS lead time) — Q5.
- **Google** OAuth client + **Apple** Developer (Services ID, key) — Q6.
- **API custom domain** (`api.fworld.com`) on Railway — Q3.
- Secrets provisioned to Vercel/Railway vaults (no commits) — TRD §14.

> **Approved.** This section + the API architecture are committed together as the
> **"Architecture Freeze"** milestone (held per CTO instruction until the freeze),
> after which Sprint 2 (auth implementation) begins.
