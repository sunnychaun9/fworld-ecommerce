'use client';

import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/constants/query-keys';
import { useIsAuthenticated } from '@/features/auth/use-auth';
import { fetchDashboard } from '@/services/admin';

export function useDashboard() {
  const authenticated = useIsAuthenticated();
  return useQuery({
    queryKey: queryKeys.admin.dashboard(),
    queryFn: fetchDashboard,
    enabled: authenticated,
    staleTime: 60_000,
  });
}
