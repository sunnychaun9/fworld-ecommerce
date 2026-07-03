'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/constants/query-keys';
import { useIsAuthenticated } from '@/features/auth/use-auth';
import { addWishlist, getWishlist, removeWishlist } from '@/services/wishlist';

/** The current user's wishlist. Only fetched when authenticated. */
export function useWishlist() {
  const authenticated = useIsAuthenticated();
  return useQuery({
    queryKey: queryKeys.wishlist(),
    queryFn: getWishlist,
    enabled: authenticated,
    staleTime: 60_000,
  });
}

export function useAddWishlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) => addWishlist(productId),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.wishlist() }),
  });
}

export function useRemoveWishlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) => removeWishlist(productId),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.wishlist() }),
  });
}
