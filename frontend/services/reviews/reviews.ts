import { api } from '@/services/api';
import type { MyReview, ProductReviews, Review, UpdateReviewInput } from '@/types/review';

export function fetchProductReviews(productId: string): Promise<ProductReviews> {
  return api.get<ProductReviews>(`/reviews/product/${productId}`);
}

export interface CreateReviewInput {
  productId: string;
  rating: number;
  title?: string;
  comment?: string;
}

export function createReview(input: CreateReviewInput): Promise<Review> {
  return api.post<Review>('/reviews', input);
}

/** The current user's own reviews (no embedded product). */
export function fetchMyReviews(): Promise<MyReview[]> {
  return api.get<MyReview[]>('/reviews/my');
}

export function updateReview(id: string, input: UpdateReviewInput): Promise<MyReview> {
  return api.patch<MyReview>(`/reviews/${id}`, input);
}

export function deleteReview(id: string): Promise<{ id: string }> {
  return api.delete<{ id: string }>(`/reviews/${id}`);
}
