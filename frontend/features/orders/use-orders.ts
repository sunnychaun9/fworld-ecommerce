'use client';

import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/constants/query-keys';
import { useIsAuthenticated } from '@/features/auth/use-auth';
import { getOrder } from '@/services/orders';

/** A single order by id. Only fetched when authenticated and an id is provided. */
export function useOrder(id: string | undefined) {
  const authenticated = useIsAuthenticated();
  return useQuery({
    queryKey: queryKeys.order(id ?? 'none'),
    queryFn: () => getOrder(id as string),
    enabled: authenticated && Boolean(id),
    staleTime: 30_000,
    retry: false,
  });
}
