'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/constants/query-keys';
import { useIsAuthenticated } from '@/features/auth/use-auth';
import { adjustInventory, fetchLowStock, listInventory } from '@/services/admin';
import type { AdjustInventoryInput } from '@/types/admin';

export function useInventory(params: { page: number; pageSize?: number }) {
  const authenticated = useIsAuthenticated();
  return useQuery({
    queryKey: queryKeys.admin.inventory(params),
    queryFn: () => listInventory(params),
    enabled: authenticated,
    placeholderData: keepPreviousData,
    staleTime: 20_000,
  });
}

export function useLowStock() {
  const authenticated = useIsAuthenticated();
  return useQuery({
    queryKey: queryKeys.admin.lowStock(),
    queryFn: fetchLowStock,
    enabled: authenticated,
    staleTime: 20_000,
  });
}

export function useAdjustInventory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AdjustInventoryInput) => adjustInventory(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'inventory'] });
    },
  });
}
