import { api } from '@/services/api';
import type { AdminOrderDetail, AdminOrderList, UpdateOrderStatusInput } from '@/types/admin';

export interface AdminOrdersParams {
  page?: number;
  pageSize?: number;
  status?: string;
}

export function listAdminOrders(params: AdminOrdersParams = {}): Promise<AdminOrderList> {
  return api.get<AdminOrderList>('/admin/orders', { params });
}

export function getAdminOrder(id: string): Promise<AdminOrderDetail> {
  return api.get<AdminOrderDetail>(`/admin/orders/${id}`);
}

export function updateOrderStatus(
  id: string,
  input: UpdateOrderStatusInput,
): Promise<AdminOrderDetail> {
  return api.patch<AdminOrderDetail>(`/admin/orders/${id}/status`, input);
}
