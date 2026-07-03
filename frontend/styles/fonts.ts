import { Fraunces, Inter } from 'next/font/google';

/**
 * Self-hosted, optimised web fonts (next/font — zero layout shift, no external
 * requests at runtime). `Inter` drives the UI; `Fraunces` is reserved for large
 * editorial display headings. Both expose CSS variables consumed by the Tailwind
 * `--font-sans` / `--font-display` theme tokens in `app/globals.css`.
 */

export const fontSans = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const fontDisplay = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
  weight: ['400', '500', '600'],
  style: ['normal'],
});

/** Combined font CSS-variable classes for the root `<html>` element. */
export const fontVariables = `${fontSans.variable} ${fontDisplay.variable}`;
