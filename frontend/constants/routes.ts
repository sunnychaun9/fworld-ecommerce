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
} as const;

export type RouteKey = keyof typeof ROUTES;
