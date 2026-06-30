# 08 · Responsive Breakpoint Strategy

**Status:** Specification (no implementation).
**From** [`006_DESIGN_SYSTEM.md`](../006_DESIGN_SYSTEM.md) /
[`007_UI_UX.md`](../007_UI_UX.md): tiers **Mobile, Tablet, Laptop, Desktop, Ultra
Wide**; **Mobile-First** is mandated.

## 1. Strategy

- **Mobile-first**: base styles target the smallest screen; larger tiers are
  progressive `min-width` enhancements. (TRD §2 mobile-first; `007` "Mobile First".)
- Six named min-width tiers map the `006` device names to concrete values aligned
  with Tailwind v4 defaults (so tokens and utilities agree).
- Layout decisions favor **fluid** sizing (clamp, fr, %, `min()/max()`) between
  tiers; breakpoints are where structure changes (columns, nav model), not every
  spacing tweak.

## 2. Breakpoint tokens

| Token | Min-width | `006` device | Notes |
| --- | --- | --- | --- |
| *(base)* | 0px | **Mobile** | Default styles; phones |
| `--breakpoint-sm` | 640px | (large phone) | Big phones / small tablets portrait |
| `--breakpoint-md` | 768px | **Tablet** | Tablet portrait |
| `--breakpoint-lg` | 1024px | **Laptop** | Tablet landscape / small laptop |
| `--breakpoint-xl` | 1280px | **Desktop** | Standard desktop |
| `--breakpoint-2xl` | 1536px | **Ultra Wide** | Large/ultra-wide monitors |

> `sm` (640px) is not a named `006` device but is retained to handle large
> phones gracefully; it is the only addition and is flagged in the audit.

## 3. Container widths

Centered content container with side gutters; max-width steps per tier.

| Tier | Container max-width | Side gutter (min) |
| --- | --- | --- |
| base | 100% | `--spacing-4` (16px) |
| md | 768px | `--spacing-6` (24px) |
| lg | 1024px | `--spacing-6` |
| xl | 1280px | `--spacing-8` (32px) |
| 2xl | 1440px (content cap) | `--spacing-8` |

- Content is capped (~1440px) on ultra-wide so line-lengths and product grids
  stay premium rather than stretching edge-to-edge; full-bleed sections (hero,
  banners) may exceed the cap intentionally.

## 4. Responsive behavior anchors (from `007`)

- **Navigation:** mobile bottom-nav + drawer → desktop navbar + mega-menu.
- **Product grid:** 2-up (mobile) → 3-up (tablet) → 4-up (desktop) (indicative).
- **Sticky CTAs:** sticky Add-to-Cart / checkout on mobile.
- **Touch:** large touch targets and swipe gallery on mobile (see
  [04](./04-spacing-scale.md) §Touch targets).

## 5. Mirror

Breakpoint values are mirrored in `frontend/config/theme.ts` (`breakpoints`) for
TS consumers (e.g. matchMedia hooks), referencing the same numbers as the CSS
tokens (see [01](./01-token-architecture.md) §5).
