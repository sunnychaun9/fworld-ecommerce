import { SearchSort } from './dto/search-products.dto';

/** DI token for the pluggable product-search backend. */
export const PRODUCT_SEARCH_PROVIDER = 'PRODUCT_SEARCH_PROVIDER';

/** Normalized, provider-agnostic search query. */
export interface ProductSearchQuery {
  q?: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  size?: string;
  color?: string;
  fit?: string;
  fabric?: string;
  featured?: boolean;
  bestSeller?: boolean;
  newArrival?: boolean;
  page: number;
  limit: number;
  sort: SearchSort;
}

export interface SearchFacet {
  id: string;
  name: string;
  slug: string;
  count: number;
}

export interface ProductSearchResult {
  items: unknown[];
  total: number;
  facets: { brands: SearchFacet[]; categories: SearchFacet[] };
}

/**
 * Contract for a product-search backend. The PostgreSQL implementation is the
 * default; a Meilisearch/OpenSearch adapter can be bound to the same token later
 * without touching the controller or service.
 */
export interface ProductSearchProvider {
  search(query: ProductSearchQuery): Promise<ProductSearchResult>;
}
