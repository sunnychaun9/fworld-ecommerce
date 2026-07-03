/**
 * Application route paths. Centralised so links stay consistent and refactorable.
 * These are the storefront shell routes; account/catalog-detail routes are added
 * as their pages are built.
 */
export const ROUTES = {
  home: '/',
  men: '/men',
  women: '/women',
  collections: '/collections',
  /** New Arrivals is a filtered view of collections until it gets its own page. */
  newArrivals: '/collections?sort=new',
  brands: '/brands',
  sale: '/sale',
  search: '/search',
  cart: '/cart',
  checkout: '/checkout',
  login: '/login',
  register: '/register',
  orders: '/orders',
  paymentFailed: '/order/payment-failed',
  /** Order confirmation page for a given order id. */
  orderSuccess: (id: string) => `/order/success/${id}`,
  account: '/account',
  accountProfile: '/account/profile',
  accountOrders: '/account/orders',
  accountOrder: (id: string) => `/account/orders/${id}`,
  accountAddresses: '/account/addresses',
  accountWishlist: '/account/wishlist',
  accountReviews: '/account/reviews',
  accountNotifications: '/account/notifications',
  admin: '/admin',
  adminOrders: '/admin/orders',
  adminOrder: (id: string) => `/admin/orders/${id}`,
  adminProducts: '/admin/products',
  adminProductNew: '/admin/products/new',
  adminProduct: (id: string) => `/admin/products/${id}`,
  adminCategories: '/admin/categories',
  adminBrands: '/admin/brands',
  adminCollections: '/admin/collections',
  adminInventory: '/admin/inventory',
  adminCoupons: '/admin/coupons',
  adminCustomers: '/admin/customers',
  adminReviews: '/admin/reviews',
  adminReturns: '/admin/returns',
  adminNotifications: '/admin/notifications',
  adminImportExport: '/admin/import-export',
  adminSettings: '/admin/settings',
} as const;

export type RouteKey = keyof typeof ROUTES;
