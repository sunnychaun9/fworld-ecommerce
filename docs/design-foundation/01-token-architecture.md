# 01 · Design Token Architecture

**Status:** Specification (no implementation).

## 1. Goals

- A **single source of truth** for theming (Handbook: "Design Tokens", "no inline CSS").
- **Tiered** tokens so visual decisions change in one place and cascade.
- **Themeable** (light now, dark in the future per `006_DESIGN_SYSTEM.md`) without
  touching components.
- **Framework-aligned**: tokens map cleanly to Tailwind CSS v4's `@theme` and to
  shadcn/ui's CSS-variable convention.
- **Accessible**: every semantic pairing must meet WCAG 2.2 AA (TRD §18).

## 2. Three-tier model

```text
Tier 1 — Primitive (raw)        Tier 2 — Semantic (role)        Tier 3 — Component (optional)
--------------------------      --------------------------      ----------------------------
--fw-neutral-950: #111111   →   --color-foreground          →   --button-primary-bg
--fw-gold-500:    #D4AF37   →   --color-accent              →   --card-bg
--fw-green-500:   #22C55E   →   --color-success             →   --input-border
```

1. **Primitive tokens** — the raw palette and scale values (the neutral ramp,
   brand gold, status hues, the numeric spacing/radius steps). No meaning, just
   values. Never referenced directly by components.
2. **Semantic tokens** — role-based aliases that map a primitive to a purpose
   (`background`, `foreground`, `primary`, `accent`, `muted`, `border`, `ring`,
   `destructive`, …). **Components consume only these.**
3. **Component tokens** *(optional, added only when a component needs local
   overrides)* — e.g. `--button-primary-bg`. Default to semantic tokens; promote
   to a component token only when justified.

> Rule: components reference **semantic** tokens; semantic tokens reference
> **primitives**; primitives reference nothing. Theming swaps the
> primitive→semantic mapping, never the components.

## 3. Naming convention

| Tier | Pattern | Example |
| --- | --- | --- |
| Primitive | `--fw-{family}-{step}` | `--fw-neutral-200`, `--fw-gold-500` |
| Semantic (color) | `--color-{role}[-{on}]` | `--color-primary`, `--color-primary-foreground` |
| Semantic (scale) | `--{scale}-{step}` | `--spacing-4`, `--radius-lg`, `--shadow-md` |
| Semantic (type) | `--font-{role}`, `--text-{step}` | `--font-sans`, `--text-h1` |
| Component | `--{component}-{part}-{role}` | `--card-border`, `--button-ghost-fg` |

- Prefix primitives with `--fw-` to avoid collisions; semantic color tokens use
  the `--color-*` namespace so they bind directly to Tailwind v4 `@theme`.
- `-foreground` denotes the accessible text/icon color to use **on** a given
  surface (shadcn convention), e.g. `--color-primary` + `--color-primary-foreground`.
- Names are **kebab-case** (Handbook Part 2 naming conventions).

## 4. Theming model

- **Light** is the default and the only theme implemented at launch.
- **Dark mode is future** (`006_DESIGN_SYSTEM.md` → Theme). The architecture
  reserves for it now: dark theming will **re-map semantic tokens to different
  primitives** under a scope (e.g. `.dark` / `[data-theme="dark"]`), leaving
  primitives and components untouched.
- `color-scheme` is declared so native UI (form controls, scrollbars) matches.

## 5. Where tokens live (eventual contents of existing placeholders)

These files already exist as **documented stubs**. This section specifies what
they will hold once implemented — **no implementation is added here.**

### `frontend/app/globals.css` (runtime source of truth)

Will define the **primitive** and **semantic** CSS custom properties and expose
the semantic ones to Tailwind v4 via `@theme`. The current placeholder declares
only `--font-sans`, `--color-background`, `--color-foreground`, `--color-brand`,
and `--radius: 0.625rem`. It will eventually contain:

- the full primitive palette (neutral ramp, gold, status hues) — see [02](./02-color-tokens.md)
- semantic color tokens (`--color-background/foreground/primary/accent/...`)
- the type, spacing, radius, shadow, and motion scales (docs 03–07)
- a future dark-theme override scope (re-mapping semantic tokens only)

> Reconciliation note: the placeholder `--radius: 0.625rem` (10px) does **not**
> match the `006` radius steps. See [05](./05-radius-scale.md) for the
> recommended default (`--radius-lg`, 12px).

### `frontend/config/theme.ts` (typed mirror for non-CSS consumers)

Will export a **typed, read-only** representation of the same semantic tokens for
TypeScript consumers that cannot read CSS variables (e.g. Framer Motion variants,
canvas/chart libraries, structured-data builders). It is a **mirror**, not a
second source of truth — values are authored in CSS and reflected here. Planned
shape (descriptive, not code):

- `breakpoints` — named min-widths (doc 08)
- `durations` / `easings` — motion tokens (doc 07)
- `radii`, `spacing`, `fontSizes`, `fontWeights`, `lineHeights` — scale maps
- `aspectRatios` — image ratios (doc 10)
- `iconSizes` — icon sizing steps (doc 09)

Colors are intentionally **not** duplicated as hard-coded hex in `theme.ts`;
runtime color comes from CSS variables so theming works. `theme.ts` may expose
the **variable names** (e.g. `'var(--color-primary)'`) where a TS consumer needs
to reference a themed color.

## 6. Governance

- Adding or changing a **primitive** or **semantic** token is a design-system
  change: document it here first, then implement.
- Component tokens are introduced sparingly and must reference semantic tokens.
- Every new semantic surface/foreground pair must ship with a recorded **contrast
  check** (see [02](./02-color-tokens.md) §Contrast).
