/**
 * Centralised TanStack Query key factory. Using a single typed source keeps
 * cache keys consistent and makes invalidation predictable. Extend per feature
 * (products, cart, orders…) as those data hooks are built.
 */
export const queryKeys = {
  auth: {
    session: () => ['auth', 'session'] as const,
  },
  store: {
    home: () => ['store', 'home'] as const,
  },
} as const;
