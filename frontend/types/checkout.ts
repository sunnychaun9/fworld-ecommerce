import type { ProductImage } from './catalog';

/** A validated checkout line item (`POST /checkout`). Money fields are numbers. */
export interface CheckoutItem {
  variantId: string;
  quantity: number;
  /** Numeric (backend computes on prepare). */
  unitPrice: number;
  lineTotal: number;
  product: { id: string; name: string; slug: string };
  variant: {
    id: string;
    sku: string;
    size: string | null;
    color: string | null;
    colorHex: string | null;
  };
  image: ProductImage | null;
}

/**
 * `POST /checkout` — a computed order summary derived from the current cart.
 * No order is created and no payment is taken. All money fields are numbers;
 * `shipping`, `tax` and `discount` are currently always 0 server-side.
 */
export interface CheckoutSummary {
  items: CheckoutItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  grandTotal: number;
}
