import { api } from '@/services/api';
import type { PaymentOrder, VerifyPaymentInput, VerifyResult } from '@/types/payment';

/** Create (or reuse) a Razorpay order for an existing, payable order. */
export function createPaymentOrder(orderId: string): Promise<PaymentOrder> {
  return api.post<PaymentOrder>('/payments/create-order', { orderId });
}

/** Verify a completed Razorpay payment; captures the order on success. */
export function verifyPayment(input: VerifyPaymentInput): Promise<VerifyResult> {
  return api.post<VerifyResult>('/payments/verify', input);
}
