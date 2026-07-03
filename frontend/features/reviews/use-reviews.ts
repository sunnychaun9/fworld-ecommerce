'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/constants/query-keys';
import { useIsAuthenticated } from '@/features/auth/use-auth';
import {
  createReview,
  deleteReview,
  fetchMyReviews,
  fetchProductReviews,
  updateReview,
  type CreateReviewInput,
} from '@/services/reviews';
import type { MyReview, UpdateReviewInput } from '@/types/review';

export function useProductReviews(productId: string) {
  return useQuery({
    queryKey: queryKeys.reviews(productId),
    queryFn: () => fetchProductReviews(productId),
    staleTime: 5 * 60_000,
  });
}

export function useCreateReview(productId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<CreateReviewInput, 'productId'>) =>
      createReview({ ...input, productId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.reviews(productId) }),
  });
}

/** The current user's own reviews. */
export function useMyReviews() {
  const authenticated = useIsAuthenticated();
  return useQuery({
    queryKey: queryKeys.myReviews(),
    queryFn: fetchMyReviews,
    enabled: authenticated,
    staleTime: 60_000,
  });
}

export function useUpdateReview() {
  const qc = useQueryClient();
  const key = queryKeys.myReviews();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateReviewInput }) =>
      updateReview(id, input),
    onMutate: async ({ id, input }) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<MyReview[]>(key);
      if (prev) {
        qc.setQueryData<MyReview[]>(
          key,
          prev.map((r) => (r.id === id ? { ...r, ...input } : r)),
        );
      }
      return { prev };
    },
    onError: (_error, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: key }),
  });
}

export function useDeleteReview() {
  const qc = useQueryClient();
  const key = queryKeys.myReviews();
  return useMutation({
    mutationFn: (id: string) => deleteReview(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<MyReview[]>(key);
      if (prev) {
        qc.setQueryData<MyReview[]>(
          key,
          prev.filter((r) => r.id !== id),
        );
      }
      return { prev };
    },
    onError: (_error, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: key }),
  });
}
