export interface Review {
  id: string;
  userId: string;
  productId: string;
  rating: number;
  title: string | null;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
  user: { id: string; name: string | null };
}

/** `GET /reviews/product/:productId` response (aggregate + list). */
export interface ProductReviews {
  averageRating: number;
  totalReviews: number;
  reviews: Review[];
}
