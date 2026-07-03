'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/constants/query-keys';
import { useIsAuthenticated } from '@/features/auth/use-auth';
import { addCartItem, clearCart, getCart, removeCartItem, updateCartItem } from '@/services/cart';
import type { Cart } from '@/types/cart';

/** Recompute subtotal/totalItems after an optimistic mutation. */
function recompute(cart: Cart): Cart {
  return {
    ...cart,
    subtotal: cart.items.reduce((total, item) => total + item.unitPrice * item.quantity, 0),
    totalItems: cart.items.reduce((total, item) => total + item.quantity, 0),
  };
}

/** The current user's cart. Only fetched when authenticated. */
export function useCart() {
  const authenticated = useIsAuthenticated();
  return useQuery({
    queryKey: queryKeys.cart(),
    queryFn: getCart,
    enabled: authenticated,
    staleTime: 30_000,
  });
}

export function useAddToCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { variantId: string; quantity: number }) => addCartItem(input),
    onSuccess: (cart) => qc.setQueryData(queryKeys.cart(), cart),
  });
}

export function useUpdateCartItem() {
  const qc = useQueryClient();
  const key = queryKeys.cart();
  return useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      updateCartItem(itemId, quantity),
    onMutate: async ({ itemId, quantity }) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<Cart>(key);
      if (prev) {
        const items =
          quantity === 0
            ? prev.items.filter((item) => item.id !== itemId)
            : prev.items.map((item) =>
                item.id === itemId
                  ? { ...item, quantity, lineTotal: item.unitPrice * quantity }
                  : item,
              );
        qc.setQueryData<Cart>(key, recompute({ ...prev, items }));
      }
      return { prev };
    },
    onError: (_error, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
    },
    onSuccess: (cart) => qc.setQueryData(key, cart),
  });
}

export function useRemoveCartItem() {
  const qc = useQueryClient();
  const key = queryKeys.cart();
  return useMutation({
    mutationFn: (itemId: string) => removeCartItem(itemId),
    onMutate: async (itemId) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<Cart>(key);
      if (prev) {
        qc.setQueryData<Cart>(
          key,
          recompute({ ...prev, items: prev.items.filter((item) => item.id !== itemId) }),
        );
      }
      return { prev };
    },
    onError: (_error, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
    },
    onSuccess: (cart) => qc.setQueryData(key, cart),
  });
}

export function useClearCart() {
  const qc = useQueryClient();
  const key = queryKeys.cart();
  return useMutation({
    mutationFn: () => clearCart(),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<Cart>(key);
      if (prev) {
        qc.setQueryData<Cart>(key, { ...prev, items: [], subtotal: 0, totalItems: 0 });
      }
      return { prev };
    },
    onError: (_error, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
    },
    onSuccess: (cart) => qc.setQueryData(key, cart),
  });
}
