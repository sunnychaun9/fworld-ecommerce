import { api } from '@/services/api';
import type { ProductReviews, Review } from '@/types/review';

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
