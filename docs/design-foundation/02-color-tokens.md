# 02 · Color Token Specification

**Status:** Specification (no implementation).
**Anchors from** [`006_DESIGN_SYSTEM.md`](../006_DESIGN_SYSTEM.md): Primary
`#111111`, Secondary `#FFFFFF`, Accent `#D4AF37`, Success `#22C55E`, Warning
`#F59E0B`, Danger `#EF4444`, Info `#3B82F6`, Background `#FAFAFA`, Border `#E5E7EB`.

## 1. Primitive — Neutral ramp

`006` gives only a few neutrals. A full premium neutral ramp (zinc-leaning) is
**derived here** to fill the gap; the anchor steps match `006` exactly.

| Token | Value | Anchor from 006 |
| --- | --- | --- |
| `--fw-neutral-0` | `#FFFFFF` | Secondary |
| `--fw-neutral-50` | `#FAFAFA` | Background |
| `--fw-neutral-100` | `#F5F5F5` | — |
| `--fw-neutral-200` | `#E5E7EB` | Border |
| `--fw-neutral-300` | `#D4D4D8` | — |
| `--fw-neutral-400` | `#A1A1AA` | — |
| `--fw-neutral-500` | `#71717A` | — |
| `--fw-neutral-600` | `#52525B` | — |
| `--fw-neutral-700` | `#3F3F46` | — |
| `--fw-neutral-800` | `#27272A` | — |
| `--fw-neutral-900` | `#18181B` | — |
| `--fw-neutral-950` | `#111111` | Primary |

## 2. Primitive — Brand & status

The premium identity is **near-black + gold accent on near-white**. Status hues
come straight from `006`. Light tints/strong steps are derived for backgrounds
and hover/active states.

| Token | Value | Role source |
| --- | --- | --- |
| `--fw-gold-500` | `#D4AF37` | Accent |
| `--fw-gold-600` | `#B8962E` | Accent (hover/active, derived) |
| `--fw-gold-100` | `#F7EFD3` | Accent tint / subtle bg (derived) |
| `--fw-green-500` | `#22C55E` | Success |
| `--fw-amber-500` | `#F59E0B` | Warning |
| `--fw-red-500` | `#EF4444` | Danger |
| `--fw-blue-500` | `#3B82F6` | Info |

> Each status hue will also get a `-50`/`-100` tint (subtle background) and a
> `-600`/`-700` strong step (text-on-tint, borders) during implementation, all
> verified for contrast.

## 3. Semantic tokens — Light theme (default)

Components consume **only** these. `*-foreground` is the accessible content
color to place on that surface.

| Semantic token | → Primitive | Usage |
| --- | --- | --- |
| `--color-background` | `neutral-50` | App background |
| `--color-foreground` | `neutral-950` | Default text/icon |
| `--color-card` | `neutral-0` | Card surface |
| `--color-card-foreground` | `neutral-950` | Text on card |
| `--color-popover` | `neutral-0` | Popover/menu surface |
| `--color-popover-foreground` | `neutral-950` | Text on popover |
| `--color-primary` | `neutral-950` | Primary actions, emphasis |
| `--color-primary-foreground` | `neutral-0` | Text/icon on primary |
| `--color-secondary` | `neutral-100` | Secondary surfaces/buttons |
| `--color-secondary-foreground` | `neutral-950` | Text on secondary |
| `--color-muted` | `neutral-100` | Muted surfaces |
| `--color-muted-foreground` | `neutral-500` | Secondary/help text |
| `--color-accent` | `gold-500` | Premium accent, highlights |
| `--color-accent-foreground` | `neutral-950` | Text/icon on accent |
| `--color-border` | `neutral-200` | Hairlines, dividers |
| `--color-input` | `neutral-200` | Input borders |
| `--color-ring` | `neutral-950` | Focus ring (with offset) |
| `--color-success` | `green-500` | Positive state |
| `--color-success-foreground` | `neutral-0` | Text on success |
| `--color-warning` | `amber-500` | Caution state |
| `--color-warning-foreground` | `neutral-950` | Text on warning |
| `--color-destructive` | `red-500` | Errors, destructive actions |
| `--color-destructive-foreground` | `neutral-0` | Text on destructive |
| `--color-info` | `blue-500` | Informational state |
| `--color-info-foreground` | `neutral-0` | Text on info |

> Naming note: `006` calls the error hue **Danger**; the semantic token is
> `--color-destructive` to match shadcn/ui. They refer to the same `#EF4444`.

## 4. Contrast (WCAG 2.2 AA — TRD §18)

Mandatory targets: **4.5:1** for normal text, **3:1** for large text (≥24px or
≥19px bold) and UI/graphical boundaries.

| Pairing | Expectation |
| --- | --- |
| `foreground` (#111) on `background` (#FAFAFA) | ✅ ~19:1 (passes AAA) |
| `primary-foreground` (#FFF) on `primary` (#111) | ✅ ~19:1 |
| `accent-foreground` (#111) on `accent` (#D4AF37) | ✅ ~ passes AA for normal text |
| `muted-foreground` (#71717A) on `background` | ✅ ~4.6:1 (verify, borderline) |
| White text on `success`/`warning`/`info` | ⚠️ **Verify per hue** — green/amber often fail white-text AA; prefer dark text on amber, and a darker green (`-600`) for text-on-fill |

Rule: **no semantic pairing ships without a recorded ratio.** Status fills used
behind text must use the tint (`-50/-100`) + strong text step rather than the
`-500` fill where the `-500` fails AA.

## 5. Dark theme (future)

Not implemented at launch (`006` → "Dark Mode (Future)"). When added, dark mode
**re-maps semantic tokens to different primitives** under a `.dark` /
`[data-theme="dark"]` scope (architecture doc §4) — e.g. `--color-background →
neutral-950`, `--color-foreground → neutral-50`, surfaces shift up the ramp,
borders soften, and shadows are reduced in favor of elevation-by-surface. Gold
accent is retained but may shift a step for contrast. Primitives and components
remain unchanged.
