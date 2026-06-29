# `packages/` — Shared Workspace Libraries

This directory holds internal packages shared across `frontend` and `backend`
via pnpm workspaces. Each package is published privately within the monorepo
(`workspace:*`) and consumed by name (e.g. `@fworld/types`).

## Planned packages

| Package          | Responsibility                                             |
| ---------------- | ---------------------------------------------------------- |
| `@fworld/types`  | Shared domain & DTO TypeScript types (API contract)        |
| `@fworld/config` | Shared ESLint / TS / Prettier presets                      |
| `@fworld/ui`     | Cross-surface design-system primitives (post design phase) |
| `@fworld/utils`  | Framework-agnostic pure utilities                          |

> Packages are scaffolded on demand as the contract between frontend and
> backend solidifies. The shared **TypeScript base config** already lives at
> the repo root (`tsconfig.base.json`) and is extended by every workspace.
