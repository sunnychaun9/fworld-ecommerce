/**
 * Centralised TanStack Query key factory. A single typed source keeps cache keys
 * consistent and invalidation predictable.
 */
export const queryKeys = {
  auth: {
    session: () => ['auth', 'session'] as const,
  },
  store: {
    home: () => ['store', 'home'] as const,
    products: (params: Record<string, unknown>) => ['store', 'products', params] as const,
    product: (slug: string) => ['store', 'product', slug] as const,
    collection: (slug: string) => ['store', 'collection', slug] as const,
  },
  catalog: {
    categories: () => ['catalog', 'categories'] as const,
    brands: () => ['catalog', 'brands'] as const,
    categoryBySlug: (slug: string) => ['catalog', 'category', slug] as const,
    brandBySlug: (slug: string) => ['catalog', 'brand', slug] as const,
  },
  search: (params: Record<string, unknown>) => ['search', params] as const,
  cart: () => ['cart'] as const,
  wishlist: () => ['wishlist'] as const,
  reviews: (productId: string) => ['reviews', productId] as const,
  checkout: () => ['checkout'] as const,
  addresses: () => ['addresses'] as const,
  order: (id: string) => ['order', id] as const,
} as const;
