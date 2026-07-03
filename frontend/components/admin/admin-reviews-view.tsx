'use client';

import * as React from 'react';

import { Rating } from '@/components/common/rating';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAdminProducts } from '@/features/admin/use-admin-products';
import { useProductReviews } from '@/features/reviews/use-reviews';
import { formatDate } from '@/lib/format';

import { EntityToolbar } from './entity-toolbar';

/**
 * Review browser. The backend has no admin moderation route (reviews can only be
 * edited/deleted by their author, with no visibility flag), so this is a
 * read-only view of the reviews on a chosen product.
 */
function AdminReviewsView(): React.ReactElement {
  const products = useAdminProducts({ page: 1, limit: 100 });
  const [productId, setProductId] = React.useState('');
  const reviews = useProductReviews(productId);
  const items = products.data?.items ?? [];

  return (
    <div>
      <EntityToolbar
        title="Reviews"
        description="Browse product reviews. Moderation requires a backend endpoint that is not yet available."
      >
        <Select value={productId} onValueChange={setProductId}>
          <SelectTrigger className="w-72">
            <SelectValue placeholder="Choose a product" />
          </SelectTrigger>
          <SelectContent>
            {items.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </EntityToolbar>

      {!productId ? (
        <div className="border-border text-muted-foreground rounded-lg border border-dashed p-10 text-center text-sm">
          Select a product to view its reviews.
        </div>
      ) : reviews.isPending ? (
        <Skeleton className="h-64 w-full rounded-lg" />
      ) : reviews.isError || !reviews.data ? (
        <div className="border-border text-muted-foreground rounded-lg border border-dashed p-10 text-center text-sm">
          Could not load reviews.
        </div>
      ) : reviews.data.reviews.length === 0 ? (
        <div className="border-border text-muted-foreground rounded-lg border border-dashed p-10 text-center text-sm">
          No reviews for this product.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-muted-foreground flex items-center gap-3 text-sm">
            <Rating value={reviews.data.averageRating} />
            <span>
              {reviews.data.averageRating.toFixed(1)} · {reviews.data.totalReviews} reviews
            </span>
          </div>
          <ul className="space-y-3">
            {reviews.data.reviews.map((review) => (
              <li key={review.id} className="border-border rounded-lg border p-4">
                <div className="flex items-center justify-between gap-4">
                  <Rating value={review.rating} />
                  <span className="text-muted-foreground text-xs">
                    {review.user.name ?? 'Customer'} · {formatDate(review.createdAt)}
                  </span>
                </div>
                {review.title ? (
                  <p className="text-foreground mt-2 text-sm font-medium">{review.title}</p>
                ) : null}
                {review.comment ? (
                  <p className="text-muted-foreground mt-1 text-sm">{review.comment}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export { AdminReviewsView };
