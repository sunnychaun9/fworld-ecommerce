'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import * as React from 'react';

import { ErrorState } from '@/components/common/error-state';
import {
  COLOR_OPTIONS,
  FABRIC_OPTIONS,
  FIT_OPTIONS,
  PAGE_SIZE,
  SIZE_OPTIONS,
  STORE_SORT_OPTIONS,
} from '@/config/filters';
import { useBrands, useCategories, useProducts } from '@/features/catalog/use-catalog';
import type { ProductListParams, StoreSort } from '@/services/catalog';

import { FilterSidebar } from './filter-sidebar';
import { ListingToolbar } from './listing-toolbar';
import { PaginationBar } from './pagination-bar';
import { ProductGrid } from './product-grid';
import { SortSelect } from './sort-select';
import type { FilterKey, FilterOptions, ListingFilters } from './types';

const ALL_FILTERS: FilterKey[] = ['category', 'brand', 'size', 'color', 'fit', 'fabric', 'price'];

function num(value: string | null): number | undefined {
  if (value === null || value.trim() === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

interface ServerProductListingProps {
  /** Fixes the listing to a category (its filter is hidden). */
  categorySlug?: string;
  /** Fixes the listing to a brand (its filter is hidden). */
  brandSlug?: string;
}

/**
 * URL-synced product listing backed by `GET /store/products`: server-side
 * filtering, sorting and pagination with a responsive filter sidebar/drawer.
 */
function ServerProductListing({
  categorySlug,
  brandSlug,
}: ServerProductListingProps): React.ReactElement {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const categoriesQuery = useCategories();
  const brandsQuery = useBrands();
  const categories = React.useMemo(() => categoriesQuery.data?.items ?? [], [categoriesQuery.data]);
  const brands = React.useMemo(() => brandsQuery.data?.items ?? [], [brandsQuery.data]);

  const fixedCategoryId = categorySlug
    ? categories.find((c) => c.slug === categorySlug)?.id
    : undefined;
  const fixedBrandId = brandSlug ? brands.find((b) => b.slug === brandSlug)?.id : undefined;

  const urlFilters: ListingFilters = {
    categoryId: searchParams.get('categoryId') ?? undefined,
    brandId: searchParams.get('brandId') ?? undefined,
    size: searchParams.get('size') ?? undefined,
    color: searchParams.get('color') ?? undefined,
    fit: searchParams.get('fit') ?? undefined,
    fabric: searchParams.get('fabric') ?? undefined,
    priceMin: num(searchParams.get('priceMin')),
    priceMax: num(searchParams.get('priceMax')),
  };
  const sort = (searchParams.get('sort') as StoreSort | null) ?? 'newest';
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1);

  const params: ProductListParams = {
    page,
    limit: PAGE_SIZE,
    sort,
    categoryId: categorySlug ? fixedCategoryId : urlFilters.categoryId,
    brandId: brandSlug ? fixedBrandId : urlFilters.brandId,
    size: urlFilters.size,
    color: urlFilters.color,
    fit: urlFilters.fit,
    fabric: urlFilters.fabric,
    priceMin: urlFilters.priceMin,
    priceMax: urlFilters.priceMax,
  };

  const { data, isPending, isError, refetch } = useProducts(params);

  const available = ALL_FILTERS.filter(
    (key) => !(key === 'category' && categorySlug) && !(key === 'brand' && brandSlug),
  );

  const options: FilterOptions = {
    category: categories.map((c) => ({ label: c.name, value: c.id })),
    brand: brands.map((b) => ({ label: b.name, value: b.id })),
    size: SIZE_OPTIONS.map((s) => ({ label: s, value: s })),
    color: COLOR_OPTIONS.map((c) => ({ label: c.label, value: c.value, hex: c.hex })),
    fit: FIT_OPTIONS.map((f) => ({ label: f, value: f })),
    fabric: FABRIC_OPTIONS.map((f) => ({ label: f, value: f })),
  };

  const setParams = React.useCallback(
    (updates: Record<string, string | number | undefined>, resetPage = true): void => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined || value === '') next.delete(key);
        else next.set(key, String(value));
      }
      if (resetPage) next.delete('page');
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const onFilterChange = (patch: Partial<ListingFilters>): void => setParams(patch);
  const onClear = (): void =>
    setParams({
      categoryId: undefined,
      brandId: undefined,
      size: undefined,
      color: undefined,
      fit: undefined,
      fabric: undefined,
      priceMin: undefined,
      priceMax: undefined,
    });
  const onPageChange = (nextPage: number): void => {
    setParams({ page: nextPage }, false);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const sidebar = (
    <FilterSidebar
      filters={urlFilters}
      onChange={onFilterChange}
      onClear={onClear}
      available={available}
      options={options}
    />
  );

  const total = data?.pageInfo.total ?? 0;
  const totalPages = data?.pageInfo.totalPages ?? 0;

  return (
    <div>
      <ListingToolbar
        total={total}
        loading={isPending}
        sortControl={
          <SortSelect
            value={sort}
            options={STORE_SORT_OPTIONS}
            onChange={(value) => setParams({ sort: value })}
          />
        }
        filterPanel={sidebar}
      />

      <div className="grid gap-8 lg:grid-cols-[15rem_1fr]">
        <aside className="hidden lg:block">{sidebar}</aside>
        <div>
          {isError ? (
            <ErrorState onRetry={() => void refetch()} />
          ) : (
            <ProductGrid products={data?.items} loading={isPending} skeletonCount={PAGE_SIZE} />
          )}
          <div className="mt-12">
            <PaginationBar page={page} totalPages={totalPages} onPageChange={onPageChange} />
          </div>
        </div>
      </div>
    </div>
  );
}

export { ServerProductListing };
