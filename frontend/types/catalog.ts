/**
 * Storefront catalog types mirroring the backend's public read shapes
 * (`/api/v1/store/*`). Money is serialised by the API as a decimal string.
 */

export interface Brand {
  id: string;
  name: string;
  slug: string;
}

export interface ProductImage {
  id: string;
  productId: string;
  variantId: string | null;
  url: string;
  altText: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/** Lean product shape returned by home sections and listings. */
export interface ProductCard {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  categoryId: string;
  brandId: string | null;
  mrp: string;
  sellingPrice: string;
  status: string;
  featured: boolean;
  newArrival: boolean;
  bestSeller: boolean;
  fit: string | null;
  fabric: string | null;
  sleeveLength: string | null;
  pattern: string | null;
  neckType: string | null;
  occasion: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  createdAt: string;
  updatedAt: string;
  brand: Brand | null;
  images: ProductImage[];
  /** Computed at read time by the backend. */
  inStock: boolean;
  discountPercentage: number;
}

export interface StoreCollection {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  status: string;
  sortOrder: number;
  seoTitle: string | null;
  seoDescription: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Payload of `GET /api/v1/store/home`. */
export interface HomeResponse {
  featured: ProductCard[];
  newArrivals: ProductCard[];
  bestSellers: ProductCard[];
  collections: StoreCollection[];
}
