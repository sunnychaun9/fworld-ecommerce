# 10 · Image Strategy

**Status:** Specification (no implementation).
**From** [`003_TRD.md`](../003_TRD.md) §17 (Image Strategy) & §16 (SEO), §15
(Performance); [`007_UI_UX.md`](../007_UI_UX.md) (large product images, swipe
gallery, zoom).

Imagery is the primary visual focus of a premium fashion store, so the strategy
optimizes for **quality + speed + zero layout shift**.

## 1. Formats

| Token / setting | Value | Source |
| --- | --- | --- |
| Preferred formats | **AVIF**, then **WebP**, then original | TRD §17; already set in `next.config.mjs` `images.formats: ['image/avif','image/webp']` |
| Raster delivery | `next/image` (responsive `srcset`, format negotiation) | TRD §17 |
| Vector | **SVG** for logos/illustrations, served as assets (not via `next/image`) | §SVG below |

## 2. Responsive & performance

- **Responsive images**: every image declares a `sizes` strategy so the browser
  fetches the smallest sufficient candidate; `next/image` generates the `srcset`.
- **Blur placeholder**: `placeholder="blur"` with a tiny `blurDataURL` (LQIP) to
  avoid blank space and convey perceived speed (TRD §17).
- **Lazy loading** by default; **`priority`/eager** only for the LCP image
  (e.g. hero, first product image) to protect Largest Contentful Paint (TRD §15).
- **No layout shift**: always provide `width`/`height` or `fill` + an
  `aspect-ratio` from the ratio tokens (§4) — protects CLS (Core Web Vitals).
- **Quality**: default ~75–80; product detail/zoom may use a higher-quality
  source. DPR served up to 2×.

## 3. CDN & storage

- Origin: **Cloudflare R2** (S3-compatible); delivery via **Cloudflare CDN**
  (TRD §17, §21). Remote hosts are allow-listed in `next.config.mjs`
  `images.remotePatterns` (`**.r2.dev`, `**.cloudflarestorage.com`) — to be
  tightened to exact buckets before production.
- **Automatic compression** at upload plus responsive transforms on delivery.

## 4. Aspect-ratio tokens

Stable ratios per surface keep grids tidy and prevent CLS. Mirrored in
`frontend/config/theme.ts` (`aspectRatios`).

| Token | Ratio | Use |
| --- | --- | --- |
| `--aspect-product` | 3 / 4 | Product card & gallery (portrait apparel) |
| `--aspect-product-thumb` | 1 / 1 | Gallery thumbnails, mini-cart |
| `--aspect-category` | 4 / 5 | Category tiles |
| `--aspect-hero` | 16 / 9 | Hero/banner (desktop) |
| `--aspect-hero-wide` | 21 / 9 | Full-bleed ultra-wide hero |
| `--aspect-banner` | 3 / 1 | Promo strips |
| `--aspect-blog` | 16 / 9 | Blog/editorial cards |
| `--aspect-avatar` | 1 / 1 | Avatars, review authors |

## 5. SEO & accessibility (TRD §16, §18)

- **Alt text is mandatory** on every content image (descriptive for products;
  empty `alt=""` only for purely decorative images). Supports screen readers and
  image SEO.
- Image sitemap / structured data (`Product` images) per TRD §16 — produced by the
  SEO layer, consuming the same R2 URLs.
- Meaningful, SEO-friendly file names where authored.

## 6. SVG

- Logos and icons are vectors. `next/image` keeps `dangerouslyAllowSVG` **off**
  for remote/raster safety; SVGs are imported as local assets/components from
  `assets/` / `branding/`. (Icon system: [09](./09-icon-strategy.md).)

## 7. Out of scope here

Upload pipeline, transformation worker, and signed-URL handling are **integration
concerns** to be decided in a future ADR (see
`research/ARCHITECTURE_AUDIT_2026-06-29.md` §13 → "CDN & Media Processing"). This
document specifies only the **design/delivery foundation**.
