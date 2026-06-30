# 06 · Elevation System

**Status:** Specification (no implementation).
**From** [`006_DESIGN_SYSTEM.md`](../006_DESIGN_SYSTEM.md) → Shadows: Small,
Medium, Large, Extra Large.

## 1. Principles

The aesthetic is **premium / minimal**, so elevation is **subtle**: soft, low-alpha
shadows and generous spacing do the work, not heavy drop shadows. Elevation
communicates layering (resting → raised → overlay), not decoration.

## 2. Shadow tokens

Low-alpha, multi-layer shadows (neutral black). Values are the starting
specification, to be tuned against comps.

| Token | 006 name | Value (spec) |
| --- | --- | --- |
| `--shadow-none` | — | `none` |
| `--shadow-sm` | Small | `0 1px 2px 0 rgb(0 0 0 / 0.05)` |
| `--shadow-md` | Medium | `0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.06)` |
| `--shadow-lg` | Large | `0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.06)` |
| `--shadow-xl` | Extra Large | `0 20px 25px -5px rgb(0 0 0 / 0.10), 0 8px 10px -6px rgb(0 0 0 / 0.06)` |

## 3. Elevation roles

| Level | Token | Applied to |
| --- | --- | --- |
| 0 — Flat | `--shadow-none` | Page background, inline content, flat cards (border only) |
| 1 — Raised | `--shadow-sm` | Resting product/category cards, inputs |
| 2 — Interactive | `--shadow-md` | Hover state of cards, dropdowns, hovered buttons |
| 3 — Overlay | `--shadow-lg` | Popovers, menus, toasts |
| 4 — Modal | `--shadow-xl` | Dialogs, drawers/sheets, command palette |

## 4. Rules

- Prefer a **1px border** (`--color-border`) for separation at rest; introduce
  shadow on **interaction** (hover/focus) or for **true overlays**.
- Raise by **one level** on hover (e.g. card `sm → md`) — never skip levels.
- Overlays (level 3–4) pair shadow with a scrim/backdrop for focus.
- **Dark mode (future):** drop shadows read poorly on dark surfaces — dark theme
  will convey elevation primarily via **lighter surface steps** (neutral ramp)
  and reduced/again-softer shadows. Reserved, not implemented.
- Respect `prefers-reduced-transparency`/contrast preferences where relevant.
