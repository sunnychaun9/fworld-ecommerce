import type { Metadata } from 'next';
import * as React from 'react';

import { ReviewsView } from '@/components/account/reviews-view';
import { buildMetadata } from '@/config/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Your reviews',
  description: 'Reviews you have written.',
  path: '/account/reviews',
  noIndex: true,
});

export default function AccountReviewsPage(): React.ReactElement {
  return (
    <div>
      <h1 className="text-foreground text-xl font-medium tracking-tight">Reviews</h1>
      <p className="text-muted-foreground mt-1 text-sm">Reviews you have written.</p>
      <div className="mt-8">
        <ReviewsView />
      </div>
    </div>
  );
}
