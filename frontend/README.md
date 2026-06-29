# FWorld Frontend

Next.js 15 (App Router) storefront for FWorld.

## Stack

- **Next.js 15** + **React 19** + **TypeScript** (strict)
- **Tailwind CSS v4** + **shadcn/ui** (new-york)
- **TanStack Query** (server state) · **Zustand** (client state)
- **React Hook Form** + **Zod** (forms & validation)
- **Framer Motion** (animation) · **Lucide** (icons)

## Folder layout

| Folder        | Purpose                                                        |
| ------------- | -------------------------------------------------------------- |
| `app/`        | App Router routes, layouts, route handlers                     |
| `components/` | Reusable presentational components (`ui/` holds shadcn output) |
| `features/`   | Feature-scoped modules (cart, catalog, checkout, …)            |
| `hooks/`      | Reusable React hooks                                           |
| `lib/`        | Framework-level helpers (`cn`, clients, singletons)            |
| `services/`   | API/data-access clients                                        |
| `store/`      | Zustand stores                                                 |
| `providers/`  | React context/provider composition                             |
| `types/`      | Shared TypeScript types                                        |
| `utils/`      | Pure utility functions                                         |
| `constants/`  | App-wide constants & enums                                     |
| `config/`     | Typed runtime/config objects                                   |
| `styles/`     | Global styles & design-token CSS                               |
| `tests/`      | Unit/component tests                                           |

## Scripts

```bash
pnpm --filter @fworld/frontend dev        # start dev server on :3000
pnpm --filter @fworld/frontend build      # production build
pnpm --filter @fworld/frontend lint       # eslint
pnpm --filter @fworld/frontend typecheck  # tsc --noEmit
```
