import type { Metadata } from 'next';
import * as React from 'react';

import { WishlistGrid } from '@/components/account/wishlist-grid';
import { buildMetadata } from '@/config/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Your wishlist',
  description: 'Products you have saved.',
  path: '/account/wishlist',
  noIndex: true,
});

export default function AccountWishlistPage(): React.ReactElement {
  return (
    <div>
      <h1 className="text-foreground text-xl font-medium tracking-tight">Wishlist</h1>
      <p className="text-muted-foreground mt-1 text-sm">Products you have saved for later.</p>
      <div className="mt-8">
        <WishlistGrid />
      </div>
    </div>
  );
}
