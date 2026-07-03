import type { Inventory, ProductImage } from './catalog';

export interface CartVariant {
  id: string;
  sku: string;
  size: string | null;
  color: string | null;
  colorHex: string | null;
  priceOverride: string | null;
}

export interface CartProduct {
  id: string;
  name: string;
  slug: string;
  mrp: string;
  sellingPrice: string;
  status: string;
}

export interface CartItem {
  id: string;
  quantity: number;
  /** Numeric (backend computes these on read). */
  unitPrice: number;
  lineTotal: number;
  variant: CartVariant;
  product: CartProduct;
  inventory: Inventory | null;
  images: ProductImage[];
}

/** `GET /cart` and cart mutation responses. */
export interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
  totalItems: number;
}
