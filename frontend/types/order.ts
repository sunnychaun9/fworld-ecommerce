/** An immutable line-item snapshot on an order. Money fields are decimal strings. */
export interface OrderItem {
  id: string;
  orderId: string;
  variantId: string | null;
  productName: string;
  productSlug: string;
  variantSku: string;
  variantSize: string | null;
  variantColor: string | null;
  unitPrice: string;
  quantity: number;
  lineTotal: string;
  createdAt: string;
}

/** The shipping address snapshot persisted on an order (JSON, no `country`). */
export interface ShippingAddressSnapshot {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
}

/**
 * `POST /orders` and `GET /orders/:id`. The order `id` doubles as the order
 * number (there is no separate human-readable number). Money fields are Prisma
 * `Decimal` values serialized as strings.
 */
export interface Order {
  id: string;
  userId: string;
  status: string;
  paymentStatus: string;
  shippingAddress: ShippingAddressSnapshot;
  subtotal: string;
  shipping: string;
  tax: string;
  discount: string;
  grandTotal: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

/** Address fields accepted by `POST /orders` (no `country`, `addressLine2` optional). */
export interface OrderShippingInput {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
}

/** Body for `POST /orders`. Items come from the server-side cart, not this payload. */
export interface CreateOrderInput {
  shippingAddress: OrderShippingInput;
}
