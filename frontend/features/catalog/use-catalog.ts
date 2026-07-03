'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/constants/query-keys';
import {
  fetchBrands,
  fetchCategories,
  fetchCollectionBySlug,
  fetchProducts,
  type ProductListParams,
} from '@/services/catalog';

/** Paginated, filtered product listing. Keeps previous page while fetching. */
export function useProducts(params: ProductListParams) {
  return useQuery({
    queryKey: queryKeys.store.products(params as Record<string, unknown>),
    queryFn: () => fetchProducts(params),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}

/** A collection and its active products. */
export function useCollection(slug: string) {
  return useQuery({
    queryKey: queryKeys.store.collection(slug),
    queryFn: () => fetchCollectionBySlug(slug),
    staleTime: 5 * 60_000,
  });
}

/** Category options for filters (rarely change). */
export function useCategories() {
  return useQuery({
    queryKey: queryKeys.catalog.categories(),
    queryFn: fetchCategories,
    staleTime: 30 * 60_000,
  });
}

/** Brand options for filters (rarely change). */
export function useBrands() {
  return useQuery({
    queryKey: queryKeys.catalog.brands(),
    queryFn: fetchBrands,
    staleTime: 30 * 60_000,
  });
}
