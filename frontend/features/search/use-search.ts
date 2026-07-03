'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/constants/query-keys';
import { searchProducts, type SearchParams } from '@/services/search';

/** Product search with facets. Disabled until there is at least one filter/query. */
export function useSearch(params: SearchParams, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.search(params as Record<string, unknown>),
    queryFn: () => searchProducts(params),
    placeholderData: keepPreviousData,
    enabled,
    staleTime: 60_000,
  });
}
