'use client';

import { Star } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';

import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/routes';
import { useMyReviews } from '@/features/reviews/use-reviews';

import { ReviewCard } from './review-card';

/** List of the current user's reviews, each editable and deletable. */
function ReviewsView(): React.ReactElement {
  const { data, isPending, isError, refetch } = useMyReviews();

  if (isPending) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (isError) {
    return <ErrorState onRetry={() => void refetch()} />;
  }

  if (data.length === 0) {
    return (
      <EmptyState
        icon={<Star />}
        title="No reviews yet"
        description="Reviews you write on products you've purchased will appear here."
        action={
          <Button asChild>
            <Link href={ROUTES.men}>Browse products</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      {data.map((review) => (
        <ReviewCard key={review.id} review={review} />
      ))}
    </div>
  );
}

export { ReviewsView };
