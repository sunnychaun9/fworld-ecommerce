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

/** Pagination envelope returned by store listing endpoints. */
export interface PageInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
}

/** `GET /store/products` response. */
export interface ProductListResponse {
  items: ProductCard[];
  pageInfo: PageInfo;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  sortOrder: number;
  status: string;
  seoTitle: string | null;
  seoDescription: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BrandDetail {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  description: string | null;
  website: string | null;
  status: string;
  seoTitle: string | null;
  seoDescription: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Inventory {
  id: string;
  variantId: string;
  availableStock: number;
  reservedStock: number;
  lowStockAlert: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  size: string | null;
  color: string | null;
  colorHex: string | null;
  sku: string;
  barcode: string | null;
  priceOverride: string | null;
  createdAt: string;
  updatedAt: string;
  inventory: Inventory | null;
}

/** Full product returned by `GET /store/products/:slug`. */
export interface ProductDetail {
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
  brand: BrandDetail | null;
  category: Category;
  images: ProductImage[];
  variants: ProductVariant[];
  collections: StoreCollection[];
  inStock: boolean;
  discountPercentage: number;
}

/** `GET /store/collections/:slug` response. */
export interface CollectionWithProducts {
  collection: StoreCollection;
  products: ProductCard[];
}

/** Generic admin/catalog list envelope (categories, brands). */
export interface CatalogList<T> {
  items: T[];
  pageInfo: PageInfo;
}
