import { api } from '@/services/api';
import type { WishlistEntry } from '@/types/wishlist';

export function getWishlist(): Promise<WishlistEntry[]> {
  return api.get<WishlistEntry[]>('/wishlist');
}

export function addWishlist(productId: string): Promise<WishlistEntry> {
  return api.post<WishlistEntry>('/wishlist', { productId });
}

export function removeWishlist(productId: string): Promise<{ productId: string }> {
  return api.delete<{ productId: string }>(`/wishlist/${productId}`);
}
