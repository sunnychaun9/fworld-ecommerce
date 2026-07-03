'use client';

import * as React from 'react';

import { ErrorState } from '@/components/common/error-state';
import { PAGE_SIZE, STORE_SORT_OPTIONS } from '@/config/filters';
import type { StoreSort } from '@/services/catalog';
import type { ProductCard } from '@/types/catalog';

import { FilterSidebar } from './filter-sidebar';
import { ListingToolbar } from './listing-toolbar';
import { PaginationBar } from './pagination-bar';
import { ProductGrid } from './product-grid';
import { SortSelect } from './sort-select';
import type { FilterKey, FilterOptions, ListingFilters } from './types';

const AVAILABLE: FilterKey[] = ['brand', 'fit', 'fabric', 'price'];

function distinct<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function sortProducts(products: ProductCard[], sort: StoreSort): ProductCard[] {
  const copy = [...products];
  switch (sort) {
    case 'priceAsc':
      return copy.sort((a, b) => Number(a.sellingPrice) - Number(b.sellingPrice));
    case 'priceDesc':
      return copy.sort((a, b) => Number(b.sellingPrice) - Number(a.sellingPrice));
    case 'name':
      return copy.sort((a, b) => a.name.localeCompare(b.name));
    default:
      return copy.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}

interface ClientProductListingProps {
  products: ProductCard[];
  loading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

/**
 * In-memory listing for endpoints that return a full product set without server
 * filtering/pagination (collections, sale). Filters/sorts/paginates client-side;
 * filter options are derived from the loaded products (never hardcoded).
 */
function ClientProductListing({
  products,
  loading = false,
  isError = false,
  onRetry,
}: ClientProductListingProps): React.ReactElement {
  const [filters, setFilters] = React.useState<ListingFilters>({});
  const [sort, setSort] = React.useState<StoreSort>('newest');
  const [page, setPage] = React.useState(1);

  const options: FilterOptions = React.useMemo(() => {
    const brandMap = new Map<string, string>();
    for (const p of products) if (p.brandId && p.brand) brandMap.set(p.brandId, p.brand.name);
    return {
      brand: [...brandMap].map(([value, label]) => ({ label, value })),
      fit: distinct(products.map((p) => p.fit).filter((v): v is string => Boolean(v))).map((v) => ({
        label: v,
        value: v,
      })),
      fabric: distinct(products.map((p) => p.fabric).filter((v): v is string => Boolean(v))).map(
        (v) => ({ label: v, value: v }),
      ),
    };
  }, [products]);

  const filtered = React.useMemo(() => {
    const result = products.filter((p) => {
      if (filters.brandId && p.brandId !== filters.brandId) return false;
      if (filters.fit && p.fit !== filters.fit) return false;
      if (filters.fabric && p.fabric !== filters.fabric) return false;
      const price = Number(p.sellingPrice);
      if (filters.priceMin !== undefined && price < filters.priceMin) return false;
      if (filters.priceMax !== undefined && price > filters.priceMax) return false;
      return true;
    });
    return sortProducts(result, sort);
  }, [products, filters, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const onFilterChange = (patch: Partial<ListingFilters>): void => {
    setFilters((prev) => ({ ...prev, ...patch }));
    setPage(1);
  };
  const onClear = (): void => {
    setFilters({});
    setPage(1);
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

  return (
    <div>
      <ListingToolbar
        total={filtered.length}
        loading={loading}
        sortControl={
          <SortSelect
            value={sort}
            options={STORE_SORT_OPTIONS}
            onChange={(value) => {
              setSort(value);
              setPage(1);
            }}
          />
        }
        filterPanel={sidebar}
      />
      <div className="grid gap-8 lg:grid-cols-[15rem_1fr]">
        <aside className="hidden lg:block">{sidebar}</aside>
        <div>
          {isError ? (
            <ErrorState onRetry={onRetry} />
          ) : (
            <ProductGrid products={pageItems} loading={loading} skeletonCount={PAGE_SIZE} />
          )}
          <div className="mt-12">
            <PaginationBar
              page={currentPage}
              totalPages={totalPages}
              onPageChange={(p) => {
                setPage(p);
                if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export { ClientProductListing };
