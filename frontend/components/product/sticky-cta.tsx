'use client';

import * as React from 'react';

import { Price } from '@/components/common/price';
import type { ProductVariant } from '@/types/catalog';

import { AddToCartButton } from './add-to-cart-button';

interface StickyCtaProps {
  name: string;
  sellingPrice: string;
  mrp: string;
  productSlug: string;
  variant: ProductVariant | null;
}

/** Mobile-only sticky purchase bar. */
function StickyCta({
  name,
  sellingPrice,
  mrp,
  productSlug,
  variant,
}: StickyCtaProps): React.ReactElement {
  return (
    <div className="border-border bg-background/95 fixed inset-x-0 bottom-0 z-40 border-t px-4 py-3 backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-[96rem] items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-foreground truncate text-sm font-medium">{name}</p>
          <Price amount={sellingPrice} compareAt={mrp} className="text-sm" />
        </div>
        <AddToCartButton
          productSlug={productSlug}
          variant={variant}
          quantity={1}
          size="default"
          className="shrink-0"
        />
      </div>
    </div>
  );
}

export { StickyCta };
