import { api } from '@/services/api';
import { discountPercent } from '@/lib/format';
import type { ProductCard } from '@/types/catalog';
import type { SearchFacet, SearchResponse } from '@/types/search';

export type SearchSort = 'relevance' | 'newest' | 'price_asc' | 'price_desc';

export interface SearchParams {
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
  page?: number;
  limit?: number;
  sort?: SearchSort;
}

/** Raw search item — a product card without the store's computed fields. */
type RawSearchItem = Omit<ProductCard, 'inStock' | 'discountPercentage'> & {
  category?: { id: string; name: string; slug: string } | null;
};

interface RawSearchResponse {
  items: RawSearchItem[];
  pagination: SearchResponse['pagination'];
  facets: { brands: SearchFacet[]; categories: SearchFacet[] };
}

/** Normalise a raw search item into the shared ProductCard shape. */
function toCard(item: RawSearchItem): ProductCard {
  return {
    ...item,
    inStock: true,
    discountPercentage: discountPercent(item.sellingPrice, item.mrp),
  };
}

export async function searchProducts(params: SearchParams): Promise<SearchResponse> {
  const raw = await api.get<RawSearchResponse>('/search/products', { params });
  return { ...raw, items: raw.items.map(toCard) };
}
