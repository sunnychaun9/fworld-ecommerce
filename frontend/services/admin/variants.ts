import { api } from '@/services/api';
import type { CatalogList, ProductVariant } from '@/types/catalog';
import type { CreateVariantInput, UpdateVariantInput } from '@/types/admin';

export function listProductVariants(productId: string): Promise<CatalogList<ProductVariant>> {
  return api.get<CatalogList<ProductVariant>>(`/products/${productId}/variants`, {
    params: { limit: 100 },
  });
}

export function createVariant(input: CreateVariantInput): Promise<ProductVariant> {
  return api.post<ProductVariant>('/variants', input);
}

export function updateVariant(id: string, input: UpdateVariantInput): Promise<ProductVariant> {
  return api.patch<ProductVariant>(`/variants/${id}`, input);
}

export function deleteVariant(id: string): Promise<{ id: string }> {
  return api.delete<{ id: string }>(`/variants/${id}`);
}
