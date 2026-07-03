import { api } from '@/services/api';
import type { CreateReturnInput, ReturnRequest } from '@/types/return';

export function listReturns(): Promise<ReturnRequest[]> {
  return api.get<ReturnRequest[]>('/returns');
}

export function getReturn(id: string): Promise<ReturnRequest> {
  return api.get<ReturnRequest>(`/returns/${id}`);
}

export function createReturn(input: CreateReturnInput): Promise<ReturnRequest> {
  return api.post<ReturnRequest>('/returns', input);
}
