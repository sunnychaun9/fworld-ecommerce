# FWorld Design Foundation

**Status:** Specification (documentation only — no implementation)
**Date:** 2026-06-29
**Owner:** Design System / Frontend

This directory operationalizes the design intent in
[`docs/006_DESIGN_SYSTEM.md`](../006_DESIGN_SYSTEM.md) and
[`docs/007_UI_UX.md`](../007_UI_UX.md) into a concrete **design-token foundation**:
the architecture, naming, scales, and values that the UI will eventually consume.

> This is the **engineering specification** for the token layer. It does **not**
> implement UI, CSS, Tailwind, or React. Where placeholder config files already
> exist (`frontend/config/theme.ts`, `frontend/app/globals.css`), this set
> documents exactly what they will eventually contain — see
> [`01-token-architecture.md`](./01-token-architecture.md) §"Where tokens live".

## Source of truth

Per the Engineering Handbook ("one source of truth"), responsibilities are:

| Concern | Source of truth |
| --- | --- |
| Design intent, palette values, component inventory | [`006_DESIGN_SYSTEM.md`](../006_DESIGN_SYSTEM.md) |
| Page/UX flows and screen inventory | [`007_UI_UX.md`](../007_UI_UX.md) |
| **Token architecture, naming, scales, values** | **this directory** |
| Runtime token values (once implemented) | `frontend/app/globals.css` (`@theme`) + `frontend/config/theme.ts` |

If a value here disagrees with `006`, `006` wins for **palette/typeface choices**;
this set wins for **token structure, naming, and derived scales** (e.g. the
neutral ramp, which `006` does not enumerate).

## Contents

| #  | Document | Covers |
| -- | -------- | ------ |
| 01 | [Token Architecture](./01-token-architecture.md) | Tiered model, naming, theming, where tokens live |
| 02 | [Color Tokens](./02-color-tokens.md) | Primitive ramps → semantic roles, contrast, dark-mode plan |
| 03 | [Typography Tokens](./03-typography-tokens.md) | Families, type scale, weights, line-height, tracking |
| 04 | [Spacing Scale](./04-spacing-scale.md) | 4px base unit, scale, usage rules |
| 05 | [Border Radius Scale](./05-radius-scale.md) | Radius steps and role mapping |
| 06 | [Elevation System](./06-elevation-system.md) | Shadow tiers and elevation roles |
| 07 | [Motion System](./07-motion-system.md) | Durations, easings, patterns, reduced motion |
| 08 | [Responsive Breakpoint Strategy](./08-breakpoint-strategy.md) | Mobile-first tiers, containers |
| 09 | [Icon Strategy](./09-icon-strategy.md) | Lucide usage, sizing, accessibility |
| 10 | [Image Strategy](./10-image-strategy.md) | Formats, responsive, CDN, aspect ratios |

## Non-goals (explicitly out of scope here)

- No React components, providers, or hooks.
- No CSS or Tailwind implementation (no functional `globals.css` / theme config).
- No business or UI features.

These are produced in the later design-system implementation phase, governed by
this specification.
