# `frontend/services/auth/`

Client-side authentication/session service.

- `client.ts` — Better Auth browser client (`createAuthClient`) pointed at the
  backend auth mount (`/api/v1/auth`), with `credentials: 'include'` so the
  session cookie flows on cross-origin requests. Re-exports `signIn`, `signUp`,
  `signOut`, `useSession`, `getSession` and the inferred `Session` types.

The server owns session lifecycle and cookie refresh; this is the browser-side
surface. See [`docs/005_API.md`](../../../docs/005_API.md).
