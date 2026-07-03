import type { SearchSort } from '@/services/search';
import type { StoreSort } from '@/services/catalog';

/**
 * Filter control option sets. These are UI controls mapped to the backend's
 * exact-match string filters (variant size/color, product fit/fabric); values
 * that match no products simply yield an empty result set.
 */
export const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const;

export const COLOR_OPTIONS = [
  { label: 'Black', value: 'Black', hex: '#111111' },
  { label: 'White', value: 'White', hex: '#f5f5f5' },
  { label: 'Grey', value: 'Grey', hex: '#9ca3af' },
  { label: 'Navy', value: 'Navy', hex: '#1e293b' },
  { label: 'Beige', value: 'Beige', hex: '#d8c3a5' },
  { label: 'Olive', value: 'Olive', hex: '#5b6236' },
  { label: 'Brown', value: 'Brown', hex: '#6b4f34' },
  { label: 'Blue', value: 'Blue', hex: '#2563eb' },
] as const;

export const FIT_OPTIONS = ['Slim', 'Regular', 'Relaxed', 'Oversized'] as const;

export const FABRIC_OPTIONS = ['Cotton', 'Linen', 'Wool', 'Denim', 'Blend'] as const;

export const STORE_SORT_OPTIONS: { value: StoreSort; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'priceAsc', label: 'Price: Low to High' },
  { value: 'priceDesc', label: 'Price: High to Low' },
  { value: 'name', label: 'Name' },
];

export const SEARCH_SORT_OPTIONS: { value: SearchSort; label: string }[] = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

/** Products shown per listing page. */
export const PAGE_SIZE = 12;
