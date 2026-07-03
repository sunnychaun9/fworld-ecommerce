import { api } from '@/services/api';
import type {
  BrandDetail,
  CatalogList,
  Category,
  CollectionWithProducts,
  HomeResponse,
  ProductDetail,
  ProductListResponse,
} from '@/types/catalog';

export type StoreSort = 'newest' | 'priceAsc' | 'priceDesc' | 'name';

/** Query parameters accepted by `GET /store/products`. */
export interface ProductListParams {
  page?: number;
  limit?: number;
  categoryId?: string;
  brandId?: string;
  priceMin?: number;
  priceMax?: number;
  size?: string;
  color?: string;
  fit?: string;
  fabric?: string;
  sort?: StoreSort;
  featured?: boolean;
  newArrival?: boolean;
  bestSeller?: boolean;
  inStock?: boolean;
}

/** Fetch the public storefront home payload (featured / new / best / collections). */
export function fetchHome(): Promise<HomeResponse> {
  return api.get<HomeResponse>('/store/home');
}

/** Paginated, filtered product listing. */
export function fetchProducts(params: ProductListParams): Promise<ProductListResponse> {
  return api.get<ProductListResponse>('/store/products', { params });
}

/** Full product detail by slug. */
export function fetchProductBySlug(slug: string): Promise<ProductDetail> {
  return api.get<ProductDetail>(`/store/products/${encodeURIComponent(slug)}`);
}

/** Collection with its active products. */
export function fetchCollectionBySlug(slug: string): Promise<CollectionWithProducts> {
  return api.get<CollectionWithProducts>(`/store/collections/${encodeURIComponent(slug)}`);
}

export function fetchCategoryBySlug(slug: string): Promise<Category> {
  return api.get<Category>(`/categories/slug/${encodeURIComponent(slug)}`);
}

export function fetchBrandBySlug(slug: string): Promise<BrandDetail> {
  return api.get<BrandDetail>(`/brands/slug/${encodeURIComponent(slug)}`);
}

/** Active categories for filter option lists. */
export function fetchCategories(): Promise<CatalogList<Category>> {
  return api.get<CatalogList<Category>>('/categories', {
    params: { limit: 100, status: 'ACTIVE' },
  });
}

/** Brands for filter option lists. */
export function fetchBrands(): Promise<CatalogList<BrandDetail>> {
  return api.get<CatalogList<BrandDetail>>('/brands', { params: { limit: 100 } });
}
