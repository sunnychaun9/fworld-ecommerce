# API

## OpenAPI / Swagger

Interactive documentation is generated automatically from the controllers and
DTOs (via the `@nestjs/swagger` CLI plugin — no handwritten JSON) and served at:

```
GET /api/docs        # Swagger UI
GET /api/docs-json   # raw OpenAPI 3 document
```

Every controller appears as its own tag group. Request/response DTOs, enums,
validation constraints, pagination and examples are reflected from the TypeScript
types. Two security schemes are registered: `JWT` (HTTP bearer) and the Better
Auth session cookie. Use **Authorize** in Swagger UI to attach credentials.

## Conventions

- **Base path:** all business routes are under `/api/v1` (`API_PREFIX`); health
  probes are served at the root (`/health*`).
- **Envelope:** every response is `{ success, message, data, errors }`
  (`ResponseInterceptor` / `AllExceptionsFilter`).
- **Errors:** carry a stable machine-readable `code` (e.g. `NOT_FOUND`,
  `VALIDATION_ERROR`, `RATE_LIMITED`); validation failures return 422 with a
  per-field error list.
- **Pagination:** list endpoints accept `page` / `limit` (or `pageSize`) and
  return `{ items, pagination|total, ... }`.
- **Auth:** deny-by-default global guard; public routes are marked `@Public()`,
  admin routes require `ADMIN`/`SUPER_ADMIN` roles.

## Security

- `helmet` secure headers, `compression`, configurable CORS.
- Global rate limiting (`RATE_LIMIT_*`) plus stricter Better Auth limits on
  authentication endpoints. Payment verification and all business routes are
  covered by the global limiter.
- Request bodies are capped at 1 MB.

## Health endpoints

| Endpoint        | Purpose    | Success                                                        |
| --------------- | ---------- | ------------------------------------------------------------- |
| `GET /health`       | full status | `{ status, checks, version, uptime }`                    |
| `GET /health/live`  | liveness    | `{ status: "ok", uptime }`                               |
| `GET /health/ready` | readiness   | `{ status: "ready", checks }` (503 if DB unreachable)    |
