# 09 · Icon Strategy

**Status:** Specification (no implementation).
**From** [`006_DESIGN_SYSTEM.md`](../006_DESIGN_SYSTEM.md) /
[`007_UI_UX.md`](../007_UI_UX.md) / [`003_TRD.md`](../003_TRD.md): **Lucide React**.

## 1. Library

- **lucide-react** is the single icon system. One set only — no mixing of icon
  libraries (consistency, premium feel).
- Already a frontend dependency; `next.config.mjs` lists `lucide-react` under
  `experimental.optimizePackageImports` so only used icons are bundled
  (tree-shaking, performance — TRD §15).

## 2. Size tokens

Icons sit on the 4px grid and inherit text color.

| Token | px | Use |
| --- | --- | --- |
| `--icon-xs` | 14 | Inline with `text-xs`/`text-sm`, dense chips |
| `--icon-sm` | 16 | Inline with body, input adornments |
| `--icon-md` | 20 | **Default** — buttons, list items |
| `--icon-lg` | 24 | Navigation, section headers |
| `--icon-xl` | 32 | Feature/empty-state illustrations |

## 3. Style rules

- **Stroke width 1.5** by default (thinner = more premium); `2` only for small
  sizes or emphasis where 1.5 looks faint.
- **Color = `currentColor`** — icons inherit the surrounding text/semantic color;
  never hard-code icon colors.
- Optical alignment: pair icon size to the adjacent text step (16px icon with
  14–16px text; 20px with buttons).
- Keep icons monochrome; no multi-color/filled variants at launch.

## 4. Accessibility (TRD §18 / WCAG 2.2 AA)

- **Decorative** icons (next to a visible label): `aria-hidden="true"`, no label.
- **Meaningful** icons (icon-only control): provide an accessible name
  (`aria-label`) or visually-hidden text; the control, not the SVG, owns the name.
- **Touch target ≥ 44×44px** for icon-only buttons — pad per
  [04](./04-spacing-scale.md) §Touch targets even when the glyph is 20–24px.
- Never rely on an icon as the **only** indicator of state — pair with text/color.

## 5. Logos & illustrations

- Brand logos and bespoke illustrations are **SVG assets** (in `assets/` /
  `branding/`), not Lucide, and not served through `next/image` (raster pipeline).
  See [10](./10-image-strategy.md) §SVG.

## 6. Mirror

Icon size steps are mirrored in `frontend/config/theme.ts` (`iconSizes`) for TS
consumers that set sizes programmatically (see [01](./01-token-architecture.md) §5).
