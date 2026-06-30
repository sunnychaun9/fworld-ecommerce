# 04 · Spacing Scale

**Status:** Specification (no implementation).
**From** [`006_DESIGN_SYSTEM.md`](../006_DESIGN_SYSTEM.md): 4, 8, 12, 16, 20, 24,
32, 40, 48, 64, 80, 96.

## 1. Base unit

**4px** is the atomic spacing unit. Every spacing value is a multiple of 4 so
layouts stay on a consistent rhythm. Values are expressed in `rem` (16px base) so
they scale with user zoom.

## 2. Scale

| Token | px | rem | Typical use |
| --- | --- | --- | --- |
| `--spacing-1` | 4 | 0.25 | Icon ↔ label gap, hairline insets |
| `--spacing-2` | 8 | 0.5 | Tight padding, chip padding |
| `--spacing-3` | 12 | 0.75 | Compact control padding |
| `--spacing-4` | 16 | 1.0 | **Default gap / control padding** |
| `--spacing-5` | 20 | 1.25 | Card inner padding (sm) |
| `--spacing-6` | 24 | 1.5 | Card padding, stack gap |
| `--spacing-8` | 32 | 2.0 | Section inner spacing |
| `--spacing-10` | 40 | 2.5 | Group separation |
| `--spacing-12` | 48 | 3.0 | Block spacing |
| `--spacing-16` | 64 | 4.0 | Section spacing (mobile) |
| `--spacing-20` | 80 | 5.0 | Section spacing (tablet+) |
| `--spacing-24` | 96 | 6.0 | Section spacing (desktop), hero padding |

> The token number equals `px / 4` (Tailwind-style), so `--spacing-6` = 24px.
> Steps not in `006` (e.g. 28, 36, 56) are intentionally **omitted** to keep the
> rhythm tight; if a gap is genuinely needed it is added here first.

## 3. Usage rules

- **Component padding** typically uses `--spacing-2` … `--spacing-6`.
- **Layout gaps** (grid/flex) use `--spacing-4` … `--spacing-8`.
- **Section vertical rhythm** scales by breakpoint: `--spacing-16` (mobile) →
  `--spacing-20` (tablet) → `--spacing-24` (desktop), supporting the
  whitespace-first, premium feel (`007`).
- Prefer `gap` over margins for spacing between siblings; reserve margins for
  one-off separation.
- The same scale drives `width`/`height` for small fixed sizes (icon boxes, touch
  targets) to keep everything on the 4px grid.

## 4. Touch targets

Interactive elements must present a **minimum 44×44px** hit area on touch
(`007` → Large Touch Targets; WCAG 2.5.8). Compose from the scale (e.g. an icon
button = `--spacing-2` padding around a 24px icon ⇒ 40px + border, padded to ≥44px
on mobile via the bottom-nav / sticky-CTA components).
