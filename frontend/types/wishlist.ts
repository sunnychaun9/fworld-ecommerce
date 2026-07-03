import type { ProductImage } from './catalog';

export interface WishlistProduct {
  id: string;
  name: string;
  slug: string;
  mrp: string;
  sellingPrice: string;
  status: string;
  images: ProductImage[];
}

/** `GET /wishlist` entry. */
export interface WishlistEntry {
  id: string;
  userId: string;
  productId: string;
  createdAt: string;
  product: WishlistProduct;
}
