'use client';

import { Heart, X } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';
import { toast } from 'sonner';

import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { MediaImage } from '@/components/common/media-image';
import { Price } from '@/components/common/price';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/routes';
import { useRemoveWishlist, useWishlist } from '@/features/wishlist/use-wishlist';
import { ApiError } from '@/services/api';
import type { WishlistEntry } from '@/types/wishlist';

function WishlistItem({ entry }: { entry: WishlistEntry }): React.ReactElement {
  const remove = useRemoveWishlist();
  const product = entry.product;
  const image = product.images[0];
  const href = `/product/${product.slug}`;

  function onRemove(): void {
    remove.mutate(product.id, {
      onError: (error) =>
        toast.error(error instanceof ApiError ? error.message : 'Could not remove the item.'),
    });
  }

  return (
    <div className="group relative">
      <Link
        href={href}
        className="bg-muted focus-visible:ring-ring relative block aspect-[3/4] overflow-hidden rounded-lg outline-none focus-visible:ring-2"
      >
        <MediaImage
          src={image?.url}
          alt={image?.altText ?? product.name}
          sizes="(min-width: 1024px) 25vw, 50vw"
        />
      </Link>
      <Button
        type="button"
        variant="secondary"
        size="icon"
        aria-label={`Remove ${product.name} from wishlist`}
        onClick={onRemove}
        disabled={remove.isPending}
        className="absolute right-2 top-2 size-8 rounded-full opacity-90"
      >
        <X className="size-4" />
      </Button>
      <div className="mt-3">
        <Link href={href} className="text-foreground text-sm font-medium hover:underline">
          {product.name}
        </Link>
        <Price amount={product.sellingPrice} compareAt={product.mrp} className="mt-1" />
        <Button asChild variant="outline" size="sm" className="mt-3 w-full">
          <Link href={href}>Move to bag</Link>
        </Button>
      </div>
    </div>
  );
}

/** Responsive wishlist grid with optimistic removal. */
function WishlistGrid(): React.ReactElement {
  const { data, isPending, isError, refetch } = useWishlist();

  if (isPending) {
    return (
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i}>
            <Skeleton className="aspect-[3/4] w-full rounded-lg" />
            <Skeleton className="mt-3 h-4 w-2/3" />
            <Skeleton className="mt-2 h-4 w-1/3" />
          </div>
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
        icon={<Heart />}
        title="Your wishlist is empty"
        description="Save the pieces you love to find them here later."
        action={
          <Button asChild>
            <Link href={ROUTES.men}>Explore products</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-3">
      {data.map((entry) => (
        <WishlistItem key={entry.id} entry={entry} />
      ))}
    </div>
  );
}

export { WishlistGrid };
