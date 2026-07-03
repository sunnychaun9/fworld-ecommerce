'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/constants/query-keys';
import { createReview, fetchProductReviews, type CreateReviewInput } from '@/services/reviews';

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
