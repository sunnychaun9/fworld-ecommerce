import { api } from '@/services/api';
import type { CatalogList } from '@/types/catalog';
import type { AdminProduct, BulkFeaturedInput, BulkStatusInput, ProductInput } from '@/types/admin';

export interface AdminProductsParams {
  page?: number;
  limit?: number;
  status?: string;
  categoryId?: string;
  brandId?: string;
  sort?: string;
}

export function listAdminProducts(
  params: AdminProductsParams = {},
): Promise<CatalogList<AdminProduct>> {
  return api.get<CatalogList<AdminProduct>>('/products', { params });
}

export function getAdminProduct(id: string): Promise<AdminProduct> {
  return api.get<AdminProduct>(`/products/${id}`);
}

export function createProduct(input: ProductInput): Promise<AdminProduct> {
  return api.post<AdminProduct>('/products', input);
}

export function updateProduct(id: string, input: Partial<ProductInput>): Promise<AdminProduct> {
  return api.patch<AdminProduct>(`/products/${id}`, input);
}

export function deleteProduct(id: string): Promise<{ id: string }> {
  return api.delete<{ id: string }>(`/products/${id}`);
}

// Bulk operations (`/admin/products/*`) — all return `{ affected: number }`.
export function bulkSetStatus(input: BulkStatusInput): Promise<{ affected: number }> {
  return api.post<{ affected: number }>('/admin/products/status', input);
}

export function bulkSetFlags(input: BulkFeaturedInput): Promise<{ affected: number }> {
  return api.post<{ affected: number }>('/admin/products/featured', input);
}
