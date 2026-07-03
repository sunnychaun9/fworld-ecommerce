import { api } from '@/services/api';
import type { Address, CreateAddressInput, UpdateAddressInput } from '@/types/address';

export function listAddresses(): Promise<Address[]> {
  return api.get<Address[]>('/addresses');
}

export function createAddress(input: CreateAddressInput): Promise<Address> {
  return api.post<Address>('/addresses', input);
}

export function updateAddress(id: string, input: UpdateAddressInput): Promise<Address> {
  return api.patch<Address>(`/addresses/${id}`, input);
}

export function deleteAddress(id: string): Promise<{ id: string }> {
  return api.delete<{ id: string }>(`/addresses/${id}`);
}

export function setDefaultAddress(id: string): Promise<Address> {
  return api.patch<Address>(`/addresses/${id}/default`);
}
