'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/constants/query-keys';
import { useIsAuthenticated } from '@/features/auth/use-auth';
import {
  bulkSetFlags,
  bulkSetStatus,
  createImage,
  createProduct,
  createVariant,
  deleteImage,
  deleteProduct,
  deleteVariant,
  getAdminProduct,
  listAdminProducts,
  listProductImages,
  listProductVariants,
  updateImage,
  updateProduct,
  updateVariant,
  type AdminProductsParams,
} from '@/services/admin';
import type {
  BulkFeaturedInput,
  BulkStatusInput,
  CreateImageInput,
  CreateVariantInput,
  ProductInput,
  UpdateImageInput,
  UpdateVariantInput,
} from '@/types/admin';

export function useAdminProducts(params: AdminProductsParams) {
  const authenticated = useIsAuthenticated();
  return useQuery({
    queryKey: queryKeys.admin.products(params),
    queryFn: () => listAdminProducts(params),
    enabled: authenticated,
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });
}

export function useAdminProduct(id: string | undefined) {
  const authenticated = useIsAuthenticated();
  return useQuery({
    queryKey: queryKeys.admin.product(id ?? 'none'),
    queryFn: () => getAdminProduct(id as string),
    enabled: authenticated && Boolean(id),
    retry: false,
  });
}

function useInvalidateProducts() {
  const qc = useQueryClient();
  return () => void qc.invalidateQueries({ queryKey: ['admin', 'products'] });
}

export function useCreateProduct() {
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: (input: ProductInput) => createProduct(input),
    onSuccess: invalidate,
  });
}

export function useUpdateProduct(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<ProductInput>) => updateProduct(id, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.admin.product(id) });
      void qc.invalidateQueries({ queryKey: ['admin', 'products'] });
    },
  });
}

export function useDeleteProduct() {
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: invalidate,
  });
}

export function useBulkStatus() {
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: (input: BulkStatusInput) => bulkSetStatus(input),
    onSuccess: invalidate,
  });
}

export function useBulkFlags() {
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: (input: BulkFeaturedInput) => bulkSetFlags(input),
    onSuccess: invalidate,
  });
}

// --- Images ---
export function useProductImages(productId: string | undefined) {
  const authenticated = useIsAuthenticated();
  return useQuery({
    queryKey: queryKeys.admin.productImages(productId ?? 'none'),
    queryFn: () => listProductImages(productId as string),
    enabled: authenticated && Boolean(productId),
  });
}

export function useImageMutations(productId: string) {
  const qc = useQueryClient();
  const invalidate = (): void => {
    void qc.invalidateQueries({ queryKey: queryKeys.admin.productImages(productId) });
  };
  const create = useMutation({
    mutationFn: (input: CreateImageInput) => createImage(input),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateImageInput }) => updateImage(id, input),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteImage(id),
    onSuccess: invalidate,
  });
  return { create, update, remove };
}

// --- Variants ---
export function useProductVariants(productId: string | undefined) {
  const authenticated = useIsAuthenticated();
  return useQuery({
    queryKey: queryKeys.admin.productVariants(productId ?? 'none'),
    queryFn: () => listProductVariants(productId as string),
    enabled: authenticated && Boolean(productId),
  });
}

export function useVariantMutations(productId: string) {
  const qc = useQueryClient();
  const invalidate = (): void => {
    void qc.invalidateQueries({ queryKey: queryKeys.admin.productVariants(productId) });
  };
  const create = useMutation({
    mutationFn: (input: CreateVariantInput) => createVariant(input),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateVariantInput }) =>
      updateVariant(id, input),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteVariant(id),
    onSuccess: invalidate,
  });
  return { create, update, remove };
}
