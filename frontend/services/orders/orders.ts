import { api } from '@/services/api';
import type { CreateOrderInput, Order, OrderListResult } from '@/types/order';
import type { OrderTracking } from '@/types/tracking';

/** Create an order from the current user's cart (reserves stock, clears cart). */
export function createOrder(input: CreateOrderInput): Promise<Order> {
  return api.post<Order>('/orders', input);
}

/** Fetch a single order owned by the current user. */
export function getOrder(id: string): Promise<Order> {
  return api.get<Order>(`/orders/${id}`);
}

/** A page of the current user's orders, newest first. */
export function listOrders(
  params: { page?: number; limit?: number } = {},
): Promise<OrderListResult> {
  return api.get<OrderListResult>('/orders', { params });
}

/** Shipment tracking for an order. Rejects with a 404 ApiError when unshipped. */
export function getOrderTracking(id: string): Promise<OrderTracking> {
  return api.get<OrderTracking>(`/orders/${id}/tracking`);
}
