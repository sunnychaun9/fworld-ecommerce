'use client';

import * as React from 'react';

import { CartButton } from '@/components/layout/cart-button';
import { useCart } from '@/features/cart/use-cart';

/** Header cart trigger with a live item count (only fetched when signed in). */
function HeaderCart(): React.ReactElement {
  const { data } = useCart();
  return <CartButton href="/cart" count={data?.totalItems ?? 0} />;
}

export { HeaderCart };
