'use client';

import * as React from 'react';

import { useProducts } from '@/features/catalog/use-catalog';

import { ClientProductListing } from './client-product-listing';

/**
 * Sale listing. The store API has no discount filter, so we fetch a page of
 * products and keep those with a discount, then filter/sort/paginate in-memory.
 */
function SaleListing(): React.ReactElement {
  const { data, isPending, isError, refetch } = useProducts({ limit: 100, sort: 'newest' });
  const products = React.useMemo(
    () => (data?.items ?? []).filter((p) => p.discountPercentage > 0),
    [data],
  );

  return (
    <ClientProductListing
      products={products}
      loading={isPending}
      isError={isError}
      onRetry={() => void refetch()}
    />
  );
}

export { SaleListing };
