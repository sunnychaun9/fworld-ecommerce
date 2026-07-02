import { Injectable, UnprocessableEntityException } from '@nestjs/common';

import { AdminProductsRepository } from './admin-products.repository';
import { BulkDeleteDto } from './dto/bulk-delete.dto';
import { BulkFeaturedDto } from './dto/bulk-featured.dto';
import { BulkStatusDto } from './dto/bulk-status.dto';

/**
 * Bulk product operations. Soft validation: unknown ids are ignored and each
 * operation returns the affected count. Holds business logic only; every Prisma
 * query is delegated to {@link AdminProductsRepository}.
 */
@Injectable()
export class AdminProductsService {
  constructor(private readonly repository: AdminProductsRepository) {}

  async setStatus(dto: BulkStatusDto) {
    const affected = await this.repository.updateStatus(dto.productIds, dto.status);
    return { affected };
  }

  async setFeatured(dto: BulkFeaturedDto) {
    const data: Record<string, boolean> = {};
    if (dto.featured !== undefined) data.featured = dto.featured;
    if (dto.newArrival !== undefined) data.newArrival = dto.newArrival;
    if (dto.bestSeller !== undefined) data.bestSeller = dto.bestSeller;
    if (Object.keys(data).length === 0) {
      throw new UnprocessableEntityException({
        code: 'NO_FLAGS_PROVIDED',
        message: 'Provide at least one of featured, newArrival or bestSeller',
      });
    }
    const affected = await this.repository.updateFlags(dto.productIds, data);
    return { affected };
  }

  async softDelete(dto: BulkDeleteDto) {
    const affected = await this.repository.updateStatus(dto.productIds, 'ARCHIVED');
    return { affected };
  }

  async restore(dto: BulkDeleteDto) {
    const affected = await this.repository.updateStatus(dto.productIds, 'DRAFT');
    return { affected };
  }
}
