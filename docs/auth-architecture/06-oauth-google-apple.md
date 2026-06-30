# 06 · OAuth — Google & Apple (Q6)

**Status:** ✅ CTO Approved — Frozen for MVP (Q7). **Cross-refs:** BRD §12, PRD
FR-003/004, [01](./01-deployment-topology.md).

**Approved (Q7):** providers **Google + Apple**; OAuth **callbacks terminate inside
NestJS**; **provider secrets are never exposed to the frontend**. (Google/Apple
developer credentials are an external prerequisite.)

> Sequence/contract level only — no code.

## 1. Flow shape (both providers)

```text
Storefront → "Continue with Google/Apple"
  → redirect to provider (via Better Auth social sign-in)
  → user consents at provider
  → provider redirects to BACKEND callback:
       /api/v1/auth/callback/{google|apple}
  → Better Auth verifies, creates/links account (account table), establishes
    session cookie, redirects back to storefront
```

- **Callbacks point at the backend** (Option B topology, [01](./01-deployment-topology.md)),
  not Next.js — the backend owns sessions.
- Provider identities are stored in the Better Auth **`account`** table (one user
  may link Google **and** Apple **and** email) — this is why a single
  `provider` column was insufficient (resolves part of **DB-5**,
  [10](./10-data-model-and-decisions.md)).
- After callback, the storefront lands authenticated (cookie set); cart/wishlist
  merge applies ([07](./07-guest-to-user-merge.md)).

## 2. Google

- Standard OAuth2/OIDC. Needs a **Google Cloud OAuth client** (client id/secret),
  authorized redirect URI = backend callback. Email is typically verified by
  Google → can set `emailVerified`.

## 3. Apple (more involved — decision)

Apple "Sign in with Apple" has India/web-specific quirks:

- **Client secret is a signed JWT** (from an Apple key) that **expires** and must
  be **regenerated** periodically — an operational task.
- Callback uses **`response_mode=form_post`** (POST to the callback) — the backend
  body-parser/route must accept it (coexists with the webhook raw-body config,
  [api-architecture/07](../api-architecture/07-files-and-webhooks.md)).
- Apple returns the user's **name only on first authorization** — must be captured
  then (cannot be re-fetched later).
- Apple offers **private relay email**; store as-is; communications still work via
  relay.
- Requires an **Apple Developer account**, App ID, Services ID, and key.

## 4. Account linking & conflicts

- Consistent with Q5/Q10 ("**never duplicate users**", single source of truth): if
  a social email matches an existing account, **link** the provider to that user
  (Better Auth `account` row) rather than creating a duplicate. Linking requires a
  **verified-email match** to prevent account takeover via an unverified email —
  derived from the approved "never duplicate users / no enumeration" principles
  ([09](./09-security.md)), not a new decision.

## 5. Credentials & secrets

- OAuth client ids/secrets and the Apple key come from **env/secret vault**
  (Vercel/Railway), never committed (TRD §14). Procurement is a prerequisite
  (backlog B6/B7).

> **CTO decision (Q7): APPROVED** — Google + Apple; **backend-terminated
> callbacks**; secrets never exposed to the frontend. External prerequisites:
> provision Google + Apple developer credentials; own Apple client-secret rotation
> operationally (non-architectural).
