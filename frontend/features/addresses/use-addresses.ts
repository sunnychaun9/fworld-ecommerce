'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/constants/query-keys';
import { useIsAuthenticated } from '@/features/auth/use-auth';
import {
  createAddress,
  deleteAddress,
  listAddresses,
  setDefaultAddress,
  updateAddress,
} from '@/services/addresses';
import type { CreateAddressInput, UpdateAddressInput } from '@/types/address';

/** The current user's saved addresses. Only fetched when authenticated. */
export function useAddresses() {
  const authenticated = useIsAuthenticated();
  return useQuery({
    queryKey: queryKeys.addresses(),
    queryFn: listAddresses,
    enabled: authenticated,
    staleTime: 60_000,
  });
}

export function useCreateAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAddressInput) => createAddress(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.addresses() }),
  });
}

export function useUpdateAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateAddressInput }) =>
      updateAddress(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.addresses() }),
  });
}

export function useDeleteAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAddress(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.addresses() }),
  });
}

export function useSetDefaultAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => setDefaultAddress(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.addresses() }),
  });
}
