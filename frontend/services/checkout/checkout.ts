import { api } from '@/services/api';
import type { CheckoutSummary } from '@/types/checkout';

/** Compute the order summary for the current user's cart. Creates nothing. */
export function prepareCheckout(couponCode?: string | null): Promise<CheckoutSummary> {
  return api.post<CheckoutSummary>('/checkout', { couponCode: couponCode ?? null });
}
