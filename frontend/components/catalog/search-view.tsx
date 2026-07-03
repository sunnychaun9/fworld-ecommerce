'use client';

import { Search } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import * as React from 'react';

import { ErrorState } from '@/components/common/error-state';
import { Input } from '@/components/ui/input';
import {
  COLOR_OPTIONS,
  FABRIC_OPTIONS,
  FIT_OPTIONS,
  PAGE_SIZE,
  SEARCH_SORT_OPTIONS,
  SIZE_OPTIONS,
} from '@/config/filters';
import { useSearch } from '@/features/search/use-search';
import type { SearchParams, SearchSort } from '@/services/search';

import { FilterSidebar } from './filter-sidebar';
import { ListingToolbar } from './listing-toolbar';
import { PaginationBar } from './pagination-bar';
import { ProductGrid } from './product-grid';
import { SortSelect } from './sort-select';
import type { FilterKey, FilterOptions, ListingFilters } from './types';

const AVAILABLE: FilterKey[] = ['category', 'brand', 'size', 'color', 'fit', 'fabric', 'price'];

function num(value: string | null): number | undefined {
  if (value === null || value.trim() === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

/** Storefront search backed by `GET /search/products` with dynamic brand/category
 * facets. URL-synced query, filters, sort and pagination. */
function SearchView(): React.ReactElement {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const q = searchParams.get('q') ?? '';
  const [term, setTerm] = React.useState(q);
  React.useEffect(() => setTerm(q), [q]);

  // In this view `categoryId`/`brandId` hold slugs (the search API filters by slug).
  const filters: ListingFilters = {
    categoryId: searchParams.get('category') ?? undefined,
    brandId: searchParams.get('brand') ?? undefined,
    size: searchParams.get('size') ?? undefined,
    color: searchParams.get('color') ?? undefined,
    fit: searchParams.get('fit') ?? undefined,
    fabric: searchParams.get('fabric') ?? undefined,
    priceMin: num(searchParams.get('minPrice')),
    priceMax: num(searchParams.get('maxPrice')),
  };
  const sort = (searchParams.get('sort') as SearchSort | null) ?? 'relevance';
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1);

  const params: SearchParams = {
    q: q || undefined,
    category: filters.categoryId,
    brand: filters.brandId,
    size: filters.size,
    color: filters.color,
    fit: filters.fit,
    fabric: filters.fabric,
    minPrice: filters.priceMin,
    maxPrice: filters.priceMax,
    sort,
    page,
    limit: PAGE_SIZE,
  };

  const { data, isPending, isError, refetch } = useSearch(params, true);

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

  // FilterSidebar keys map to categoryId/brandId; translate to the search slugs.
  const onFilterChange = (patch: Partial<ListingFilters>): void => {
    const mapped: Record<string, string | number | undefined> = {};
    if ('categoryId' in patch) mapped.category = patch.categoryId;
    if ('brandId' in patch) mapped.brand = patch.brandId;
    if ('size' in patch) mapped.size = patch.size;
    if ('color' in patch) mapped.color = patch.color;
    if ('fit' in patch) mapped.fit = patch.fit;
    if ('fabric' in patch) mapped.fabric = patch.fabric;
    if ('priceMin' in patch) mapped.minPrice = patch.priceMin;
    if ('priceMax' in patch) mapped.maxPrice = patch.priceMax;
    setParams(mapped);
  };
  const onClear = (): void =>
    setParams({
      category: undefined,
      brand: undefined,
      size: undefined,
      color: undefined,
      fit: undefined,
      fabric: undefined,
      minPrice: undefined,
      maxPrice: undefined,
    });

  const options: FilterOptions = {
    category: (data?.facets.categories ?? []).map((f) => ({
      label: `${f.name} (${f.count})`,
      value: f.slug,
    })),
    brand: (data?.facets.brands ?? []).map((f) => ({
      label: `${f.name} (${f.count})`,
      value: f.slug,
    })),
    size: SIZE_OPTIONS.map((s) => ({ label: s, value: s })),
    color: COLOR_OPTIONS.map((c) => ({ label: c.label, value: c.value, hex: c.hex })),
    fit: FIT_OPTIONS.map((f) => ({ label: f, value: f })),
    fabric: FABRIC_OPTIONS.map((f) => ({ label: f, value: f })),
  };

  const sidebar = (
    <FilterSidebar
      filters={filters}
      onChange={onFilterChange}
      onClear={onClear}
      available={AVAILABLE}
      options={options}
    />
  );

  const total = data?.pagination.total ?? 0;
  const totalPages = data?.pagination.totalPages ?? 0;

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setParams({ q: term.trim() || undefined });
        }}
        className="mb-8 flex items-center gap-2"
        role="search"
      >
        <div className="relative flex-1">
          <Search className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" />
          <Input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            type="search"
            placeholder="Search products, brands, categories…"
            aria-label="Search"
            className="h-11 pl-10"
          />
        </div>
      </form>

      <ListingToolbar
        total={total}
        loading={isPending}
        sortControl={
          <SortSelect
            value={sort}
            options={SEARCH_SORT_OPTIONS}
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
            <ProductGrid
              products={data?.items}
              loading={isPending}
              skeletonCount={PAGE_SIZE}
              emptyTitle={q ? `No results for “${q}”` : 'No products found'}
              emptyDescription="Try a different term or adjust your filters."
            />
          )}
          <div className="mt-12">
            <PaginationBar
              page={page}
              totalPages={totalPages}
              onPageChange={(p) => {
                setParams({ page: p }, false);
                if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export { SearchView };
