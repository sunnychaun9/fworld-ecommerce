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
} as const;

export type RouteKey = keyof typeof ROUTES;
