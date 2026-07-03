import type { Inventory } from './catalog';
import type { OrderItem, ShippingAddressSnapshot } from './order';

export type OrderStatus =
  'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'COMPLETED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
export type DiscountType = 'PERCENTAGE' | 'FLAT';

export interface AdminUserRef {
  id: string;
  email: string;
  name: string | null;
}

// --- Dashboard (`GET /dashboard`) — aggregates are numbers, order rows strings ---
export interface DashboardData {
  sales: { revenue: number; averageOrderValue: number; paidOrders: number };
  orders: {
    total: number;
    pending: number;
    confirmed: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  };
  customers: { total: number };
  products: { active: number };
  inventory: { lowStock: number; outOfStock: number };
  revenue: { total: number };
  recentOrders: {
    id: string;
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    grandTotal: string;
    createdAt: string;
    user: AdminUserRef;
  }[];
}

// --- Admin orders (`/admin/orders`) ---
export interface AdminOrderListItem {
  id: string;
  userId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  shippingAddress: ShippingAddressSnapshot;
  subtotal: string;
  shipping: string;
  tax: string;
  discount: string;
  grandTotal: string;
  createdAt: string;
  updatedAt: string;
  user: AdminUserRef;
  _count: { items: number };
}

export interface AdminOrderList {
  items: AdminOrderListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface OrderPayment {
  id: string;
  orderId: string;
  provider: string;
  providerOrderId: string | null;
  providerPaymentId: string | null;
  amount: string;
  currency: string;
  status: PaymentStatus;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Shipment {
  id: string;
  orderId: string;
  courier: string;
  trackingNumber: string;
  trackingUrl: string | null;
  estimatedDelivery: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderStatusHistoryEntry {
  id: string;
  orderId: string;
  status: OrderStatus;
  note: string | null;
  createdAt: string;
}

export interface AdminOrderDetail {
  id: string;
  userId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  shippingAddress: ShippingAddressSnapshot;
  subtotal: string;
  shipping: string;
  tax: string;
  discount: string;
  grandTotal: string;
  createdAt: string;
  updatedAt: string;
  user: AdminUserRef;
  items: OrderItem[];
  payments: OrderPayment[];
  shipment: Shipment | null;
  statusHistory: OrderStatusHistoryEntry[];
}

export interface UpdateOrderStatusInput {
  status: OrderStatus;
  note?: string;
}

// --- Shipping ---
export interface CreateShipmentInput {
  orderId: string;
  courier: string;
  trackingNumber: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
}

export interface UpdateShipmentInput {
  courier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
  delivered?: boolean;
}

// --- Inventory (`/admin/inventory`) ---
export interface InventoryRow {
  id: string;
  variantId: string;
  availableStock: number;
  reservedStock: number;
  lowStockAlert: number;
  createdAt: string;
  updatedAt: string;
  variant: {
    id: string;
    sku: string;
    size: string | null;
    color: string | null;
    product: { id: string; name: string; slug: string };
  };
}

export interface InventoryList {
  items: InventoryRow[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdjustInventoryInput {
  variantId: string;
  type: 'INCREASE' | 'DECREASE';
  quantity: number;
  reason: string;
}

export interface StockAdjustment {
  id: string;
  variantId: string;
  reason: string;
  previousQuantity: number;
  newQuantity: number;
  adjustedBy: string;
  createdAt: string;
}

export interface AdjustmentResult {
  inventory: Inventory;
  adjustment: StockAdjustment;
}

// --- Import / export (JSON) ---
export interface ImportRowError {
  row: number;
  errors: string[];
}

export interface ImportResult {
  imported: number;
  failed: number;
  errors: ImportRowError[];
}

export interface ImportProductVariant {
  sku: string;
  size?: string;
  color?: string;
  colorHex?: string;
  priceOverride?: number;
  availableStock?: number;
  lowStockAlert?: number;
}

export interface ImportProduct {
  name: string;
  slug: string;
  categoryId: string;
  brandId?: string;
  mrp: number;
  sellingPrice: number;
  status?: ProductStatus;
  description?: string;
  variants?: ImportProductVariant[];
}

// --- Coupons ---
export interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discountType: DiscountType;
  discountValue: string;
  minOrderAmount: string | null;
  maxDiscount: string | null;
  usageLimit: number | null;
  perUserLimit: number | null;
  validFrom: string | null;
  validTo: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CouponInput {
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  usageLimit?: number;
  perUserLimit?: number;
  validFrom?: string;
  validTo?: string;
  active?: boolean;
}

// --- Products (scalar row from `/products`) ---
export interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  categoryId: string;
  brandId: string | null;
  mrp: string;
  sellingPrice: string;
  status: ProductStatus;
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
}

export interface ProductInput {
  name: string;
  slug?: string;
  shortDescription?: string;
  description?: string;
  categoryId: string;
  brandId?: string;
  mrp: number;
  sellingPrice: number;
  status?: ProductStatus;
  featured?: boolean;
  newArrival?: boolean;
  bestSeller?: boolean;
  fit?: string;
  fabric?: string;
}

// --- Product images (`/images`, URL-based) ---
export interface CreateImageInput {
  productId: string;
  url: string;
  variantId?: string;
  altText?: string;
  sortOrder?: number;
}

export interface UpdateImageInput {
  url?: string;
  variantId?: string | null;
  altText?: string;
  sortOrder?: number;
}

// --- Variants (`/variants`) ---
export interface CreateVariantInput {
  productId: string;
  sku: string;
  barcode?: string;
  size?: string;
  color?: string;
  colorHex?: string;
  priceOverride?: number;
}

export interface UpdateVariantInput {
  sku?: string;
  barcode?: string;
  size?: string;
  color?: string;
  colorHex?: string;
  priceOverride?: number;
}

// --- Categories / brands / collections inputs ---
export interface CategoryInput {
  name: string;
  slug?: string;
  description?: string;
  parentId?: string | null;
  sortOrder?: number;
  status?: 'ACTIVE' | 'ARCHIVED';
  seoTitle?: string;
  seoDescription?: string;
}

export interface BrandInput {
  name: string;
  slug?: string;
  description?: string;
  logo?: string;
  website?: string;
  status?: 'ACTIVE' | 'ARCHIVED';
  seoTitle?: string;
  seoDescription?: string;
}

export interface CollectionInput {
  name: string;
  slug?: string;
  description?: string;
  image?: string;
  status?: 'ACTIVE' | 'ARCHIVED';
  sortOrder?: number;
  seoTitle?: string;
  seoDescription?: string;
}

// --- Bulk product operations (`/admin/products/*`) ---
export interface BulkStatusInput {
  productIds: string[];
  status: ProductStatus;
}

export interface BulkFeaturedInput {
  productIds: string[];
  featured?: boolean;
  newArrival?: boolean;
  bestSeller?: boolean;
}
