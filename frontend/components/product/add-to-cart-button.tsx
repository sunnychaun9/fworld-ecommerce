'use client';

import { ShoppingBag } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { useIsAuthenticated } from '@/features/auth/use-auth';
import { useAddToCart } from '@/features/cart/use-cart';
import { ApiError } from '@/services/api';
import type { ProductVariant } from '@/types/catalog';

interface AddToCartButtonProps {
  productSlug: string;
  variant: ProductVariant | null;
  quantity: number;
  className?: string;
  size?: React.ComponentProps<typeof Button>['size'];
}

/**
 * Add-to-cart action. Requires authentication (redirects to sign-in with a
 * return path) and a selected, in-stock variant. Uses the optimistic cart
 * mutation and surfaces the backend's stock errors as toasts.
 */
function AddToCartButton({
  productSlug,
  variant,
  quantity,
  className,
  size = 'lg',
}: AddToCartButtonProps): React.ReactElement {
  const authenticated = useIsAuthenticated();
  const router = useRouter();
  const { mutate, isPending } = useAddToCart();

  const stock = variant?.inventory?.availableStock ?? 0;
  const outOfStock = variant !== null && stock <= 0;

  function onClick(): void {
    if (!authenticated) {
      router.push(`/login?redirect=${encodeURIComponent(`/product/${productSlug}`)}`);
      return;
    }
    if (!variant) {
      toast.error('Please select the available options first.');
      return;
    }
    if (stock <= 0) {
      toast.error('This option is out of stock.');
      return;
    }
    mutate(
      { variantId: variant.id, quantity },
      {
        onSuccess: () => toast.success('Added to cart'),
        onError: (error) =>
          toast.error(error instanceof ApiError ? error.message : 'Could not add to cart'),
      },
    );
  }

  return (
    <Button
      type="button"
      size={size}
      onClick={onClick}
      disabled={outOfStock || isPending}
      className={className}
    >
      <ShoppingBag className="size-4" />
      {outOfStock ? 'Out of stock' : 'Add to cart'}
    </Button>
  );
}

export { AddToCartButton };
