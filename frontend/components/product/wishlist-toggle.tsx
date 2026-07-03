'use client';

import { Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { useIsAuthenticated } from '@/features/auth/use-auth';
import { useAddWishlist, useRemoveWishlist, useWishlist } from '@/features/wishlist/use-wishlist';
import { cn } from '@/lib/utils';

interface WishlistToggleProps {
  productId: string;
  productSlug: string;
  className?: string;
}

/** Wishlist toggle. Requires authentication; reflects the saved state from the
 * wishlist query. */
function WishlistToggle({
  productId,
  productSlug,
  className,
}: WishlistToggleProps): React.ReactElement {
  const authenticated = useIsAuthenticated();
  const router = useRouter();
  const { data } = useWishlist();
  const add = useAddWishlist();
  const remove = useRemoveWishlist();

  const wished = Boolean(data?.some((entry) => entry.productId === productId));
  const pending = add.isPending || remove.isPending;

  function onClick(): void {
    if (!authenticated) {
      router.push(`/login?redirect=${encodeURIComponent(`/product/${productSlug}`)}`);
      return;
    }
    const options = {
      onError: () => toast.error('Something went wrong. Please try again.'),
    };
    if (wished) {
      remove.mutate(productId, {
        ...options,
        onSuccess: () => toast.success('Removed from wishlist'),
      });
    } else {
      add.mutate(productId, { ...options, onSuccess: () => toast.success('Saved to wishlist') });
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      onClick={onClick}
      disabled={pending}
      aria-pressed={wished}
      className={className}
    >
      <Heart className={cn('size-4', wished && 'fill-brand text-brand')} />
      {wished ? 'Saved' : 'Wishlist'}
    </Button>
  );
}

export { WishlistToggle };
