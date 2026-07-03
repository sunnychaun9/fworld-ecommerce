/** Filter state shared by the listing engines. Single-select per key to match
 * the backend's exact-match filters. */
export interface ListingFilters {
  categoryId?: string;
  brandId?: string;
  size?: string;
  color?: string;
  fit?: string;
  fabric?: string;
  priceMin?: number;
  priceMax?: number;
}

export type FilterKey = 'category' | 'brand' | 'size' | 'color' | 'fit' | 'fabric' | 'price';

export interface FilterOption {
  label: string;
  value: string;
  hex?: string;
}

export type FilterOptions = Partial<Record<Exclude<FilterKey, 'price'>, FilterOption[]>>;
