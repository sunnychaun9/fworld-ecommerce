/**
 * Application route paths. Centralised so links stay consistent and refactorable.
 * Only foundation-level routes exist today; catalog/account routes are added as
 * their pages are built.
 */
export const ROUTES = {
  home: '/',
} as const;

export type RouteKey = keyof typeof ROUTES;
