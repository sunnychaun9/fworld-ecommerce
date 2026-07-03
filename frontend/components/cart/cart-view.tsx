'use client';

import { LogIn, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';

import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/routes';
import { useIsAuthenticated } from '@/features/auth/use-auth';
import { useCart, useClearCart } from '@/features/cart/use-cart';
import { formatCurrency } from '@/lib/format';

import { CartItemRow } from './cart-item-row';

/** Cart page body. Authenticated-only; renders loading/error/empty states and the
 * item list with an order summary. */
function CartView(): React.ReactElement {
  const authenticated = useIsAuthenticated();
  const { data, isPending, isError, refetch } = useCart();
  const clear = useClearCart();

  if (!authenticated) {
    return (
      <EmptyState
        icon={<LogIn />}
        title="Sign in to view your cart"
        description="Your bag is saved to your account."
        action={
          <Button asChild>
            <Link href="/login?redirect=/cart">Sign in</Link>
          </Button>
        }
      />
    );
  }

  if (isPending) {
    return (
      <div className="grid gap-10 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="aspect-[3/4] w-20 rounded-md sm:w-24" />
              <div className="flex-1 space-y-3 py-1">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-9 w-28" />
              </div>
            </div>
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (isError || !data) {
    return <ErrorState onRetry={() => void refetch()} />;
  }

  if (data.items.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingBag />}
        title="Your bag is empty"
        description="Explore the latest arrivals and find something you love."
        action={
          <Button asChild>
            <Link href={ROUTES.men}>Start shopping</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_20rem]">
      <div>
        <ul className="divide-border border-border divide-y border-y">
          {data.items.map((item) => (
            <CartItemRow key={item.id} item={item} />
          ))}
        </ul>
        <div className="mt-4">
          <Button
            variant="link"
            className="text-muted-foreground h-auto px-0"
            onClick={() => clear.mutate()}
            disabled={clear.isPending}
          >
            Clear bag
          </Button>
        </div>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="border-border rounded-lg border p-6">
          <h2 className="text-foreground text-sm font-medium">Order summary</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">
                Subtotal ({data.totalItems} {data.totalItems === 1 ? 'item' : 'items'})
              </dt>
              <dd className="font-medium tabular-nums">{formatCurrency(data.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Shipping</dt>
              <dd className="text-muted-foreground">Calculated at checkout</dd>
            </div>
          </dl>
          <div className="border-border mt-4 flex justify-between border-t pt-4 text-sm font-medium">
            <span>Total</span>
            <span className="tabular-nums">{formatCurrency(data.subtotal)}</span>
          </div>
          <Button asChild className="mt-6 w-full" size="lg">
            <Link href={ROUTES.checkout}>Checkout</Link>
          </Button>
          <Button asChild variant="ghost" className="mt-2 w-full">
            <Link href={ROUTES.men}>Continue shopping</Link>
          </Button>
        </div>
      </aside>
    </div>
  );
}

export { CartView };
