import { api } from '@/services/api';
import type { CreateOrderInput, Order } from '@/types/order';

/** Create an order from the current user's cart (reserves stock, clears cart). */
export function createOrder(input: CreateOrderInput): Promise<Order> {
  return api.post<Order>('/orders', input);
}

/** Fetch a single order owned by the current user. */
export function getOrder(id: string): Promise<Order> {
  return api.get<Order>(`/orders/${id}`);
}
