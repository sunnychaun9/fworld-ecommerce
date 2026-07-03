import { PackageSearch } from 'lucide-react';
import * as React from 'react';

import { EmptyState } from '@/components/common/empty-state';
import { ProductCard } from '@/components/home/product-card';
import { Skeleton } from '@/components/ui/skeleton';
import type { ProductCard as ProductCardType } from '@/types/catalog';

interface ProductGridProps {
  products?: ProductCardType[];
  loading?: boolean;
  skeletonCount?: number;
  emptyTitle?: string;
  emptyDescription?: string;
}

const GRID_CLASS = 'grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4';

/** Responsive product grid with loading skeletons and an empty state. Reuses the
 * shared ProductCard. */
function ProductGrid({
  products,
  loading = false,
  skeletonCount = 8,
  emptyTitle = 'No products found',
  emptyDescription = 'Try adjusting or clearing your filters.',
}: ProductGridProps): React.ReactElement {
  if (loading) {
    return (
      <div className={GRID_CLASS}>
        {Array.from({ length: skeletonCount }, (_, i) => (
          <div key={i}>
            <Skeleton className="aspect-[3/4] w-full rounded-md" />
            <Skeleton className="mt-3 h-3 w-16" />
            <Skeleton className="mt-2 h-4 w-3/4" />
            <Skeleton className="mt-2 h-4 w-20" />
          </div>
        ))}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <EmptyState icon={<PackageSearch />} title={emptyTitle} description={emptyDescription} />
    );
  }

  return (
    <div className={GRID_CLASS}>
      {products.map((product, index) => (
        <ProductCard key={product.id} product={product} priority={index < 4} />
      ))}
    </div>
  );
}

export { ProductGrid };
