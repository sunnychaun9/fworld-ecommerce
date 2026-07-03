'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/constants/query-keys';
import { useIsAuthenticated } from '@/features/auth/use-auth';
import {
  addCollectionProducts,
  createBrand,
  createCategory,
  createCollection,
  deleteBrand,
  deleteCategory,
  deleteCollection,
  getCollectionProducts,
  listBrands,
  listCategories,
  listCollections,
  removeCollectionProduct,
  reorderCollectionProducts,
  updateBrand,
  updateCategory,
  updateCollection,
} from '@/services/admin';
import type { BrandInput, CategoryInput, CollectionInput } from '@/types/admin';

const EMPTY = {};

// --- Categories ---
export function useAdminCategories() {
  const authenticated = useIsAuthenticated();
  return useQuery({
    queryKey: queryKeys.admin.categories(EMPTY),
    queryFn: () => listCategories(),
    enabled: authenticated,
    staleTime: 60_000,
  });
}

export function useCategoryMutations() {
  const qc = useQueryClient();
  const invalidate = (): void => void qc.invalidateQueries({ queryKey: ['admin', 'categories'] });
  return {
    create: useMutation({
      mutationFn: (i: CategoryInput) => createCategory(i),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, input }: { id: string; input: Partial<CategoryInput> }) =>
        updateCategory(id, input),
      onSuccess: invalidate,
    }),
    remove: useMutation({ mutationFn: (id: string) => deleteCategory(id), onSuccess: invalidate }),
  };
}

// --- Brands ---
export function useAdminBrands() {
  const authenticated = useIsAuthenticated();
  return useQuery({
    queryKey: queryKeys.admin.brands(EMPTY),
    queryFn: () => listBrands(),
    enabled: authenticated,
    staleTime: 60_000,
  });
}

export function useBrandMutations() {
  const qc = useQueryClient();
  const invalidate = (): void => void qc.invalidateQueries({ queryKey: ['admin', 'brands'] });
  return {
    create: useMutation({ mutationFn: (i: BrandInput) => createBrand(i), onSuccess: invalidate }),
    update: useMutation({
      mutationFn: ({ id, input }: { id: string; input: Partial<BrandInput> }) =>
        updateBrand(id, input),
      onSuccess: invalidate,
    }),
    remove: useMutation({ mutationFn: (id: string) => deleteBrand(id), onSuccess: invalidate }),
  };
}

// --- Collections ---
export function useAdminCollections() {
  const authenticated = useIsAuthenticated();
  return useQuery({
    queryKey: queryKeys.admin.collections(EMPTY),
    queryFn: () => listCollections(),
    enabled: authenticated,
    staleTime: 60_000,
  });
}

export function useCollectionMutations() {
  const qc = useQueryClient();
  const invalidate = (): void => void qc.invalidateQueries({ queryKey: ['admin', 'collections'] });
  return {
    create: useMutation({
      mutationFn: (i: CollectionInput) => createCollection(i),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, input }: { id: string; input: Partial<CollectionInput> }) =>
        updateCollection(id, input),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: string) => deleteCollection(id),
      onSuccess: invalidate,
    }),
  };
}

export function useCollectionProducts(id: string | undefined) {
  const authenticated = useIsAuthenticated();
  return useQuery({
    queryKey: queryKeys.admin.collectionProducts(id ?? 'none'),
    queryFn: () => getCollectionProducts(id as string),
    enabled: authenticated && Boolean(id),
  });
}

export function useCollectionProductMutations(id: string) {
  const qc = useQueryClient();
  const invalidate = (): void =>
    void qc.invalidateQueries({ queryKey: queryKeys.admin.collectionProducts(id) });
  return {
    add: useMutation({
      mutationFn: (productIds: string[]) => addCollectionProducts(id, productIds),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (productId: string) => removeCollectionProduct(id, productId),
      onSuccess: invalidate,
    }),
    reorder: useMutation({
      mutationFn: (items: { productId: string; sortOrder: number }[]) =>
        reorderCollectionProducts(id, items),
      onSuccess: invalidate,
    }),
  };
}
