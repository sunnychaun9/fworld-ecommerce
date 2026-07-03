import { api } from '@/services/api';
import type { ProductImage } from '@/types/catalog';
import type { CreateImageInput, UpdateImageInput } from '@/types/admin';

export function listProductImages(productId: string): Promise<ProductImage[]> {
  return api.get<ProductImage[]>(`/products/${productId}/images`);
}

export function createImage(input: CreateImageInput): Promise<ProductImage> {
  return api.post<ProductImage>('/images', input);
}

export function updateImage(id: string, input: UpdateImageInput): Promise<ProductImage> {
  return api.patch<ProductImage>(`/images/${id}`, input);
}

export function deleteImage(id: string): Promise<{ id: string }> {
  return api.delete<{ id: string }>(`/images/${id}`);
}
