'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/constants/query-keys';
import { createShipment, updateShipment } from '@/services/admin';
import type { CreateShipmentInput, UpdateShipmentInput } from '@/types/admin';

export function useCreateShipment(orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateShipmentInput) => createShipment(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.admin.order(orderId) });
      void qc.invalidateQueries({ queryKey: ['admin', 'orders'] });
    },
  });
}

export function useUpdateShipment(orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateShipmentInput }) =>
      updateShipment(id, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.admin.order(orderId) });
      void qc.invalidateQueries({ queryKey: ['admin', 'orders'] });
    },
  });
}
