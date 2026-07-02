import type { Collection, Prisma } from '@prisma/client';

/** Computed storefront fields, never stored — always derived at read time. */
export interface StorefrontComputed {
  inStock: boolean;
  discountPercentage: number;
}

/** Product card shape returned by listings and home sections. */
export type StorefrontProductCard = Prisma.ProductGetPayload<{
  include: {
    brand: { select: { id: true; name: true; slug: true } };
    images: true;
  };
}> &
  StorefrontComputed;

/** Full product detail returned by the slug lookup. */
export type StorefrontProductDetails = Prisma.ProductGetPayload<{
  include: {
    brand: true;
    category: true;
    images: true;
    variants: { include: { inventory: true } };
  };
}> &
  StorefrontComputed & { collections: Collection[] };
