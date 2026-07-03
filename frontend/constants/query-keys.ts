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
  orders: (params: Record<string, unknown>) => ['orders', params] as const,
  orderTracking: (id: string) => ['order', id, 'tracking'] as const,
  notifications: () => ['notifications'] as const,
  returns: () => ['returns'] as const,
  returnDetail: (id: string) => ['return', id] as const,
  myReviews: () => ['reviews', 'my'] as const,
  admin: {
    dashboard: () => ['admin', 'dashboard'] as const,
    orders: (params: object) => ['admin', 'orders', params] as const,
    order: (id: string) => ['admin', 'order', id] as const,
    products: (params: object) => ['admin', 'products', params] as const,
    product: (id: string) => ['admin', 'product', id] as const,
    productImages: (productId: string) => ['admin', 'product', productId, 'images'] as const,
    productVariants: (productId: string) => ['admin', 'product', productId, 'variants'] as const,
    categories: (params: object) => ['admin', 'categories', params] as const,
    brands: (params: object) => ['admin', 'brands', params] as const,
    collections: (params: object) => ['admin', 'collections', params] as const,
    collectionProducts: (id: string) => ['admin', 'collection', id, 'products'] as const,
    inventory: (params: object) => ['admin', 'inventory', params] as const,
    lowStock: () => ['admin', 'inventory', 'low-stock'] as const,
    coupons: () => ['admin', 'coupons'] as const,
    shipment: (id: string) => ['admin', 'shipment', id] as const,
    importTemplate: () => ['admin', 'import-template'] as const,
  },
} as const;
