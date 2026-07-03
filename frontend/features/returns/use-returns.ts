'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/constants/query-keys';
import { useIsAuthenticated } from '@/features/auth/use-auth';
import { createReturn, getReturn, listReturns } from '@/services/returns';
import type { CreateReturnInput } from '@/types/return';

/** All of the current user's return requests. */
export function useReturns() {
  const authenticated = useIsAuthenticated();
  return useQuery({
    queryKey: queryKeys.returns(),
    queryFn: listReturns,
    enabled: authenticated,
    staleTime: 30_000,
  });
}

export function useReturn(id: string | undefined) {
  const authenticated = useIsAuthenticated();
  return useQuery({
    queryKey: queryKeys.returnDetail(id ?? 'none'),
    queryFn: () => getReturn(id as string),
    enabled: authenticated && Boolean(id),
    retry: false,
  });
}

export function useCreateReturn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateReturnInput) => createReturn(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.returns() }),
  });
}
