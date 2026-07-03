import { api } from '@/services/api';
import type { HomeResponse } from '@/types/catalog';

/** Fetch the public storefront home payload (featured / new / best / collections). */
export function fetchHome(): Promise<HomeResponse> {
  return api.get<HomeResponse>('/store/home');
}
