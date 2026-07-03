'use client';

import * as React from 'react';

import { ProductCarousel } from '@/components/home/product-carousel';
import { useProducts } from '@/features/catalog/use-catalog';

interface RelatedProductsProps {
  categoryId: string;
  excludeId: string;
}

/** Related products from the same category, reusing the shared ProductCarousel. */
function RelatedProducts({
  categoryId,
  excludeId,
}: RelatedProductsProps): React.ReactElement | null {
  const { data } = useProducts({ categoryId, limit: 12, sort: 'newest' });
  const products = (data?.items ?? []).filter((p) => p.id !== excludeId).slice(0, 10);

  if (products.length === 0) return null;

  return (
    <div className="border-border border-t">
      <ProductCarousel eyebrow="You may also like" title="Related products" products={products} />
    </div>
  );
}

export { RelatedProducts };
