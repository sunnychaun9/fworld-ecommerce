# `frontend/providers/`

React context/provider composition for the storefront. Providers wire
cross-cutting client concerns and are composed once near the root layout.

> **Status: placeholder.** The files below are documented stubs (`export {}`)
> with no implementation. They exist to fix the structure and intent only.

| File                     | Purpose                                                                |
| ------------------------ | ---------------------------------------------------------------------- |
| `query-provider.tsx`     | TanStack Query `QueryClientProvider` — server-state caching & retries. |
| `theme-provider.tsx`     | Theme / color-scheme context backed by design tokens.                  |
| `analytics-provider.tsx` | Analytics (GA4 / Clarity) initialization, consent-gated.               |

See [`docs/009_CODING_STANDARDS.md`](../../docs/009_CODING_STANDARDS.md) and
[`docs/013_ANALYTICS.md`](../../docs/013_ANALYTICS.md). No implementation is
added at this stage.
