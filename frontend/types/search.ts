import type { ProductCard } from './catalog';

export interface SearchFacet {
  id: string;
  name: string;
  slug: string;
  count: number;
}

/** `GET /search/products` response (items normalised to ProductCard client-side). */
export interface SearchResponse {
  items: ProductCard[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  facets: {
    brands: SearchFacet[];
    categories: SearchFacet[];
  };
}
