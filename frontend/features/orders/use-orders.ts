'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/constants/query-keys';
import { useIsAuthenticated } from '@/features/auth/use-auth';
import { getOrder, getOrderTracking, listOrders } from '@/services/orders';

/** A page of the current user's orders. Keeps the previous page while fetching. */
export function useOrders(page: number, limit = 10) {
  const authenticated = useIsAuthenticated();
  return useQuery({
    queryKey: queryKeys.orders({ page, limit }),
    queryFn: () => listOrders({ page, limit }),
    enabled: authenticated,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

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

/** Shipment tracking for an order. A 404 (unshipped) is surfaced as an error. */
export function useOrderTracking(id: string | undefined) {
  const authenticated = useIsAuthenticated();
  return useQuery({
    queryKey: queryKeys.orderTracking(id ?? 'none'),
    queryFn: () => getOrderTracking(id as string),
    enabled: authenticated && Boolean(id),
    staleTime: 60_000,
    retry: false,
  });
}
