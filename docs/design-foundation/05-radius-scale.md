# 05 · Border Radius Scale

**Status:** Specification (no implementation).
**From** [`006_DESIGN_SYSTEM.md`](../006_DESIGN_SYSTEM.md): 4, 8, 12, 16, 24, 9999.

## 1. Scale

| Token | px | rem | Role |
| --- | --- | --- | --- |
| `--radius-sm` | 4 | 0.25 | Badges, tags, small inputs, checkboxes |
| `--radius-md` | 8 | 0.5 | Buttons, inputs, selects |
| `--radius-lg` | 12 | 0.75 | **Default** — cards, popovers, menus |
| `--radius-xl` | 16 | 1.0 | Modals, large surfaces, image frames |
| `--radius-2xl` | 24 | 1.5 | Hero/feature panels, sheets |
| `--radius-full` | 9999 | — | Pills, avatars, circular icon buttons |

## 2. Default & base variable

- The **default component radius** is `--radius-lg` (12px) — a soft, modern but
  restrained corner suited to the premium/minimal aesthetic.
- A single base hook `--radius` underpins shadcn/ui components (which derive
  `sm/md/lg` from it). The recommended base is **`--radius` = 12px (`0.75rem`)**.

> **Reconciliation note:** the current placeholder in `frontend/app/globals.css`
> sets `--radius: 0.625rem` (10px), which is **not** one of the `006` steps. The
> recommendation is to set `--radius` to `0.75rem` (radius-lg) when wiring tokens
> so the base aligns to the scale. (Documentation note only — not changed here.)

## 3. Rules

- Use `--radius-full` only for genuinely circular/pill shapes (avatars, toggle
  pills, icon buttons), never on rectangular content cards.
- Nested radii: inner elements use a step **smaller** than their container so
  corners stay concentric (e.g. card `lg` → inner thumbnail `md`).
- Keep radius consistent within a component family (all buttons share `--radius-md`).
