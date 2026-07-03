/**
 * `POST /payments/create-order` result. `amount` is in paise (integer) and
 * `key` is the Razorpay public key id — both are passed straight to the Razorpay
 * checkout, so the frontend never stores the key itself.
 */
export interface PaymentOrder {
  paymentId: string;
  razorpayOrderId: string | null;
  amount: number;
  currency: string;
  key: string;
}

/** Body for `POST /payments/verify`, assembled from the Razorpay success handler. */
export interface VerifyPaymentInput {
  paymentId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

/** `POST /payments/verify` result. `status` is `"PAID"` on success. */
export interface VerifyResult {
  paymentId: string;
  status: string;
}
