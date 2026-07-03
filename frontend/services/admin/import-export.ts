import { api } from '@/services/api';
import type { ImportProduct, ImportResult } from '@/types/admin';

export function fetchImportTemplate(): Promise<Record<string, unknown>> {
  return api.get<Record<string, unknown>>('/import-export/products/template');
}

export function exportProducts(): Promise<{ count: number; products: unknown[] }> {
  return api.get<{ count: number; products: unknown[] }>('/import-export/products/export');
}

/** Import products from a JSON payload; per-row errors are returned, not thrown. */
export function importProducts(products: ImportProduct[]): Promise<ImportResult> {
  return api.post<ImportResult>('/import-export/products/import', { products });
}
