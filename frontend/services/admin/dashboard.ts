import { api } from '@/services/api';
import type { DashboardData } from '@/types/admin';

export function fetchDashboard(): Promise<DashboardData> {
  return api.get<DashboardData>('/dashboard');
}
