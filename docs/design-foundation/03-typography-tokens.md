# 03 · Typography Token Specification

**Status:** Specification (no implementation).
**From** [`006_DESIGN_SYSTEM.md`](../006_DESIGN_SYSTEM.md): Primary font **Inter**,
future **Manrope**, fallback **System Sans**. Sizes: 12, 14, 16, 18, 20, 24, 30,
36, 48, 60.

## 1. Font families

| Token | Value (stack) | Notes |
| --- | --- | --- |
| `--font-sans` | `Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif` | Primary UI/body |
| `--font-display` | *(= `--font-sans` at launch)* | Reserved for headings; may switch to **Manrope** later |
| `--font-mono` | `ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace` | Order IDs, codes, tabular data |

- Inter is loaded via `next/font` (self-hosted, no layout shift) during
  implementation; the placeholder `--font-sans` in `app/globals.css` already
  reserves the variable hook (`var(--font-sans), …`).
- **Manrope** is future (`006`): introduced by re-pointing `--font-display`
  only — no component changes.

## 2. Type scale

Base = 16px = `1rem`. Sizes map 1:1 to the `006` list. Defaults below are
starting points to be confirmed against the homepage/product comps in `007`.

| Token | px | rem | Default line-height | Default tracking | Default weight | Typical use |
| --- | --- | --- | --- | --- | --- | --- |
| `--text-xs` | 12 | 0.75 | 1.5 | `0.02em` | 400 | Captions, overline, legal |
| `--text-sm` | 14 | 0.875 | 1.5 | `0` | 400/500 | Body-small, labels, badges |
| `--text-base` | 16 | 1.0 | 1.5 | `0` | 400 | **Body default** |
| `--text-lg` | 18 | 1.125 | 1.5 | `0` | 400/500 | Lead paragraph |
| `--text-xl` | 20 | 1.25 | 1.4 | `-0.01em` | 500/600 | Subtitle, H6 |
| `--text-2xl` | 24 | 1.5 | 1.3 | `-0.01em` | 600 | H5 |
| `--text-3xl` | 30 | 1.875 | 1.25 | `-0.01em` | 600/700 | H4 |
| `--text-4xl` | 36 | 2.25 | 1.2 | `-0.02em` | 700 | H3 |
| `--text-5xl` | 48 | 3.0 | 1.1 | `-0.02em` | 700 | H2 / display-sm |
| `--text-6xl` | 60 | 3.75 | 1.05 | `-0.02em` | 700 | H1 / display |

## 3. Semantic roles

Role tokens compose size + weight + line-height + tracking so screens reference
intent, not raw steps.

| Role token | Composition | Use |
| --- | --- | --- |
| `--type-display` | `text-6xl` / 700 / tight | Hero headline |
| `--type-h1` | `text-5xl` / 700 / tight | Page title |
| `--type-h2` | `text-4xl` / 700 | Section title |
| `--type-h3` | `text-3xl` / 600 | Sub-section |
| `--type-h4` | `text-2xl` / 600 | Card/group title |
| `--type-h5` | `text-xl` / 600 | Minor heading |
| `--type-body` | `text-base` / 400 / 1.5 | Default copy |
| `--type-body-sm` | `text-sm` / 400 | Dense copy |
| `--type-label` | `text-sm` / 500 | Form labels, buttons |
| `--type-caption` | `text-xs` / 400 | Meta, helper text |
| `--type-overline` | `text-xs` / 600 / `0.08em` / uppercase | Eyebrow labels |
| `--type-price` | `text-xl`–`text-2xl` / 600 / tabular-nums | Product pricing |

## 4. Weights

| Token | Value |
| --- | --- |
| `--font-weight-regular` | 400 |
| `--font-weight-medium` | 500 |
| `--font-weight-semibold` | 600 |
| `--font-weight-bold` | 700 |

Inter variable font covers 400–700; only these four steps are exposed to keep the
type system tight and premium (no thin/black weights at launch).

## 5. Line-height & tracking scales

| Line-height token | Value | Tracking token | Value |
| --- | --- | --- | --- |
| `--leading-none` | 1 | `--tracking-tighter` | `-0.02em` |
| `--leading-tight` | 1.1 | `--tracking-tight` | `-0.01em` |
| `--leading-snug` | 1.25 | `--tracking-normal` | `0` |
| `--leading-normal` | 1.5 | `--tracking-wide` | `0.02em` |
| `--leading-relaxed` | 1.625 | `--tracking-wider` | `0.08em` |

## 6. Rules

- **Body default is 16px** (never below 14px for paragraph text) for readability
  (`007` → High Readability).
- Display/headings use tight leading + negative tracking for a refined,
  premium feel; body uses 1.5 leading.
- Pricing and any aligned numeric columns use **tabular figures**.
- Respect user font-size/zoom: sizes are in `rem`, never fixed `px` in components.
- Max line length for long-form copy ≈ 60–75ch.
