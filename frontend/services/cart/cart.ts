import { api } from '@/services/api';
import type { Cart } from '@/types/cart';

export function getCart(): Promise<Cart> {
  return api.get<Cart>('/cart');
}

export function addCartItem(input: { variantId: string; quantity: number }): Promise<Cart> {
  return api.post<Cart>('/cart/items', input);
}

export function updateCartItem(itemId: string, quantity: number): Promise<Cart> {
  return api.patch<Cart>(`/cart/items/${itemId}`, { quantity });
}

export function removeCartItem(itemId: string): Promise<Cart> {
  return api.delete<Cart>(`/cart/items/${itemId}`);
}

export function clearCart(): Promise<Cart> {
  return api.delete<Cart>('/cart');
}
