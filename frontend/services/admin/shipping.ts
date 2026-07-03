import { api } from '@/services/api';
import type { CreateShipmentInput, Shipment, UpdateShipmentInput } from '@/types/admin';

export function createShipment(input: CreateShipmentInput): Promise<Shipment> {
  return api.post<Shipment>('/shipping', input);
}

export function updateShipment(id: string, input: UpdateShipmentInput): Promise<Shipment> {
  return api.patch<Shipment>(`/shipping/${id}`, input);
}

export function getShipment(id: string): Promise<Shipment> {
  return api.get<Shipment>(`/shipping/${id}`);
}
