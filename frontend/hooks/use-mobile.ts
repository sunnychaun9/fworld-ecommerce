'use client';

import { BREAKPOINTS } from '@/config/theme';

import { useMediaQuery } from './use-media-query';

/** `true` on viewports narrower than the `md` breakpoint (tablet/phone). */
export function useIsMobile(): boolean {
  return useMediaQuery(`(max-width: ${BREAKPOINTS.md - 1}px)`);
}
