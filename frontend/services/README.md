# `frontend/services/`

API/data-access clients for the storefront. Each subfolder isolates one
external surface so components and hooks never call `fetch` directly.

> **Status: placeholder.** Folders and READMEs only — no implementation.

| Area        | Purpose                                          |
| ----------- | ------------------------------------------------ |
| `api/`      | Base REST client for the FWorld API (`/api/v1`). |
| `auth/`     | Auth/session client (strategy pending an ADR).   |
| `payment/`  | Razorpay client integration.                     |
| `shipping/` | Shiprocket client calls.                         |
| `search/`   | Meilisearch client.                              |
