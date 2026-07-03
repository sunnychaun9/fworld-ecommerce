# `frontend/services/api/`

Base HTTP client and typed request/response wrappers for the FWorld REST API
(`/api/v1`).

- `client.ts` — shared Axios instance (`withCredentials` for Better Auth
  cookies), response-envelope unwrapping, bounded retry for idempotent requests,
  and an `onUnauthorized` seam. Exposes `api.get/post/patch/put/delete`.
- `errors.ts` — `ApiError` and `normalizeError`, mapping transport failures to the
  backend's stable error `code` / `status` / field errors.

See [`docs/005_API.md`](../../../docs/005_API.md).
