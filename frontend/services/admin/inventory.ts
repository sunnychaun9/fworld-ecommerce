import { api } from '@/services/api';
import type {
  AdjustInventoryInput,
  AdjustmentResult,
  InventoryList,
  InventoryRow,
} from '@/types/admin';

export function listInventory(
  params: { page?: number; pageSize?: number } = {},
): Promise<InventoryList> {
  return api.get<InventoryList>('/admin/inventory', { params });
}

export function fetchLowStock(): Promise<InventoryRow[]> {
  return api.get<InventoryRow[]>('/admin/inventory/low-stock');
}

export function adjustInventory(input: AdjustInventoryInput): Promise<AdjustmentResult> {
  return api.post<AdjustmentResult>('/admin/inventory/adjust', input);
}
