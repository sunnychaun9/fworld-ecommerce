'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/constants/query-keys';
import { useIsAuthenticated } from '@/features/auth/use-auth';
import { getAdminOrder, listAdminOrders, updateOrderStatus } from '@/services/admin';
import type { UpdateOrderStatusInput } from '@/types/admin';

export function useAdminOrders(params: { page: number; pageSize?: number; status?: string }) {
  const authenticated = useIsAuthenticated();
  return useQuery({
    queryKey: queryKeys.admin.orders(params),
    queryFn: () => listAdminOrders(params),
    enabled: authenticated,
    placeholderData: keepPreviousData,
    staleTime: 20_000,
  });
}

export function useAdminOrder(id: string | undefined) {
  const authenticated = useIsAuthenticated();
  return useQuery({
    queryKey: queryKeys.admin.order(id ?? 'none'),
    queryFn: () => getAdminOrder(id as string),
    enabled: authenticated && Boolean(id),
    retry: false,
  });
}

export function useUpdateOrderStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateOrderStatusInput) => updateOrderStatus(id, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.admin.order(id) });
      void qc.invalidateQueries({ queryKey: ['admin', 'orders'] });
    },
  });
}
