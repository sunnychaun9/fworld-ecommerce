'use client';

import { useMutation, useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/constants/query-keys';
import { useIsAuthenticated } from '@/features/auth/use-auth';
import { prepareCheckout } from '@/services/checkout';
import { validateCoupon } from '@/services/coupons';
import type { ValidateCouponInput } from '@/types/coupon';

/**
 * The computed checkout summary for the current cart. Only fetched when
 * authenticated; kept fresh (short stale time) so stock/price changes surface
 * before the order is placed.
 */
export function useCheckout() {
  const authenticated = useIsAuthenticated();
  return useQuery({
    queryKey: queryKeys.checkout(),
    queryFn: () => prepareCheckout(),
    enabled: authenticated,
    staleTime: 15_000,
    retry: false,
  });
}

/** Validate a coupon code against an order amount. */
export function useValidateCoupon() {
  return useMutation({
    mutationFn: (input: ValidateCouponInput) => validateCoupon(input),
  });
}
