import { api } from '@/services/api';
import type { CouponValidation, ValidateCouponInput } from '@/types/coupon';

/**
 * Validate a coupon against an order amount. Returns a `CouponValidation` even
 * when the coupon is business-invalid (`valid: false`) — only malformed input
 * rejects with an {@link import('@/services/api').ApiError}.
 */
export function validateCoupon(input: ValidateCouponInput): Promise<CouponValidation> {
  return api.post<CouponValidation>('/coupons/validate', input);
}
