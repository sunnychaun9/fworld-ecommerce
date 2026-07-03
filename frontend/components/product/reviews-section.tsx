'use client';

import { Star } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

import { Rating } from '@/components/common/rating';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useIsAuthenticated } from '@/features/auth/use-auth';
import { useCreateReview, useProductReviews } from '@/features/reviews/use-reviews';
import { ApiError } from '@/services/api';
import { cn } from '@/lib/utils';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** Product reviews: aggregate, list, and an authenticated write form. */
function ReviewsSection({ productId }: { productId: string }): React.ReactElement {
  const { data, isPending } = useProductReviews(productId);
  const authenticated = useIsAuthenticated();

  return (
    <section aria-labelledby="reviews-heading" className="border-border border-t py-12 sm:py-16">
      <h2
        id="reviews-heading"
        className="font-display text-2xl font-medium tracking-tight sm:text-3xl"
      >
        Reviews
      </h2>

      {isPending ? (
        <div className="mt-6 space-y-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-16 w-full max-w-lg" />
        </div>
      ) : (
        <>
          <div className="mt-4 flex items-center gap-3">
            {data && data.totalReviews > 0 ? (
              <>
                <Rating value={data.averageRating} />
                <span className="text-muted-foreground text-sm">
                  {data.averageRating.toFixed(1)} · {data.totalReviews}{' '}
                  {data.totalReviews === 1 ? 'review' : 'reviews'}
                </span>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">No reviews yet.</p>
            )}
          </div>

          {authenticated ? <ReviewForm productId={productId} /> : null}

          <ul className="mt-10 space-y-8">
            {data?.reviews.map((review) => (
              <li key={review.id} className="border-border border-b pb-8 last:border-0">
                <div className="flex items-center justify-between gap-4">
                  <Rating value={review.rating} size={14} />
                  <span className="text-muted-foreground text-xs">
                    {formatDate(review.createdAt)}
                  </span>
                </div>
                {review.title ? (
                  <p className="text-foreground mt-3 text-sm font-medium">{review.title}</p>
                ) : null}
                {review.comment ? (
                  <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                    {review.comment}
                  </p>
                ) : null}
                <p className="text-muted-foreground mt-3 text-xs">
                  {review.user.name ?? 'Verified buyer'}
                </p>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function ReviewForm({ productId }: { productId: string }): React.ReactElement {
  const [rating, setRating] = React.useState(0);
  const [title, setTitle] = React.useState('');
  const [comment, setComment] = React.useState('');
  const { mutate, isPending } = useCreateReview(productId);

  function onSubmit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (rating < 1) {
      toast.error('Please select a rating.');
      return;
    }
    mutate(
      { rating, title: title.trim() || undefined, comment: comment.trim() || undefined },
      {
        onSuccess: () => {
          toast.success('Thanks for your review');
          setRating(0);
          setTitle('');
          setComment('');
        },
        onError: (error) => {
          const code = error instanceof ApiError ? error.code : '';
          if (code === 'PURCHASE_REQUIRED') {
            toast.error('You can only review products you have purchased.');
          } else if (code === 'ALREADY_REVIEWED') {
            toast.error('You have already reviewed this product.');
          } else {
            toast.error('Could not submit your review.');
          }
        },
      },
    );
  }

  return (
    <form onSubmit={onSubmit} className="border-border mt-8 max-w-lg rounded-lg border p-5">
      <p className="text-foreground text-sm font-medium">Write a review</p>
      <div className="mt-3 flex items-center gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={rating === value}
            aria-label={`${value} star${value === 1 ? '' : 's'}`}
            onClick={() => setRating(value)}
            className="focus-visible:ring-ring rounded-sm p-0.5 outline-none focus-visible:ring-2"
          >
            <Star
              className={cn(
                'size-6',
                value <= rating ? 'fill-brand text-brand' : 'text-muted-foreground/40',
              )}
            />
          </button>
        ))}
      </div>
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title (optional)"
        maxLength={160}
        className="mt-4"
      />
      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share your thoughts (optional)"
        maxLength={2000}
        className="mt-3"
      />
      <Button type="submit" className="mt-4" disabled={isPending}>
        Submit review
      </Button>
    </form>
  );
}

export { ReviewsSection };
