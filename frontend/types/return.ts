export type ReturnStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'RECEIVED' | 'REFUNDED';

/** A return request (`GET /returns`). Money fields are decimal strings. */
export interface ReturnRequest {
  id: string;
  userId: string;
  orderId: string;
  orderItemId: string;
  status: ReturnStatus;
  reason: string;
  refundAmount: string;
  decisionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Body for `POST /returns` — a return is requested per order item. */
export interface CreateReturnInput {
  orderItemId: string;
  reason: string;
}
