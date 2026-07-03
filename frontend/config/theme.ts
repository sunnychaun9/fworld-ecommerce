/**
 * Typed theme constants that mirror the CSS design tokens in `app/globals.css`.
 * These are for TypeScript-land consumption (JS animations, canvas, tests); the
 * CSS variables remain the runtime source of truth.
 */

/** Responsive breakpoints (px). Mobile-first; matches Tailwind's defaults + 3xl. */
export const BREAKPOINTS = {
  xs: 320,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
  '3xl': 1920,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

/** Base spacing unit (px). The scale is built in multiples of 8. */
export const SPACING_BASE = 8;

/** Colour scheme values understood by next-themes. */
export const THEMES = ['light', 'dark', 'system'] as const;
export type Theme = (typeof THEMES)[number];

/** Shared motion timings (ms) for subtle, consistent transitions. */
export const MOTION = {
  fast: 150,
  base: 200,
  slow: 320,
} as const;
