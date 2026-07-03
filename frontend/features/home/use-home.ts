'use client';

import { useQuery } from '@tanstack/react-query';

import { fetchHome } from '@/services/catalog';
import { queryKeys } from '@/constants/query-keys';

/**
 * Loads the storefront home payload via TanStack Query. The backend caches this
 * response (short TTL), so a matching client staleTime avoids redundant refetches.
 */
export function useHome() {
  return useQuery({
    queryKey: queryKeys.store.home(),
    queryFn: fetchHome,
    staleTime: 5 * 60_000,
  });
}
