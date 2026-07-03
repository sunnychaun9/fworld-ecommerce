import { api } from '@/services/api';
import type { ReturnRequest } from '@/types/return';

export interface UpdateReturnInput {
  status: 'APPROVED' | 'REJECTED' | 'RECEIVED' | 'REFUNDED';
  decisionReason?: string;
  refundAmount?: number;
}

/** Fetch a return by id (user-scoped on the backend; admins act on known ids). */
export function getReturn(id: string): Promise<ReturnRequest> {
  return api.get<ReturnRequest>(`/returns/${id}`);
}

/** Admin-only lifecycle transition (`PATCH /returns/:id`). */
export function updateReturn(id: string, input: UpdateReturnInput): Promise<ReturnRequest> {
  return api.patch<ReturnRequest>(`/returns/${id}`, input);
}
