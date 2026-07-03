import { api } from '@/services/api';
import type { Coupon, CouponInput } from '@/types/admin';

/**
 * Coupons visible to the admin. The backend only exposes `GET /coupons/my`
 * (active coupons within their validity window) — there is no list-all endpoint,
 * so newly-created inactive/expired coupons won't appear here until active.
 */
export function listCoupons(): Promise<Coupon[]> {
  return api.get<Coupon[]>('/coupons/my');
}

export function createCoupon(input: CouponInput): Promise<Coupon> {
  return api.post<Coupon>('/coupons', input);
}

export function updateCoupon(id: string, input: Partial<CouponInput>): Promise<Coupon> {
  return api.patch<Coupon>(`/coupons/${id}`, input);
}

export function deleteCoupon(id: string): Promise<{ id: string }> {
  return api.delete<{ id: string }>(`/coupons/${id}`);
}
