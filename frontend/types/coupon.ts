/** Body for `POST /coupons/validate`. */
export interface ValidateCouponInput {
  code: string;
  orderAmount: number;
}

/**
 * `POST /coupons/validate` result. The endpoint returns a success envelope even
 * for a business-invalid coupon: check `valid`, and read `message` for the
 * reason. `discount`/`finalAmount` are numbers.
 */
export interface CouponValidation {
  valid: boolean;
  discount: number;
  finalAmount: number;
  message: string;
}
