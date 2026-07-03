'use client';

import { useEffect, useState } from 'react';

/**
 * Returns `true` after the component has mounted on the client. Used to guard
 * against hydration mismatches for values that differ between server and client
 * (e.g. the resolved theme).
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
