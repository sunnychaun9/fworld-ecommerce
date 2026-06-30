# 07 · Motion System

**Status:** Specification (no implementation).
**From** [`006_DESIGN_SYSTEM.md`](../006_DESIGN_SYSTEM.md): Framer Motion;
durations 150ms / 300ms / 500ms; ease `ease-in-out`. Patterns from
[`007_UI_UX.md`](../007_UI_UX.md): Hover, Fade, Slide, Scale, Page Transition,
Loading Skeleton, Micro-interactions.

## 1. Principles

Motion is **purposeful and restrained** (premium, not flashy — Handbook: "avoid
unnecessary animations"). It guides attention, communicates state, and adds
polish via micro-interactions — never blocks interaction or delays content.

## 2. Duration tokens

| Token | Value | Use |
| --- | --- | --- |
| `--duration-instant` | 0ms | State flips that must feel immediate |
| `--duration-fast` | 150ms | Hover, focus, small toggles, micro-interactions |
| `--duration-base` | 300ms | **Default** — fades, slides, dropdowns, accordions |
| `--duration-slow` | 500ms | Larger surfaces: drawers, page/section transitions |

## 3. Easing tokens

| Token | Curve | Use |
| --- | --- | --- |
| `--ease-standard` | `cubic-bezier(0.4, 0, 0.2, 1)` | Default (the `006` ease-in-out); most transitions |
| `--ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | Entrances (elements appearing) |
| `--ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Exits (elements leaving) |
| `--ease-emphasized` | `cubic-bezier(0.2, 0, 0, 1)` | Hero/feature emphasis (sparingly) |

## 4. Pattern catalogue

| Pattern | Tokens | Notes |
| --- | --- | --- |
| Hover / focus | `fast` + `ease-out` | Opacity/scale ≤ 1.02, color, shadow level +1 |
| Fade | `base` + `ease-standard` | Opacity 0↔1 |
| Slide | `base` + `ease-standard` | Menus, sheets; pair with fade |
| Scale | `fast`–`base` + `ease-out` | Modals/popovers enter at ~0.96→1 |
| Drawer / sheet | `slow` + `ease-standard` | Off-canvas translate |
| Page transition | `base` + `ease-standard` | Subtle fade/slide between routes |
| Skeleton shimmer | ~1.5s loop, linear | Loading placeholders (`007`) |
| Micro-interaction | `fast` | Add-to-cart, like, toggle feedback |

## 5. Reduced motion (accessibility — TRD §18)

- Honor `prefers-reduced-motion: reduce`: disable non-essential transform/parallax
  animations and skeleton shimmer; fall back to instant or simple opacity.
- With Framer Motion this is read via `useReducedMotion()`; transitions collapse
  to `--duration-instant`.
- Motion is **never** the sole signal of a state change (a color/label/icon also
  changes).

## 6. Rules

- Animate cheap properties (`opacity`, `transform`) — avoid layout-triggering
  properties (`width`, `top`, `height`) for performance (TRD §15).
- Keep most UI transitions ≤ `--duration-base`; reserve `--duration-slow` for
  large surfaces only.
- Motion tokens are mirrored in `frontend/config/theme.ts` (durations/easings) so
  Framer Motion variants reference the same values as CSS (see
  [01](./01-token-architecture.md) §5).
