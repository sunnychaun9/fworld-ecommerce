# `frontend/config/`

Typed, framework-level configuration objects for the storefront — the single
place to read app settings, SEO defaults, navigation, feature flags, and theme
tokens (rather than scattering literals across components).

> **Status: placeholder.** The files below are documented stubs (`export {}`)
> with no implementation. They fix structure and intent only.

| File            | Purpose                                                         |
| --------------- | --------------------------------------------------------------- |
| `app.ts`        | App-wide runtime config (name, URLs, locale/currency defaults). |
| `seo.ts`        | Default SEO metadata, Open Graph/Twitter, canonical, JSON-LD.   |
| `navigation.ts` | Header/footer menus, category trees, route maps.                |
| `features.ts`   | Client feature flags (strategy pending an ADR).                 |
| `theme.ts`      | Typed theme tokens mirroring `app/globals.css`.                 |

References: [`docs/008_SEO.md`](../../docs/008_SEO.md),
[`docs/006_DESIGN_SYSTEM.md`](../../docs/006_DESIGN_SYSTEM.md). No implementation
is added at this stage.
