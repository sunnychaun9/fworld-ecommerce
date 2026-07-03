'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/constants/query-keys';
import { useIsAuthenticated } from '@/features/auth/use-auth';
import {
  createCoupon,
  createNotification,
  deleteCoupon,
  getReturn,
  importProducts,
  listCoupons,
  updateCoupon,
  updateReturn,
  type CreateNotificationInput,
  type UpdateReturnInput,
} from '@/services/admin';
import type { CouponInput, ImportProduct } from '@/types/admin';

// --- Coupons ---
export function useAdminCoupons() {
  const authenticated = useIsAuthenticated();
  return useQuery({
    queryKey: queryKeys.admin.coupons(),
    queryFn: listCoupons,
    enabled: authenticated,
    staleTime: 30_000,
  });
}

export function useCouponMutations() {
  const qc = useQueryClient();
  const invalidate = (): void => void qc.invalidateQueries({ queryKey: queryKeys.admin.coupons() });
  return {
    create: useMutation({ mutationFn: (i: CouponInput) => createCoupon(i), onSuccess: invalidate }),
    update: useMutation({
      mutationFn: ({ id, input }: { id: string; input: Partial<CouponInput> }) =>
        updateCoupon(id, input),
      onSuccess: invalidate,
    }),
    remove: useMutation({ mutationFn: (id: string) => deleteCoupon(id), onSuccess: invalidate }),
  };
}

// --- Returns (admin acts by known id) ---
export function useAdminReturn(id: string | undefined) {
  const authenticated = useIsAuthenticated();
  return useQuery({
    queryKey: queryKeys.returnDetail(id ?? 'none'),
    queryFn: () => getReturn(id as string),
    enabled: authenticated && Boolean(id),
    retry: false,
  });
}

export function useUpdateReturn(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateReturnInput) => updateReturn(id, input),
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.returnDetail(id) }),
  });
}

// --- Notifications (admin create) ---
export function useCreateNotification() {
  return useMutation({
    mutationFn: (input: CreateNotificationInput) => createNotification(input),
  });
}

// --- Import ---
export function useImportProducts() {
  return useMutation({
    mutationFn: (products: ImportProduct[]) => importProducts(products),
  });
}
