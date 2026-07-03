import { api } from '@/services/api';
import type { BrandDetail, CatalogList, Category, StoreCollection } from '@/types/catalog';
import type { AdminProduct, BrandInput, CategoryInput, CollectionInput } from '@/types/admin';

// --- Categories ---
export function listCategories(
  params: { page?: number; limit?: number; status?: string } = {},
): Promise<CatalogList<Category>> {
  return api.get<CatalogList<Category>>('/categories', { params: { limit: 100, ...params } });
}

export function createCategory(input: CategoryInput): Promise<Category> {
  return api.post<Category>('/categories', input);
}

export function updateCategory(id: string, input: Partial<CategoryInput>): Promise<Category> {
  return api.patch<Category>(`/categories/${id}`, input);
}

export function deleteCategory(id: string): Promise<{ id: string }> {
  return api.delete<{ id: string }>(`/categories/${id}`);
}

// --- Brands ---
export function listBrands(
  params: { page?: number; limit?: number; status?: string } = {},
): Promise<CatalogList<BrandDetail>> {
  return api.get<CatalogList<BrandDetail>>('/brands', { params: { limit: 100, ...params } });
}

export function createBrand(input: BrandInput): Promise<BrandDetail> {
  return api.post<BrandDetail>('/brands', input);
}

export function updateBrand(id: string, input: Partial<BrandInput>): Promise<BrandDetail> {
  return api.patch<BrandDetail>(`/brands/${id}`, input);
}

export function deleteBrand(id: string): Promise<{ id: string }> {
  return api.delete<{ id: string }>(`/brands/${id}`);
}

// --- Collections ---
export function listCollections(
  params: { page?: number; limit?: number; status?: string } = {},
): Promise<CatalogList<StoreCollection>> {
  return api.get<CatalogList<StoreCollection>>('/collections', {
    params: { limit: 100, ...params },
  });
}

export function getCollection(id: string): Promise<StoreCollection> {
  return api.get<StoreCollection>(`/collections/${id}`);
}

export function createCollection(input: CollectionInput): Promise<StoreCollection> {
  return api.post<StoreCollection>('/collections', input);
}

export function updateCollection(
  id: string,
  input: Partial<CollectionInput>,
): Promise<StoreCollection> {
  return api.patch<StoreCollection>(`/collections/${id}`, input);
}

export function deleteCollection(id: string): Promise<{ id: string }> {
  return api.delete<{ id: string }>(`/collections/${id}`);
}

/** Products in a collection, each with its `sortOrder` position. */
export function getCollectionProducts(
  id: string,
): Promise<(AdminProduct & { sortOrder: number })[]> {
  return api.get<(AdminProduct & { sortOrder: number })[]>(`/collections/${id}/products`);
}

export function addCollectionProducts(
  id: string,
  productIds: string[],
): Promise<(AdminProduct & { sortOrder: number })[]> {
  return api.post<(AdminProduct & { sortOrder: number })[]>(`/collections/${id}/products`, {
    productIds,
  });
}

export function removeCollectionProduct(
  id: string,
  productId: string,
): Promise<{ collectionId: string; productId: string }> {
  return api.delete<{ collectionId: string; productId: string }>(
    `/collections/${id}/products/${productId}`,
  );
}

export function reorderCollectionProducts(
  id: string,
  items: { productId: string; sortOrder: number }[],
): Promise<(AdminProduct & { sortOrder: number })[]> {
  return api.patch<(AdminProduct & { sortOrder: number })[]>(
    `/collections/${id}/products/reorder`,
    { items },
  );
}
